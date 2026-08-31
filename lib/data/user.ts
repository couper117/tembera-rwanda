/**
 * Per-user reads, with the backend removed.
 *
 * Saves and visits still work in this build — they live in the browser, in
 * lib/client/saved.tsx and lib/client/visited.tsx, and never needed a server.
 * These functions are the server-side mirror that synced them to an account,
 * so with no accounts they have nothing to return.
 *
 * Reviews are gone entirely: there is nowhere to store one and nobody to
 * attribute it to.
 */

export interface VisitEntry {
  id: string;
  at: number;
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

export async function getSavedPlaceIds(_userId: number): Promise<string[]> {
  return [];
}

export async function getVisited(_userId: number): Promise<VisitEntry[]> {
  return [];
}

export async function getPlaceReviews(_placeId: string): Promise<ReviewWithAuthor[]> {
  return [];
}
