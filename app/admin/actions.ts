"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validation/admin";
import {
  clearRateLimit,
  clientIp,
  formatRetryAfter,
  rateLimit,
} from "@/lib/rate-limit";

export interface LoginState {
  error?: string;
}

// Tighter than the public login: there are only ever a handful of admins, so a
// legitimate person will not hit this, and the account is worth far more.
const ADMIN_PER_IP = { limit: 10, windowMs: 15 * 60 * 1000 };
const ADMIN_PER_EMAIL = { limit: 5, windowMs: 15 * 60 * 1000 };

/**
 * Shared login action for the admin dashboard. Verifies the user via prisma +
 * verifyPassword, then checks the account is an ADMIN before opening a session.
 * Returns friendly errors; redirects to /admin on success.
 */
export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const ip = await clientIp();
  const perIp = rateLimit(`admin:ip:${ip}`, ADMIN_PER_IP.limit, ADMIN_PER_IP.windowMs);
  if (!perIp.ok) {
    return {
      error: `Too many attempts. Try again in ${formatRetryAfter(perIp.retryAfter)}.`,
    };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Invalid credentials" };
  }

  const email = parsed.data.email.toLowerCase();
  const emailKey = `admin:email:${email}`;
  const perEmail = rateLimit(emailKey, ADMIN_PER_EMAIL.limit, ADMIN_PER_EMAIL.windowMs);
  if (!perEmail.ok) {
    return {
      error: `Too many attempts. Try again in ${formatRetryAfter(perEmail.retryAfter)}.`,
    };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Always run a compare to keep timing roughly constant for unknown emails.
  const hash = user?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinva";
  const ok = await verifyPassword(parsed.data.password, hash);

  if (!user || !ok) {
    return { error: "Invalid credentials" };
  }
  if (user.role !== "ADMIN") {
    return { error: "Not an admin account." };
  }

  clearRateLimit(emailKey);
  clearRateLimit(`admin:ip:${ip}`);

  await createSession(user.id);
  redirect("/admin");
}

