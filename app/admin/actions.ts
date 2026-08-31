"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { clientIp, formatRetryAfter, rateLimit } from "@/lib/rate-limit";
import { loginSchema, firstError } from "@/lib/validation/admin";

export interface LoginState {
  error?: string;
}

// Tighter than the public login: there are only ever a handful of staff
// accounts, so a legitimate person will not hit this, and the account is worth
// far more.
const ADMIN_PER_IP = { limit: 10, windowMs: 15 * 60 * 1000 };
const ADMIN_PER_EMAIL = { limit: 5, windowMs: 15 * 60 * 1000 };

/**
 * Sign-in for the dashboard.
 *
 * Checks the role BEFORE opening a session, so a signed-in visitor never ends
 * up holding an admin cookie they cannot use. The wrong-role message is
 * deliberately the same as the wrong-password one: telling a stranger that an
 * address exists but lacks access is still telling them the address exists.
 */
export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const email = parsed.data.email.trim().toLowerCase();
  const { password } = parsed.data;

  const ip = await clientIp();
  const perIp = rateLimit(`admin:ip:${ip}`, ADMIN_PER_IP.limit, ADMIN_PER_IP.windowMs);
  if (!perIp.ok) {
    return {
      error: `Too many attempts from here. Try again in ${formatRetryAfter(perIp.retryAfter)}.`,
    };
  }
  const perEmail = rateLimit(
    `admin:email:${email}`,
    ADMIN_PER_EMAIL.limit,
    ADMIN_PER_EMAIL.windowMs,
  );
  if (!perEmail.ok) {
    return {
      error: `Too many attempts for this account. Try again in ${formatRetryAfter(perEmail.retryAfter)}.`,
    };
  }

  const account = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });
  if (!account || (account.role !== "ADMIN" && account.role !== "EDITOR")) {
    return { error: "Email or password is incorrect." };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/admin" });
    return {};
  } catch (error) {
    // Only an AuthError means the credentials were rejected. signIn signals
    // success by throwing a redirect, which must pass through untouched.
    if (error instanceof AuthError) {
      return { error: "Email or password is incorrect." };
    }
    throw error;
  }
}
