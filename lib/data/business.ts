import "server-only";
import { prisma } from "@/lib/prisma";
import type { Business, BusinessStatus } from "@prisma/client";

/**
 * Reads for the business dashboard.
 *
 * Every one of these takes the signed-in user and resolves their business from
 * the membership table, rather than accepting a business id from the caller.
 * A server action is a public endpoint: trusting an id in the payload would
 * let one business read and edit another's listings.
 */

export interface MyBusiness extends Business {
  owner: boolean;
}

/** The business the signed-in user belongs to, or null. */
export async function getMyBusiness(userId: number): Promise<MyBusiness | null> {
  const membership = await prisma.businessMember.findUnique({
    where: { userId },
    include: { business: true },
  });
  if (!membership) return null;
  return { ...membership.business, owner: membership.owner };
}

/** Listings this business owns, whatever their status. */
export async function getMyPlaces(businessId: number) {
  return prisma.place.findMany({
    where: { businessId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      city: true,
      subcategory: true,
      status: true,
      image: true,
      rating: true,
    },
  });
}

/** One listing, but only if this business owns it. */
export async function getMyPlace(businessId: number, placeId: string) {
  return prisma.place.findFirst({ where: { id: placeId, businessId } });
}

export async function getMySubmissions(businessId: number) {
  return prisma.submission.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      kind: true,
      status: true,
      placeId: true,
      payload: true,
      rejectionReason: true,
      createdAt: true,
      reviewedAt: true,
    },
  });
}

/** Reviews left on this business's listings, newest first. */
export async function getMyReviews(businessId: number) {
  return prisma.review.findMany({
    where: { place: { businessId }, hidden: false },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      rating: true,
      body: true,
      createdAt: true,
      user: { select: { name: true, handle: true } },
      place: { select: { id: true, name: true } },
    },
  });
}

export async function getMembers(businessId: number) {
  return prisma.businessMember.findMany({
    where: { businessId },
    orderBy: [{ owner: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      owner: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

/* ------------------------------------------------------------------ admin */

export interface AdminBusinessRow {
  id: number;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  tin: string | null;
  plan: string;
  status: BusinessStatus;
  createdAt: Date;
  _count: { places: number; submissions: number; members: number };
}

export async function adminBusinesses(): Promise<AdminBusinessRow[]> {
  return prisma.business.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      contactName: true,
      email: true,
      phone: true,
      city: true,
      tin: true,
      plan: true,
      status: true,
      createdAt: true,
      _count: { select: { places: true, submissions: true, members: true } },
    },
  });
}

export async function adminSubmissions(status?: "pending" | "approved" | "rejected") {
  return prisma.submission.findMany({
    where: status ? { status } : undefined,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      kind: true,
      status: true,
      placeId: true,
      payload: true,
      rejectionReason: true,
      createdAt: true,
      reviewedAt: true,
      business: { select: { id: true, name: true, status: true } },
      submittedBy: { select: { name: true, email: true } },
      reviewedByUserId: true,
    },
  });
}

export async function adminSubmission(id: number) {
  return prisma.submission.findUnique({
    where: { id },
    select: {
      id: true,
      kind: true,
      status: true,
      placeId: true,
      payload: true,
      rejectionReason: true,
      createdAt: true,
      reviewedAt: true,
      business: true,
      submittedBy: { select: { name: true, email: true } },
    },
  });
}

export async function pendingSubmissionCount(): Promise<number> {
  return prisma.submission.count({ where: { status: "pending" } });
}

/**
 * Paid sign-ups still waiting on money, oldest first.
 *
 * Oldest first on purpose: this is a queue somebody works through, and the
 * person who has been waiting longest is the one most likely to give up.
 */
export async function pendingRegistrations() {
  return prisma.businessRegistration.findMany({
    where: { status: "awaiting_payment" },
    orderBy: { createdAt: "asc" },
  });
}

/** The last few decided sign-ups, so a confirmation can be checked afterwards. */
export async function decidedRegistrations(take = 8) {
  return prisma.businessRegistration.findMany({
    where: { status: { in: ["active", "rejected"] } },
    orderBy: { decidedAt: "desc" },
    take,
    include: { decidedBy: { select: { name: true } } },
  });
}

/**
 * A business as a visitor sees it, with everything it keeps up to date.
 *
 * Only verified businesses have a public page. Naming an unchecked one, and
 * gathering its listings under a heading, is Tembera vouching for somebody
 * nobody has looked at — and the tick beside those listings already says we
 * have. Returns null otherwise, which the route turns into a 404.
 */
export async function publicBusiness(id: number) {
  const business = await prisma.business.findFirst({
    where: { id, status: "verified" },
    select: { id: true, name: true, city: true, plan: true, createdAt: true },
  });
  if (!business) return null;

  const places = await prisma.place.findMany({
    where: { businessId: id, status: "published" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      categoryId: true,
      subcategory: true,
      city: true,
      area: true,
      image: true,
      rating: true,
      sensitive: true,
    },
  });

  return { business, places };
}
