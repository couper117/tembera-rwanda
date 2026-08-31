// Pure catalog logic — ranking, summaries, geography, search.
//
// Extracted from the original catalog.ts (which built a hardcoded PLACES array
// at module load). Every function here is pure: it takes the places (and, where
// relevant, the category taxonomy) as arguments and returns a result. The data
// now comes from Postgres via lib/data/*, but the algorithms are unchanged.

import type { Coords, Place, PlaceWithDistance } from "./types";
import { distanceKm } from "./geo";
import type { CategoryGroup } from "./taxonomy";

/**
 * Default for the `sensitive` argument on the ranking functions. Shared and
 * frozen so the common case allocates nothing per call.
 */
const EMPTY_SET: ReadonlySet<string> = new Set<string>();

/* ------------------------------------------------------------- geography */

/** Kigali's three districts read as one city to a user. */
export const KIGALI_DISTRICTS = ["Gasabo", "Kicukiro", "Nyarugenge"];

export function cityGroup(place: Place): string {
  return KIGALI_DISTRICTS.includes(place.city) ? "Kigali" : place.city;
}

/**
 * Whether reviews/ratings should be hidden for this place: every place in the
 * memorials category by default, plus anything an admin has individually
 * flagged as sensitive (e.g. genocide-related places seeded under a
 * different category, like the Campaign Against Genocide museum).
 */
