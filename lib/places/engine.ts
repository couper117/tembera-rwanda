// Pure catalog logic — ranking, summaries, geography, search.
//
// Extracted from the original catalog.ts (which built a hardcoded PLACES array
// at module load). Every function here is pure: it takes the places (and, where
// relevant, the category taxonomy) as arguments and returns a result. The data
// now comes from Postgres via lib/data/*, but the algorithms are unchanged.

import type { Coords, Place, PlaceWithDistance } from "./types";
import { distanceKm } from "./geo";
import type { CategoryGroup } from "./taxonomy";

/* ------------------------------------------------------------- geography */

/** Kigali's three districts read as one city to a user. */
export const KIGALI_DISTRICTS = ["Gasabo", "Kicukiro", "Nyarugenge"];

export function cityGroup(place: Place): string {
  return KIGALI_DISTRICTS.includes(place.city) ? "Kigali" : place.city;
}

/**
 * A few legacy image URLs are known-dead. Skip them when *choosing* a hero
 * image; cards still attempt them and fall back visually if they 404.
 */
export function isRenderableImage(url: string | undefined | null): url is string {
  if (!url) return false;
  if (url.includes("googleusercontent.com/image_collection")) return false;
  if (url.includes("live.staticflickr.com/65535/48598424266")) return false;
  if (url.startsWith("https://mail.google.com/")) return false;
  return true;
}

/* -------------------------------------------------------------- lookups */

export function placesInCategory(places: Place[], categoryId: string): Place[] {
  return places.filter((p) => p.categoryId === categoryId);
}

export function placesInCity(places: Place[], city: string): Place[] {
  return places.filter((p) => cityGroup(p) === city);
}

export function countByCategory(places: Place[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const place of places) {
    counts[place.categoryId] = (counts[place.categoryId] ?? 0) + 1;
  }
  return counts;
}

export function countBySubcategory(places: Place[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const place of places) {
    const key = `${place.categoryId}/${place.subcategory}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

/* -------------------------------------------------------------- summaries */

export interface GroupSummary {
  id: string;
  total: number;
  subcategories: { name: string; count: number }[];
}

/** Group counts plus their subcategory counts, for the sidebar and explorer. */
export function groupSummaries(
  places: Place[],
  groups: CategoryGroup[],
): GroupSummary[] {
  const byCategory = countByCategory(places);
  const bySub = countBySubcategory(places);

  return groups.map((group) => ({
    id: group.id,
    total: byCategory[group.id] ?? 0,
    subcategories: group.subcategories.map((name) => ({
      name,
      count: bySub[`${group.id}/${name}`] ?? 0,
    })),
  }));
}

export interface CitySummary {
  name: string;
  count: number;
  /** A representative image drawn from the city's own listings. */
  image?: string;
}

export function citySummaries(places: Place[]): CitySummary[] {
  const map = new Map<string, CitySummary>();
  for (const place of places) {
    const name = cityGroup(place);
    const entry = map.get(name) ?? { name, count: 0 };
    entry.count += 1;
    if (!entry.image && isRenderableImage(place.image)) entry.image = place.image;
    map.set(name, entry);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

/* --------------------------------------------------------------- ranking */

/**
 * Places sorted by distance from `origin`. Records without coordinates are
 * dropped — a "Near You" row cannot honestly include them.
 */
export function nearest(
  places: Place[],
  origin: Coords,
  options: { limit?: number; categoryId?: string; maxKm?: number } = {},
): PlaceWithDistance[] {
  const { limit = 12, categoryId, maxKm } = options;
  const out: PlaceWithDistance[] = [];

  for (const place of places) {
    if (categoryId && place.categoryId !== categoryId) continue;
    if (place.lat === undefined || place.lng === undefined) continue;
    const km = distanceKm(origin, { lat: place.lat, lng: place.lng });
    if (maxKm !== undefined && km > maxKm) continue;
    out.push({ ...place, distanceKm: km });
  }

  out.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  return out.slice(0, limit);
}

/**
 * Explicitly *top rated* (labelled that way in the UI — there are no analytics
 * behind a "popular" claim). Round-robins across categories so one category
 * can't fill the row.
 */
export function topRated(places: Place[], limit = 10, categoryId?: string): Place[] {
  const eligible = places
    .filter(
      (p) =>
        p.rating !== undefined &&
        isRenderableImage(p.image) &&
        (!categoryId || p.categoryId === categoryId),
    )
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  if (categoryId) return eligible.slice(0, limit);

  const queues = new Map<string, Place[]>();
  for (const place of eligible) {
    const queue = queues.get(place.categoryId) ?? [];
    queue.push(place);
    queues.set(place.categoryId, queue);
  }

  const out: Place[] = [];
  while (out.length < limit) {
    let added = false;
    for (const queue of queues.values()) {
      if (out.length >= limit) break;
      const next = queue.shift();
      if (next) {
        out.push(next);
        added = true;
      }
    }
    if (!added) break;
  }
  return out;
}

/**
 * Editorial row: Rwanda's recognisable destinations. Nature, wonders and
 * heritage only, and only records whose image will actually load.
 */
export function featured(places: Place[], limit = 8): Place[] {
  const wanted = ["nature", "wonders", "memorials", "arts"];
  return places
    .filter((p) => wanted.includes(p.categoryId) && isRenderableImage(p.image))
    .slice(0, limit);
}

/* ----------------------------------------------------------- search index */

/**
 * A trimmed copy of the catalog for the search screen to filter in the browser.
 * Descriptions are dropped (heaviest field, weakest signal) but keywords are
 * kept. The result is a few tens of kilobytes — small enough to hand to the
 * client so search feels instant, with no request per keystroke.
 */
export function buildSearchIndex(places: Place[]): Place[] {
  return places.map((place) => ({
    id: place.id,
    name: place.name,
    categoryId: place.categoryId,
    subcategory: place.subcategory,
    subtype: place.subtype,
    city: place.city,
    area: place.area,
    lat: place.lat,
    lng: place.lng,
    coordsPrecision: place.coordsPrecision,
    rating: place.rating,
    image: place.image,
    keywords: place.keywords,
  }));
}
