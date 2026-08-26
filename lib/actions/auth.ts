"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword, verifyPassword } from "@/lib/auth";
import {
  clearRateLimit,
  clientIp,
  formatRetryAfter,
  rateLimit,
} from "@/lib/rate-limit";

export interface AuthState {
  error?: string;
}

// Two limits, because they stop different attacks. The per-address limit slows
// a script working through a password list; the per-email limit protects one
// account even when the attempts arrive from many addresses.
const LOGIN_PER_IP = { limit: 20, windowMs: 15 * 60 * 1000 };
const LOGIN_PER_EMAIL = { limit: 5, windowMs: 15 * 60 * 1000 };
const REGISTER_PER_IP = { limit: 5, windowMs: 60 * 60 * 1000 };

function slugifyHandle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
}

const registerSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  handle: z.string().trim().optional(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

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
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }
  const { name, email, password } = parsed.data;

  // Derive a unique handle from the requested one (or the email local-part).
  const base = slugifyHandle(parsed.data.handle || email.split("@")[0]) || "user";
  let handle = base;
  for (let i = 2; await prisma.user.findUnique({ where: { handle } }); i++) {
    handle = `${base}${i}`;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const user = await prisma.user.create({
    data: {
      name,
      email,
      handle,
      passwordHash: await hashPassword(password),
      role: "USER",
    },
  });

  await createSession(user.id);
  redirect("/");
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const ip = await clientIp();
  const perIp = rateLimit(`login:ip:${ip}`, LOGIN_PER_IP.limit, LOGIN_PER_IP.windowMs);
  if (!perIp.ok) {
    return {
      error: `Too many sign-in attempts. Try again in ${formatRetryAfter(perIp.retryAfter)}.`,
    };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }
  const { email, password } = parsed.data;

  // Checked after validation so a malformed submission doesn't burn an attempt,
  // but before the database is touched so throttled requests cost nothing.
  const emailKey = `login:email:${email}`;
  const perEmail = rateLimit(
    emailKey,
    LOGIN_PER_EMAIL.limit,
    LOGIN_PER_EMAIL.windowMs,
  );
  if (!perEmail.ok) {
    return {
      error: `Too many sign-in attempts. Try again in ${formatRetryAfter(perEmail.retryAfter)}.`,
    };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Constant-ish time: always run a compare even for unknown emails.
  const hash = user?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinva";
  const ok = await verifyPassword(password, hash);
  if (!user || !ok) return { error: "Invalid email or password." };

  // Only a real sign-in clears the counters — a failed attempt must keep
  // counting, or the limit could be reset by making more attempts.
  clearRateLimit(emailKey);
  clearRateLimit(`login:ip:${ip}`);

  await createSession(user.id);
  redirect("/");
}

