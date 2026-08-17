import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  decodeSession,
  encodeSession,
  signToken,
  verifyToken,
} from "@/lib/session-token";
import type { Role, User } from "@prisma/client";

// One signed, httpOnly session cookie for the whole app. Admins are just users
// with role ADMIN — there is no separate admin table or second login system.

export const COOKIE_NAME = "tembera_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
const MAX_AGE_MS = MAX_AGE_SECONDS * 1000;

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("ADMIN_SESSION_SECRET is not set");
  return s;
}

// The token format and its cryptography live in lib/session-token.ts so they
// can be unit tested without the Next runtime. This module supplies the secret
// and joins them to cookies and the database.
const sign = (value: string) => signToken(value, secret());
const verify = (signed: string | undefined) => verifyToken(signed, secret());

/* ----------------------------------------------------------- passwords */

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/* ------------------------------------------------------------- session */

/**
 * Issue a session cookie.
 *
 * The payload carries the user's current `tokenVersion`, which is what makes
 * these stateless cookies revocable: bumping the column invalidates every
 * cookie already issued, with nothing to delete server-side.
 */
export async function createSession(userId: number): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tokenVersion: true },
  });
  if (!user) throw new Error(`Cannot create a session for unknown user ${userId}`);

  const payload = encodeSession(userId, user.tokenVersion);
  const store = await cookies();
  store.set(COOKIE_NAME, sign(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/**
 * The signed-in user, or null. Memoised per request so the many components that
 * need "who am I" don't each hit the database.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const store = await cookies();
  const value = verify(store.get(COOKIE_NAME)?.value);
  if (!value) return null;

  // Format, expiry and the future-dated check all live in decodeSession.
  // Cookies issued before tokenVersion existed have two parts and are rejected
  // there — signing those sessions out once, which is the right outcome for a
  // session format changed on security grounds.
  const session = decodeSession(value, MAX_AGE_MS);
  if (!session) return null;
  const { userId, tokenVersion } = session;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  // The revocation check: a cookie issued before the version was bumped is
  // no longer a session, however well-signed and unexpired it is.
  if (user.tokenVersion !== tokenVersion) return null;

  return user;
});

/**
 * Invalidate every session belonging to a user, including the caller's.
 * Callers that want to keep the current browser signed in should follow this
 * with `createSession(userId)`.
 */
export async function revokeAllSessions(userId: number): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });
}

export async function requireUser(redirectTo = "/login"): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(redirectTo);
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user || user.role !== ("ADMIN" satisfies Role)) redirect("/admin/login");
  return user;
}

export function isAdmin(user: Pick<User, "role"> | null): boolean {
  return user?.role === "ADMIN";
}
