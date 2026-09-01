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

/**
 * Everything the profile overview needs, in one round trip.
 *
 * Real counts and real timestamps only. A profile that invents "12 places
 * visited" is worse than one that says none yet, because the number is the
 * whole reason somebody looks at the page.
 */
export async function getProfileOverview(userId: number) {
  const [user, reviews, saves, visits] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { image: true, interests: true, preferences: true },
    }),
    prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { placeId: true, rating: true, createdAt: true },
    }),
    prisma.savedPlace.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { placeId: true, createdAt: true },
    }),
    prisma.visitedPlace.findMany({
      where: { userId },
      orderBy: { visitedAt: "desc" },
      select: { placeId: true, visitedAt: true },
    }),
  ]);

  return {
    image: user?.image ?? null,
    interests: user?.interests ?? [],
    preferences: user?.preferences ?? null,
    reviews: reviews.map((r) => ({
      placeId: r.placeId,
      rating: r.rating,
      at: r.createdAt.getTime(),
    })),
    saves: saves.map((s) => ({ placeId: s.placeId, at: s.createdAt.getTime() })),
    visits: visits.map((v) => ({ placeId: v.placeId, at: v.visitedAt.getTime() })),
  };
}

export type ProfileOverview = Awaited<ReturnType<typeof getProfileOverview>>;
