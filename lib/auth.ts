import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

/**
 * Who is asking, and what they are allowed to do.
 *
 * Auth.js owns the cookie and the token; this module is the app's own view of
 * it, kept at the exact shape the UI already consumes so the screens did not
 * have to change. `app/(site)/layout.tsx` reads every field on `User` below to
 * build its account context.
 */

export interface User {
  id: number;
  email: string;
  name: string;
  handle: string;
  bio: string;
  homeCity: string;
  role: Role;
  emailVerified: Date | null;
  createdAt: Date;
}

/**
 * The signed-in user, or null.
 *
 * Deliberately re-reads the row rather than trusting the token. That costs one
 * query per request, and buys two things the token alone cannot give:
 *
 *   - **Revocation.** The token carries the `tokenVersion` it was issued at.
 *     Bumping that column — on a password change, or from "sign out
 *     everywhere" — invalidates every token already handed out, without a
 *     server-side session table to sweep.
 *   - **Freshness.** A role change or a profile edit takes effect on the next
 *     request instead of whenever the token happens to expire. Demoting an
 *     admin has to be immediate.
 *
 * React's `cache` collapses this to one query per request no matter how many
 * components ask.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Auth.js types the id as a string; ours are ints. See the note in auth.ts.
  const id = Number(session.user.id);
  if (!Number.isInteger(id)) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      handle: true,
      bio: true,
      homeCity: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      tokenVersion: true,
    },
  });
  if (!user) return null;

  // A token issued before the version was bumped is no longer valid, even
  // though its signature and expiry are both still good.
  //
  // NOTE: this is the ONLY place that check happens. Auth.js's own
  // `/api/auth/session` endpoint validates the signature and nothing else, so
  // it will still echo a revoked token back. Application code must therefore
  // ask this function who the user is — never `auth()` directly, and never the
  // session endpoint. Every guard below routes through here for that reason.
  if (session.user.tokenVersion !== user.tokenVersion) return null;

  const { tokenVersion: _tokenVersion, ...rest } = user;
  return rest;
});

/* --------------------------------------------------------------- passwords */

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/* ------------------------------------------------------------------- roles */

export function isAdmin(user: Pick<User, "role"> | null): boolean {
  return user?.role === "ADMIN";
}

/** ADMIN or EDITOR: the people who maintain the catalogue. */
export function isStaff(user: Pick<User, "role"> | null): boolean {
  return user?.role === "ADMIN" || user?.role === "EDITOR";
}

/* ------------------------------------------------------------------ guards */
//
// These are the enforcement points. Hiding a nav item is presentation; a guard
// called as the first line of a page or a server action is the actual
// permission. Every mutating action must call one — a server action is a POST
// endpoint, reachable by anyone who can craft a request, whether or not the
// button that calls it was rendered.

export async function requireUser(redirectTo = "/login"): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(redirectTo);
  return user;
}

/**
 * Staff-only. Covers the whole admin dashboard from
 * app/admin/(dash)/layout.tsx, and every catalogue-editing action.
 */
export async function requireStaff(): Promise<User> {
  const user = await getCurrentUser();
  // Signed out means "sign in"; signed in but not staff means "this is not
  // yours" — send them to their own dashboard rather than to a login form they
  // are already past. Relying on /login to bounce them onward works, but a
  // double redirect is harder to follow when it misbehaves.
  if (!user) redirect("/login");
  if (!isStaff(user)) redirect("/profile");
  return user;
}

/**
 * ADMIN only — accounts, roles, settings and business standing.
 *
 * An EDITOR maintains the catalogue and nothing else. That split exists
 * because a government body has many people who should be able to correct a
 * listing and very few who should be able to delete an account.
 */
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // An EDITOR is staff, so bounce them back into the dashboard they do have,
  // with a reason. Anyone else is not staff at all.
  if (isStaff(user) && user.role !== "ADMIN") {
    redirect("/admin?error=Admins%20only.");
  }
  if (user.role !== "ADMIN") redirect("/profile");
  return user;
}

/**
 * A business account, for the /business/dashboard screens.
 *
 * ADMIN is allowed through as well: somebody has to be able to look at what a
 * business sees when they report that it is wrong, and locking staff out of it
 * only leads to shared passwords.
 */
export async function requireBusiness(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "BUSINESS" && user.role !== "ADMIN") redirect("/profile");
  return user;
}
