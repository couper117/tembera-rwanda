"use server";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { clientIp, formatRetryAfter, rateLimit } from "@/lib/rate-limit";
import { siteUrl } from "@/lib/site-url";

/**
 * Forgotten-password recovery.
 *
 * Reuses Auth.js's `VerificationToken` table rather than adding one. That
 * table is a bare (identifier, token, expires) triple with no opinion about
 * what it verifies, so namespacing the identifier — `reset:<email>` — keeps
 * these rows from ever colliding with email-verification rows added later.
 * No migration was needed for any of this.
 *
 * Three rules shape the code below, and each one is a decision rather than a
 * style:
 *
 * 1. **Only a hash of the token is stored.** The emailed token is a bearer
 *    credential: whoever holds it can take the account. Storing it in plain
 *    text would mean a leaked database row — or a stray query in a log — hands
 *    over live account access. Hashing makes the stored row worthless on its
 *    own, exactly as it does for passwords. SHA-256 rather than bcrypt is
 *    right here: the token is 256 bits of CSPRNG output, so it has none of the
 *    guessability that makes password hashing expensive on purpose.
 *
 * 2. **Requesting a reset never reveals whether an account exists.** Same
 *    message, whatever the answer. `loginAction` already refuses to say which
 *    half of a sign-in was wrong; a reset form that says "no such account"
 *    would hand back the account-enumeration oracle that care was taken to
 *    close.
 *
 * 3. **A completed reset signs every other session out.** Someone resetting a
 *    password they did not lose is responding to a session they believe was
 *    stolen, and leaving that session alive would defeat the entire exercise.
 */

export interface ResetState {
  error?: string;
  /** Set once the request is accepted — the screen switches to "check your inbox". */
  sent?: boolean;
  /** Set once a new password is in place. */
  ok?: boolean;
}

/** How long a link is good for. Long enough to find the mail, short enough
 *  that one left in an inbox is not a standing key to the account. */
const TOKEN_TTL_MS = 60 * 60 * 1000;

// Reset requests are cheap for us and expensive for the person whose inbox
// fills up, so the per-address limit here is really anti-harassment. The per-IP
// limit is the one that stops a script walking an address list to see which
// addresses bounce.
const RESET_PER_IP = { limit: 10, windowMs: 60 * 60 * 1000 };
const RESET_PER_EMAIL = { limit: 3, windowMs: 60 * 60 * 1000 };
const CONSUME_PER_IP = { limit: 10, windowMs: 15 * 60 * 1000 };

const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
});

const consumeSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirm: z.string().min(1, "Confirm your new password."),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Those passwords do not match.",
    path: ["confirm"],
  });

function identifierFor(email: string): string {
  return `reset:${email}`;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/* --------------------------------------------------------------- requesting */

export async function requestResetAction(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const parsed = requestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const { email } = parsed.data;

  const ip = await clientIp();
  const perIp = rateLimit(`reset:ip:${ip}`, RESET_PER_IP.limit, RESET_PER_IP.windowMs);
  if (!perIp.ok) {
    return {
      error: `Too many requests from here. Try again in ${formatRetryAfter(perIp.retryAfter)}.`,
    };
  }
  const perEmail = rateLimit(
    `reset:email:${email}`,
    RESET_PER_EMAIL.limit,
    RESET_PER_EMAIL.windowMs,
  );
  // Note this returns the *same* success shape as a real send. Saying "too
  // many requests for this account" would confirm the account exists, which is
  // precisely what rule 2 above is protecting.
  if (!perEmail.ok) return { sent: true };

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true },
  });

  // No account: stop here, but report success. The work skipped is invisible
  // from outside, and deliberately so.
  if (!user) return { sent: true };

  const token = randomBytes(32).toString("base64url");
  const identifier = identifierFor(email);

  // One live link per account. Issuing a second must retire the first,
  // otherwise every request ever made stays usable until it expires.
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: {
      identifier,
      token: hashToken(token),
      expires: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const link = `${await siteUrl()}/reset/${token}`;
  const result = await sendEmail({
    to: email,
    subject: "Reset your Tembera password",
    text: [
      `Hello ${user.name},`,
      "",
      "Someone asked to reset the password on your Tembera account. If that",
      "was you, open the link below within the next hour:",
      "",
      link,
      "",
      "If it was not you, you can ignore this message — your password has not",
      "changed, and the link above does nothing until it is opened.",
      "",
      "— Tembera",
    ].join("\n"),
  });

  if (!result.ok) {
    // Deliberately not surfaced as a failure of the *request*. The token is
    // valid and the row is written; what broke is our side of the delivery,
    // and telling the reader "something went wrong" would send them round the
    // loop again to no effect. It is logged where an operator will see it.
    console.error("[password-reset] token issued but not delivered:", result.error);
  }

  return { sent: true };
}

/* ---------------------------------------------------------------- consuming */

/**
 * Look up a token and return the account it belongs to, or null.
 *
 * Shared by the reset page (which checks before rendering a form nobody can
 * submit) and by the action (which must check again — the page's verdict is a
 * render-time courtesy, not a permission).
 */
export async function findResetTarget(
  token: string,
): Promise<{ email: string; name: string } | null> {
  if (!token) return null;

  const row = await prisma.verificationToken.findFirst({
    where: { token: hashToken(token), identifier: { startsWith: "reset:" } },
    select: { identifier: true, token: true, expires: true },
  });
  if (!row) return null;

  // The lookup above is already an equality match on a hash, so this adds
  // nothing against timing analysis by itself — it is here so that the
  // comparison stays constant-time if the query is ever loosened.
  const supplied = Buffer.from(hashToken(token));
  const stored = Buffer.from(row.token);
  if (supplied.length !== stored.length || !timingSafeEqual(supplied, stored)) {
    return null;
  }

  if (row.expires.getTime() < Date.now()) {
    // Expired links are dead weight; clear as we find them.
    await prisma.verificationToken.deleteMany({
      where: { identifier: row.identifier, token: row.token },
    });
    return null;
  }

  const email = row.identifier.slice("reset:".length);
  const user = await prisma.user.findUnique({
    where: { email },
    select: { name: true },
  });
  if (!user) return null;

  return { email, name: user.name };
}

export async function consumeResetAction(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const ip = await clientIp();
  const perIp = rateLimit(
    `reset:consume:${ip}`,
    CONSUME_PER_IP.limit,
    CONSUME_PER_IP.windowMs,
  );
  if (!perIp.ok) {
    return {
      error: `Too many attempts from here. Try again in ${formatRetryAfter(perIp.retryAfter)}.`,
    };
  }

  const parsed = consumeSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const target = await findResetTarget(parsed.data.token);
  if (!target) {
    return {
      error: "That reset link is no longer valid. Request a new one below.",
    };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  // Set the password, retire every session, and burn the token together. A
  // half-applied reset is the worst outcome available: a changed password with
  // a live token still on it, or a token spent against a password that never
  // landed.
  await prisma.$transaction([
    prisma.user.update({
      where: { email: target.email },
      // Bumping tokenVersion is what actually signs the other sessions out —
      // see the note in lib/auth.ts on why the version is re-checked per
      // request rather than trusted from the cookie.
      data: { passwordHash, tokenVersion: { increment: 1 } },
    }),
    prisma.verificationToken.deleteMany({
      where: { identifier: identifierFor(target.email) },
    }),
  ]);

  // No automatic sign-in. changePasswordAction signs back in because the
  // person is already authenticated and would otherwise be ejected mid-session;
  // here the only thing proved is possession of an inbox, so the new password
  // should be typed once more against the real login screen.
  return { ok: true };
}