export function isSensitivePlace(place: Pick<Place, "categoryId" | "sensitive">): boolean {
  return place.sensitive === true || place.categoryId === "memorials";
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

/**
 * A city card should show the city, not whichever listing happened to have
 * a photo first — that picked up bulk-seeded ADEPR church images (one wrong
 * video thumbnail, several copies of the exact same stock photo) for most
 * districts. Hand-picked real photos for every district shown on "Browse by
 * city" and the /explore "Cities & districts" grid; anything not yet covered
 * here still falls back to a listing's own image below.
 */
export const CITY_IMAGES: Record<string, string> = {
  Kigali: "https://images.unsplash.com/photo-1687986261123-b17f08f2796c?auto=format&fit=crop&w=800&q=80",
  Musanze: "/assets/images/wonder_volcanoes_national_park.jpg",
  Huye: "/assets/images/historic_ethnographic_museum.jpg",
  Rubavu: "https://images.unsplash.com/photo-1589715718565-223fdf9b7cd4?auto=format&fit=crop&w=800&q=80",
  Karongi: "/assets/images/rwanda_lake_kivu_sunset.jpg",
  Burera: "/assets/images/wonder_twin_lakes_burera_ruhondo.jpg",
  Nyamagabe: "/assets/images/wonder_nyungwe_forest_national_park.jpg",
  Bugesera: "https://images.unsplash.com/photo-1772734446447-3c850b026f4f?auto=format&fit=crop&w=800&q=80",
  // The historic royal capital — Rwanda's kings were crowned and buried here.
  Nyanza: "/assets/images/historic_kings_palace_museum.jpg",
  // Akagera National Park's main entrance sits in Kayonza.
  Kayonza: "/assets/images/wonder_akagera_national_park.jpg",
  // Cyangugu, Rusizi's capital, on the southern tip of Lake Kivu.
  Rusizi: "https://live.staticflickr.com/7310/9008089727_e7418eb5d5_b.jpg",
  Nyagatare: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Vache_dans_la_rue_principale_de_Nyagatare.JPG/960px-Vache_dans_la_rue_principale_de_Nyagatare.JPG",
  Rutsiro: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Kivu_lake_view_from_Rutsiro_tea_plantations.jpg/960px-Kivu_lake_view_from_Rutsiro_tea_plantations.jpg",
  // Rusumo hydropower station, on the Tanzania border in Kirehe.
  Kirehe: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Rusumo_hydropower.jpg/960px-Rusumo_hydropower.jpg",
  Gakenke: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Farmers_to_the_market%2CGakenke%2C_Rwanda.jpg/1280px-Farmers_to_the_market%2CGakenke%2C_Rwanda.jpg",
  // Sorwathe, a real tea estate in Gicumbi's Kinihira sector.
  Gicumbi: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Sorwathe_Tea_Plantation%2C_Rwanda.jpg/1280px-Sorwathe_Tea_Plantation%2C_Rwanda.jpg",
  // Muhanga was known as Gitarama before Rwanda's 2006 district reform.
  Muhanga: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Rwanda_Gitarama_landscape.JPG/1280px-Rwanda_Gitarama_landscape.JPG",
  Nyamasheke: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Where_tea_meets_primary_rainforest_in_Nyungwe.jpg/1280px-Where_tea_meets_primary_rainforest_in_Nyungwe.jpg",
  Rwamagana: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Canoe_on_Lake_Muhazi%2C_Rwanda%2C_Africa.jpg/960px-Canoe_on_Lake_Muhazi%2C_Rwanda%2C_Africa.jpg",
  // 2nd-prize Wiki Loves Africa 2024 entry, shot in Nyabihu District.
  Nyabihu: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Gusarura_Icyayi.jpg/960px-Gusarura_Icyayi.jpg",
  Ngoma: "https://images.pexels.com/photos/30066938/pexels-photo-30066938.jpeg?auto=compress&cs=tinysrgb&w=800",
  Gatsibo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Banana_plantation_in_Gatsibo.jpg/960px-Banana_plantation_in_Gatsibo.jpg",
  // No Gisagara-specific shot found — a generic but honestly-captioned
  // Rwanda hill-country photo rather than a mislabeled stand-in.
  Gisagara: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Rwanda_landscape_Image.jpg/960px-Rwanda_landscape_Image.jpg",
  Kamonyi: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Ruyenzi_mountains.jpg/960px-Ruyenzi_mountains.jpg",
  Ngororero: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Gishwati_Farmland%2C_Western_Rwanda.jpg/960px-Gishwati_Farmland%2C_Western_Rwanda.jpg",
  Nyaruguru: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Rwanda_Tea_Plantations.jpg/1280px-Rwanda_Tea_Plantations.jpg",
  // The Agaseke basket — Rwanda's peace-and-reconciliation symbol — has a
  // monument in Ruhango town; no clean landscape shot of the district exists.
  Ruhango: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Agaseke_monument_in_Ruhango_Town_Rwanda.jpg/960px-Agaseke_monument_in_Ruhango_Town_Rwanda.jpg",
  Rulindo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Rulindo%27s_Beautiful_Landscapes.jpg/1280px-Rulindo%27s_Beautiful_Landscapes.jpg",
};

export function citySummaries(places: Place[]): CitySummary[] {
  const map = new Map<string, CitySummary>();
  for (const place of places) {
    const name = cityGroup(place);
    const entry = map.get(name) ?? { name, count: 0 };
    entry.count += 1;
    if (!entry.image && isRenderableImage(place.image)) entry.image = place.image;
    map.set(name, entry);
  }
  for (const entry of map.values()) {
    if (CITY_IMAGES[entry.name]) entry.image = CITY_IMAGES[entry.name];
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
  options: { limit?: number; categoryId?: string; maxKm?: number; requireImage?: boolean } = {},
): PlaceWithDistance[] {
  const { limit = 12, categoryId, maxKm, requireImage } = options;
  const out: PlaceWithDistance[] = [];

  for (const place of places) {
    if (categoryId && place.categoryId !== categoryId) continue;
    if (place.lat === undefined || place.lng === undefined) continue;
    if (requireImage && !isRenderableImage(place.image)) continue;
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
export function topRated(
  places: Place[],
  limit = 10,
  categoryId?: string,
  sensitive: ReadonlySet<string> = EMPTY_SET,
): Place[] {
  const eligible = places
    .filter(
      (p) =>
        p.rating !== undefined &&
        isRenderableImage(p.image) &&
        !sensitive.has(p.categoryId) &&
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
 *
 * "memorials" was in this list. It has been removed: a memorial site is not
 * promotional material, and a home-page carousel is exactly the wrong frame
 * for one. The `sensitive` filter below is the general guard; dropping the id
 * here is the specific fix.
 */
export function featured(
  places: Place[],
  limit = 8,
  sensitive: ReadonlySet<string> = EMPTY_SET,
): Place[] {
  const wanted = ["nature", "wonders", "arts"];
  return places
    .filter(
      (p) =>
        wanted.includes(p.categoryId) &&
        !sensitive.has(p.categoryId) &&
        isRenderableImage(p.image),
    )
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
    // One boolean, but without it every screen fed by this index would have to
    // fall back to the category check alone and would show a rating on a
    // memorial that an admin flagged sensitive from outside that category.
    sensitive: place.sensitive,
  }));
}
