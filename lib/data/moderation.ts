import "server-only";
import { prisma } from "@/lib/prisma";
import type { ReportStatus } from "@prisma/client";

/**
 * Reads for the two moderation queues: problems visitors reported, and the
 * reviews they wrote.
 *
 * Uncached, like every staff read — a moderator must see the effect of their
 * own decision on the next request, not at the next revalidation.
 */

export interface AdminReportRow {
  id: number;
  kind: string;
  body: string;
  contact: string | null;
  status: ReportStatus;
  handledAt: Date | null;
  createdAt: Date;
  place: { id: string; name: string; city: string };
}

/**
 * Open reports first, then newest. The queue is a list of work, so the thing
 * still to be done belongs at the top regardless of when it arrived.
 */
export async function adminReports(): Promise<AdminReportRow[]> {
  return prisma.report.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      kind: true,
      body: true,
      contact: true,
      status: true,
      handledAt: true,
      createdAt: true,
      place: { select: { id: true, name: true, city: true } },
    },
  });
}

export async function openReportCount(): Promise<number> {
  return prisma.report.count({ where: { status: "open" } });
}

export interface AdminReviewRow {
  id: number;
  rating: number;
  body: string;
  hidden: boolean;
  createdAt: Date;
  user: { id: number; name: string; handle: string };
  place: { id: string; name: string };
}

export async function adminReviews(take = 100): Promise<AdminReviewRow[]> {
  return prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      rating: true,
      body: true,
      hidden: true,
      createdAt: true,
      user: { select: { id: true, name: true, handle: true } },
      place: { select: { id: true, name: true } },
    },
  });
}

export interface ReviewStats {
  total: number;
  hidden: number;
  average: number | null;
  lowRated: number;
}

/**
 * Counted in the database rather than over the fetched page, so the figures
 * describe every review and not just the most recent hundred.
 */
export async function reviewStats(): Promise<ReviewStats> {
  const [total, hidden, agg, lowRated] = await Promise.all([
    prisma.review.count(),
    prisma.review.count({ where: { hidden: true } }),
    prisma.review.aggregate({ where: { hidden: false }, _avg: { rating: true } }),
    prisma.review.count({ where: { rating: { lte: 2 }, hidden: false } }),
  ]);
  return { total, hidden, average: agg._avg.rating, lowRated };
}
