import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Place as DbPlace } from "@prisma/client";
import type { Coords, Place } from "@/lib/places/types";
import {
  CATEGORIES_TAG,
  getCategories,
  sensitiveCategoryIds,
} from "@/lib/data/categories";
import { planById } from "@/lib/business/plans";
import * as engine from "@/lib/places/engine";
import { beyondKigali, homeRows } from "@/lib/home/rows";
import { searchPlaces } from "@/lib/places/search";

export const PLACES_TAG = "places";

/** The owning business, when a query asked for it. */
type WithOwner = DbPlace & {
  business?: { id: number; name: string; status: string; plan: string } | null;
};

/**
 * Whether this listing has earned the verified tick.
 *
 * Both halves are required. The plan is what was paid for; the status is an
 * admin having looked at the business and agreed it is who it says it is.
 * Neither on its own is a statement Tembera should be making to a visitor.
 */
function isVerified(row: WithOwner): boolean {
  const owner = row.business;
  if (!owner || owner.status !== "verified") return false;
  return planById(owner.plan)?.verifiedTick === true;
}

/** The owner's plan, narrowed to the ids ranking understands. */
function planOf(row: WithOwner): Place["plan"] {
  const plan = row.business?.plan;
  return plan === "top" || plan === "checked" || plan === "free" ? plan : undefined;
}

/** Prisma row → the domain Place the whole UI speaks. Nulls become undefined. */
function toDomain(row: WithOwner): Place {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.categoryId,
    subcategory: row.subcategory,
    subtype: row.subtype ?? undefined,
    city: row.city,
    area: row.area ?? undefined,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    coordsPrecision: row.coordsPrecision,
    rating: row.rating ?? undefined,
    image: row.image ?? undefined,
    images: row.images.length ? row.images : undefined,
    description: row.description ?? undefined,
    hours: row.hours ?? undefined,
    phone: row.phone ?? undefined,
    mapLink: row.mapLink ?? undefined,
    website: row.website ?? undefined,
    highlights: row.highlights.length ? row.highlights : undefined,
    priceFrom: row.priceFrom ?? undefined,
    keywords: row.keywords.length ? row.keywords : undefined,
    sensitive: row.sensitive,
    status: row.status,
    hoursJson: row.hoursJson,
    verified: isVerified(row) || undefined,
    // Only a verified owner's plan counts, for the same reason the tick needs
    // both: a plan string on an unchecked business is a claim nobody has read.
    plan: isVerified(row) ? planOf(row) : undefined,
    owner:
      isVerified(row) && row.business
        ? { id: row.business.id, name: row.business.name }
        : undefined,
  };
}

/**
 * The whole catalog, cached until an admin edit revalidates the tag.
 *
 * Ratings and prices are stripped from sensitive categories here, at the
 * source, rather than hidden in each component that might render them. A
 * memorial site with no `rating` field cannot be given stars by a card, a row,
 * a search result or a future screen nobody has written yet — the guarantee
 * holds by construction instead of by everyone remembering.
 */
export const getPlaces = unstable_cache(
  async (): Promise<Place[]> => {
    const [rows, sensitive] = await Promise.all([
      prisma.place.findMany({
        // Only published rows are ever public. A business edit lands as a
        // draft, and retiring a listing archives it rather than deleting it,
        // so both must be invisible here without either being gone.
        where: { status: "published" },
        orderBy: { name: "asc" },
        // The tick is derived from the owner, so the owner has to come with
        // the row. Two columns on a relation most rows do not have; cheaper
        // than a second query, and this one is cached anyway.
        include: {
          business: { select: { id: true, name: true, status: true, plan: true } },
        },
      }),
      sensitiveCategoryIds(),
    ]);
    return rows.map((row) => {
      const place = toDomain(row);
      if (!sensitive.has(place.categoryId)) return place;
      // A tick is a promotional claim, so it goes the same way the rating and
      // the price do — at the source, where no component can forget.
      return {
        ...place,
        rating: undefined,
        priceFrom: undefined,
        verified: undefined,
        plan: undefined,
        owner: undefined,
      };
    });
  },
  ["places-all"],
  { tags: [PLACES_TAG, CATEGORIES_TAG] },
);

/**
 * Every place regardless of status, uncached — for the admin and business
 * screens, which must see drafts and archived listings and must reflect an
 * edit on the next request rather than at the next revalidation.
 *
 * STAFF ONLY. This does not strip ratings and prices from sensitive
 * categories, because an editor has to be able to see and correct the stored
 * values. Never hand the result to a public screen; use getPlaces() there.
 */
