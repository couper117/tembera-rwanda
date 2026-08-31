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
import * as engine from "@/lib/places/engine";
import { searchPlaces } from "@/lib/places/search";

export const PLACES_TAG = "places";

/** Prisma row → the domain Place the whole UI speaks. Nulls become undefined. */
function toDomain(row: DbPlace): Place {
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
      }),
      sensitiveCategoryIds(),
    ]);
    return rows.map((row) => {
      const place = toDomain(row);
      if (!sensitive.has(place.categoryId)) return place;
      return { ...place, rating: undefined, priceFrom: undefined };
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
  return engine.placesInCategory(await getPlaces(), categoryId);
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
