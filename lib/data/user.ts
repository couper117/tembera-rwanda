import "server-only";
import { prisma } from "@/lib/prisma";

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

/** Reviews for a place, newest first, with author display info. */
export async function getPlaceReviews(placeId: string): Promise<ReviewWithAuthor[]> {
  const rows = await prisma.review.findMany({
    where: { placeId },
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