export async function getAllPlaces(): Promise<Place[]> {
  const rows = await prisma.place.findMany({ orderBy: { name: "asc" } });
  return rows.map(toDomain);
}

/** One place regardless of status, uncached. STAFF ONLY, as getAllPlaces(). */
export async function getAnyPlace(id: string): Promise<Place | undefined> {
  const row = await prisma.place.findUnique({ where: { id } });
  return row ? toDomain(row) : undefined;
}

/**
 * Place counts per category across every status, for the admin taxonomy
 * screen — a category with only draft listings still must not look empty.
 */
export async function countByCategoryAllStatuses(): Promise<Record<string, number>> {
  const rows = await prisma.place.groupBy({
    by: ["categoryId"],
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((r) => [r.categoryId, r._count._all]));
}

/* ------------------------------------------------------ lookups & lists */

export async function getPlace(id: string): Promise<Place | undefined> {
  return (await getPlaces()).find((p) => p.id === id);
}

export async function placesInCategory(categoryId: string): Promise<Place[]> {
  // Promoted listings lead a browse list. There is no relevance score to band
  // against here — the reader asked for the category, so everything in it is
  // equally what they asked for and only the order is in question.
  return engine.withPromotedFirst(
    engine.placesInCategory(await getPlaces(), categoryId),
  );
}

export async function placesInCity(city: string): Promise<Place[]> {
  return engine.placesInCity(await getPlaces(), city);
}

export async function countByCategory(): Promise<Record<string, number>> {
  return engine.countByCategory(await getPlaces());
}

export async function groupSummaries(): Promise<engine.GroupSummary[]> {
  const [places, groups] = await Promise.all([getPlaces(), getCategories()]);
  return engine.groupSummaries(places, groups);
}

export async function citySummaries(): Promise<engine.CitySummary[]> {
  return engine.citySummaries(await getPlaces());
}

export function cityGroup(place: Place): string {
  return engine.cityGroup(place);
}

/* ---------------------------------------------------------- ranking rows */

export async function nearest(
  origin: Coords,
  options: Parameters<typeof engine.nearest>[2] = {},
): Promise<ReturnType<typeof engine.nearest>> {
  return engine.nearest(await getPlaces(), origin, options);
}

/**
 * Both rows are promotional, so both exclude sensitive categories — a memorial
 * site must never be ranked out of five or paraded on the home page. The
 * exclusion is applied here, where the taxonomy is available, rather than in
 * the engine, which stays pure.
 */
export async function topRated(limit = 10, categoryId?: string): Promise<Place[]> {
  const [places, sensitive] = await Promise.all([getPlaces(), sensitiveCategoryIds()]);
  return engine.topRated(places, limit, categoryId, sensitive);
}

/**
 * Listings whose owners pay for placement. Its own row, so it can be labelled.
 *
 * See lib/places/ranking.ts for why this is not folded into "Top rated".
 */
export async function sponsored(limit = 8, categoryId?: string): Promise<Place[]> {
  const [places, sensitive] = await Promise.all([getPlaces(), sensitiveCategoryIds()]);
  return engine.sponsored(places, limit, sensitive, categoryId);
}

/**
 * The personalised home feed: their interests first, then a few things they
 * did not pick. See lib/home/rows.ts for why the second half matters.
 */
export async function personalRows(interests: string[]) {
  const [places, sensitive] = await Promise.all([getPlaces(), sensitiveCategoryIds()]);
  return homeRows(places, interests, sensitive);
}

/** Highly rated places outside the capital — the row browsing cannot reach. */
export async function outsideKigali(limit = 8): Promise<Place[]> {
  const [places, sensitive] = await Promise.all([getPlaces(), sensitiveCategoryIds()]);
  return beyondKigali(places, sensitive, limit);
}

export async function featured(limit = 8): Promise<Place[]> {
  const [places, sensitive] = await Promise.all([getPlaces(), sensitiveCategoryIds()]);
  return engine.featured(places, limit, sensitive);
}

/* ------------------------------------------------------------- search */

export async function buildSearchIndex(): Promise<Place[]> {
  return engine.buildSearchIndex(await getPlaces());
}

export async function searchCatalog(
  query: string,
  options: Parameters<typeof searchPlaces>[2] = {},
) {
  return searchPlaces(await getPlaces(), query, options);
}

/* --------------------------------------------------------------- images */

/** The original inline image data for a place, if it had one. Server-only. */
export async function getPlaceImageData(id: string): Promise<string | null> {
  const row = await prisma.place.findUnique({
    where: { id },
    select: { imageData: true },
  });
  return row?.imageData ?? null;
}

export { engine };
export const isRenderableImage = engine.isRenderableImage;
export const isSensitivePlace = engine.isSensitivePlace;
