"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/auth";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientIp, formatRetryAfter, rateLimit } from "@/lib/rate-limit";

export interface AuthState {
  error?: string;
}

// Two limits, because they stop different attacks. The per-address limit slows
// a script working through a password list; the per-email limit protects one
// account even when the attempts arrive from many addresses.
const LOGIN_PER_IP = { limit: 20, windowMs: 15 * 60 * 1000 };
const LOGIN_PER_EMAIL = { limit: 5, windowMs: 15 * 60 * 1000 };
const REGISTER_PER_IP = { limit: 5, windowMs: 60 * 60 * 1000 };

const registerSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  handle: z.string().trim().optional(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Enter your email address."),
  password: z.string().min(1, "Enter your password."),
});

function slugifyHandle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
}

/** Append -2, -3 … until the handle is free. */
async function uniqueHandle(base: string): Promise<string> {
  const stem = base || "visitor";
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? stem : `${stem}${n}`;
    const taken = await prisma.user.findUnique({
      where: { handle: candidate },
      select: { handle: true },
    });
    if (!taken) return candidate;
  }
}

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const ip = await clientIp();
  const throttled = rateLimit(
    `register:${ip}`,
    REGISTER_PER_IP.limit,
    REGISTER_PER_IP.windowMs,
  );
  if (!throttled.ok) {
    return {
      error: `Too many accounts created from here. Try again in ${formatRetryAfter(throttled.retryAfter)}.`,
    };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    handle: formData.get("handle") || undefined,
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const handle = await uniqueHandle(slugifyHandle(parsed.data.handle || name));

  await prisma.user.create({
    data: {
      email,
      name,
      handle,
      passwordHash: await hashPassword(password),
      role: "USER",
    },
  });

  // A brand-new account is always a USER, so there is no role to look up.
  // Straight into onboarding rather than the profile. A brand-new account has
  // nothing on its profile to look at, and the three questions asked next are
  // what decide whether the home page is a guide to their trip or the same
  // page everyone else gets.
  return signInWith(email, password, "/welcome");
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const { email, password } = parsed.data;

  const ip = await clientIp();
  const perIp = rateLimit(`login:ip:${ip}`, LOGIN_PER_IP.limit, LOGIN_PER_IP.windowMs);
  if (!perIp.ok) {
    return {
      error: `Too many attempts from here. Try again in ${formatRetryAfter(perIp.retryAfter)}.`,
    };
  }
  const perEmail = rateLimit(
    `login:email:${email}`,
    LOGIN_PER_EMAIL.limit,
    LOGIN_PER_EMAIL.windowMs,
  );
  if (!perEmail.ok) {
    return {
      error: `Too many attempts for this account. Try again in ${formatRetryAfter(perEmail.retryAfter)}.`,
    };
  }

  return signInWith(email, password, await destinationFor(email));
}

/**
 * Where signing in should land you.
 *
 * Staff go to the dashboard and businesses to their own, because that is what
 * they signed in to do — being dropped on a visitor profile and having to find
 * the way in from there is a small daily tax on the people who use this most.
 *
 * Looked up before the password is checked, which is safe: the answer never
 * reaches the browser unless the sign-in actually succeeds, and an unknown
 * address simply gets the default.
 */
async function destinationFor(email: string): Promise<string> {
  const account = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });
  switch (account?.role) {
    case "ADMIN":
    case "EDITOR":
      return "/admin";
    case "BUSINESS":
      // The dashboard, not /business — that is the marketing page, and
      // sending an owner who just signed in to a sales pitch is absurd.
      return "/business/dashboard";
    default:
      return "/profile";
  }
}

/**
 * The one place that calls Auth.js.
 *
 * `signIn` reports SUCCESS by throwing a redirect, which Next then uses to
 * navigate. Only an AuthError means the credentials were actually rejected;
 * everything else must be rethrown untouched. Catching too broadly here would
 * turn a successful sign-in into a silent "email or password is incorrect" —
 * the kind of bug that presents as "the button does nothing".
 */
async function signInWith(
  email: string,
  password: string,
  redirectTo: string,
): Promise<AuthState> {
  try {
    await signIn("credentials", { email, password, redirectTo });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      /*
       * Two very different failures arrive here as the same class, and telling
       * a reader their password is wrong when the database was unreachable is
       * the worst outcome in this file: it is false, it is unfalsifiable from
       * their side, and it sends them to reset a password that was fine.
       *
       * `CredentialsSignin` is authorize() returning null — genuinely wrong
       * credentials. Anything else (Auth.js wraps a throw as
       * CallbackRouteError) means authorize itself blew up, which after
       * withDbRetry means the connection really is gone.
       */
      if (error.type === "CredentialsSignin") {
        // Never say which half was wrong: "no such account" tells an attacker
        // which addresses are registered.
        return { error: "Email or password is incorrect." };
      }
      return {
        error:
          "We could not reach the database just now — this is us, not your password. Try again in a moment.",
      };
    }
    throw error;
  }
}
