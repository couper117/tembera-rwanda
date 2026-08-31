import "server-only";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

/** The place ids a user has saved, most-recent-first. */
export async function getSavedPlaceIds(userId: number): Promise<string[]> {
  const rows = await prisma.savedPlace.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { placeId: true },
  });
  return rows.map((r) => r.placeId);
}

export interface VisitEntry {
  id: string;
  at: number;
}

/** A user's visit history, most-recent-first, as {id, epochMs}. */
export async function getVisited(userId: number): Promise<VisitEntry[]> {
  const rows = await prisma.visitedPlace.findMany({
    where: { userId },
    orderBy: { visitedAt: "desc" },
    take: 60,
    select: { placeId: true, visitedAt: true },
  });
  return rows.map((r) => ({ id: r.placeId, at: r.visitedAt.getTime() }));
}

export interface ReviewWithAuthor {
  id: number;
  rating: number;
  body: string;
  createdAt: Date;
  authorName: string;
  authorHandle: string;
  userId: number;
}

/**
 * Reviews for a place, newest first, with author display info.
 *
 * Hidden reviews are excluded. A moderator hiding one has to remove it from
 * the public page, not merely flag it in the dashboard.
 */
export async function getPlaceReviews(placeId: string): Promise<ReviewWithAuthor[]> {
  const rows = await prisma.review.findMany({
    where: { placeId, hidden: false },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, handle: true, id: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    body: r.body,
    createdAt: r.createdAt,
    authorName: r.user.name,
    authorHandle: r.user.handle,
    userId: r.userId,
  }));
}

/* ------------------------------------------------------------------ admin */

export interface AdminUserRow {
  id: number;
  email: string;
  handle: string;
  name: string;
  role: Role;
  emailVerified: Date | null;
  createdAt: Date;
  _count: { saves: number; visits: number };
}

/**
 * Every account, for the admin Users screen.
 *
 * `passwordHash` is never selected. It is not needed to render a row, and a
 * hash that never leaves the database cannot leak through a page prop, a React
 * server-component payload or a stray console.log.
 */
export async function adminUsers(): Promise<AdminUserRow[]> {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      handle: true,
      name: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      _count: { select: { saves: true, visits: true } },
    },
  });
}
