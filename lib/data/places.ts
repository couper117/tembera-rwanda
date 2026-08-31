import type { Coords, Place } from "@/lib/places/types";
import { getCategories, sensitiveCategoryIds } from "@/lib/data/categories";
import { PLACES } from "@/lib/places/catalog";
import * as engine from "@/lib/places/engine";
import { searchPlaces } from "@/lib/places/search";

/**
 * The catalog, from the static dataset in lib/places/*.
 *
 * Every function here stays `async` even though nothing awaits I/O any more:
 * the pages, metadata functions and components downstream all `await` these,
 * and keeping the signatures lets the whole UI stay untouched when a real
 * backend is wired in behind them again.
 *
 * Ratings and prices are stripped from sensitive categories here, at the
 * source, rather than hidden in each component that might render them. A
 * memorial site with no `rating` field cannot be given stars by a card, a row,
 * a search result or a future screen nobody has written yet — the guarantee
 * holds by construction instead of by everyone remembering.
 */
export async function getPlaces(): Promise<Place[]> {
  const sensitive = await sensitiveCategoryIds();
  return PLACES.map((place) => {
    if (!sensitive.has(place.categoryId)) return place;
    return { ...place, rating: undefined, priceFrom: undefined };
  });
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
 * site must never be ranked out of five or paraded on the home page.
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

export { engine };
export const isRenderableImage = engine.isRenderableImage;
export const isSensitivePlace = engine.isSensitivePlace;
