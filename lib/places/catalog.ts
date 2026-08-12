// Builds the single Tembera catalog from the legacy per-page datasets plus the
// curated directory that covers the categories those datasets never had.
//
// Nothing here invents a rating or a coordinate. Fields absent from a source
// stay absent, and the UI is written to render without them. The one derived
// value is position: records that carried only a district or neighbourhood
// name get that district's centre, flagged `coordsPrecision: "district"` so
// distances can be shown as approximate.

import type { Coords, Place, PlaceWithDistance } from "./types";
import {
  DISTRICT_CENTRES,
  KIGALI_DISTRICTS,
  distanceKm,
  resolveDistrict,
} from "./geo";
import { CATEGORY_GROUPS } from "./taxonomy";
import { searchPlaces } from "./search";

import { CHURCH_ROWS } from "./sources/churches";
import { DIRECTORY_ROWS } from "./sources/directory";
import { GYM_ROWS } from "./sources/gyms";
import { HISTORIC_ROWS } from "./sources/historics";
import { MAP_ROWS } from "./sources/map";
import { PLAYGROUND_ROWS } from "./sources/playground";
import { RESTAURANT_ROWS } from "./sources/restaurants";
import { SHOP_ROWS } from "./sources/shops";
import { WONDER_ROWS } from "./sources/wonders";

/* ------------------------------------------------------------------ utils */

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Normalised name used to spot the same place appearing in two datasets. */
function nameKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

interface Positioned {
  city: string;
  lat?: number;
  lng?: number;
  precision: Place["coordsPrecision"];
}

/**
 * Work out where a record sits. Exact coordinates win; otherwise we resolve the
 * free-text location to a district and use its centre.
 */
function position(locationText: string | undefined, exact?: Coords): Positioned {
  const district = resolveDistrict(locationText);
  if (exact) {
    return {
      city: district ?? "Rwanda",
      lat: exact.lat,
      lng: exact.lng,
      precision: "exact",
    };
  }
  if (district) {
    const centre = DISTRICT_CENTRES[district];
    return { city: district, lat: centre.lat, lng: centre.lng, precision: "district" };
  }
  return { city: "Rwanda", precision: "unknown" };
}

/* ---------------------------------------------------------------- sources */

/** Per-restaurant subcategory: the legacy data had one flat "Restaurant". */
const DINING_SUBCATEGORY: Record<string, string> = {
  "Inzora Rooftop": "Cafés",
  "Question Coffee": "Cafés",
  "Rubia Roasters": "Cafés",
  "Camellia Tea": "Cafés",
  "Pili Pili": "Resto Bars",
  "Repub Lounge": "Resto Bars",
  "Meze Fresh": "Fast Food",
};

function fromRestaurants(): Place[] {
  return RESTAURANT_ROWS.map((row) => ({
    id: "",
    name: row.name,
    categoryId: "dining",
    subcategory: DINING_SUBCATEGORY[row.name] ?? "Restaurants",
    city: resolveDistrict("Kigali") ?? "Nyarugenge",
    lat: row.lat,
    lng: row.lng,
    coordsPrecision: "exact" as const,
    rating: Number(row.rate),
    image: `${row.img}?auto=format&fit=crop&w=800&q=80`,
    description: row.quote,
    keywords: ["restaurant", "food", "cafe", "coffee", "dining", "eat"],
  }));
}

/** Named markets and malls the generic `type` field doesn't distinguish. */
const SHOP_SUBCATEGORY: Record<string, string> = {
  "Kigali Heights Shopping Mall": "Malls",
  "Union Trade Center": "Malls",
  "Simba Supermarket": "Supermarkets",
  "Mamba Club Grocery": "Supermarkets",
};

const SHOP_TYPE_SUBCATEGORY: Record<string, string> = {
  market: "Markets",
  craft: "Shops",
  food: "Shops",
  clothing: "Shops",
  art: "Shops",
  souvenir: "Shops",
};

function fromShops(): Place[] {
  return SHOP_ROWS.map((row) => {
    // The source array is explicitly a Kigali list, so a chain marked
    // "Multiple Locations"/"Citywide" still resolves to the city centre.
    const pos = position(resolveDistrict(row.area) ? row.area : `${row.location} Kigali`);
    return {
      id: "",
      name: row.name,
      categoryId: "shopping",
      subcategory:
        SHOP_SUBCATEGORY[row.name] ?? SHOP_TYPE_SUBCATEGORY[row.type] ?? "Shops",
      subtype: row.type.charAt(0).toUpperCase() + row.type.slice(1),
      city: pos.city,
      area: row.area,
      lat: pos.lat,
      lng: pos.lng,
      coordsPrecision: pos.precision,
      description: row.description,
      hours: row.hours,
      keywords: [...row.category, "shop", "shopping", "market", "supermarket"],
    };
  });
}

function fromHistorics(): Place[] {
  return HISTORIC_ROWS.map((row) => {
    const pos = position(row.location, { lat: row.lat, lng: row.lng });
    const isMemorial = row.category === "Memorial";
    return {
      id: "",
      name: row.name,
      categoryId: isMemorial ? "memorials" : "arts",
      subcategory: isMemorial ? "Genocide Memorials" : "Museums",
      city: pos.city,
      area: row.location,
      lat: pos.lat,
      lng: pos.lng,
      coordsPrecision: pos.precision,
      image: row.img,
      description: row.desc,
      hours: row.hours,
      keywords: [row.category, "history", "heritage", "culture"],
    };
  });
}

/** Wonders carried no location field, but each is a well-known site. */
const WONDER_DISTRICTS: Record<string, string> = {
  "Volcanoes National Park": "Musanze",
  "Akagera National Park": "Kayonza",
  "Nyungwe Forest National Park": "Nyamagabe",
  "Lake Kivu": "Rubavu",
  "Twin Lakes (Burera & Ruhondo)": "Burera",
};

function fromWonders(): Place[] {
  return WONDER_ROWS.map((row) => {
    const pos = position(WONDER_DISTRICTS[row.name]);
    const isWater = row.type === "Water";
    return {
      id: "",
      name: row.name,
      categoryId: "nature",
      subcategory: isWater ? "Lakes" : "Parks",
      city: pos.city,
      lat: pos.lat,
      lng: pos.lng,
      coordsPrecision: pos.precision,
      image: row.img,
      description: row.desc,
      keywords: [row.type, "nature", "wildlife", "park", "hiking", "wonder"],
    };
  });
}

/** Playground rows are two different things: play venues and green space. */
const PLAYGROUND_OVERRIDES: Record<string, { group: string; subcategory: string }> = {
  "Amahoro National Stadium": { group: "sports", subcategory: "Stadiums" },
  "Umusambi Village": { group: "nature", subcategory: "Nature Reserves" },
  "Nyandungu Eco-Park": { group: "nature", subcategory: "Nature Reserves" },
  "Buhanga Eco-Park": { group: "nature", subcategory: "Forests" },
  "Gishwati-Mukura Park": { group: "nature", subcategory: "Forests" },
  "Mount Kigali View Park": { group: "wonders", subcategory: "Scenic Viewpoints" },
  "Kigali Convention Centre Gardens": { group: "wonders", subcategory: "Landmarks" },
};

function fromPlaygrounds(): Place[] {
  return PLAYGROUND_ROWS.map((row) => {
    const pos = position(row.city);
    const override = PLAYGROUND_OVERRIDES[row.name];
    const isGreen = row.type === "park" || row.type === "national";

    return {
      id: "",
      name: row.name,
      categoryId: override?.group ?? (isGreen ? "nature" : "recreation"),
      subcategory:
        override?.subcategory ?? (isGreen ? "Parks" : "Playgrounds"),
      city: pos.city,
      area: row.city,
      lat: pos.lat,
      lng: pos.lng,
      coordsPrecision: pos.precision,
      image: row.image,
      description: row.short,
      highlights: row.highlights,
      keywords: [row.type, row.expect, "family", "kids", "outdoors"],
    };
  });
}

function fromGyms(): Place[] {
  return GYM_ROWS.map((row) => {
    const pos = position(row.location);
    const isArena = row.type === "arena";
    const isClub = row.tag.toLowerCase().includes("club");

    return {
      id: "",
      name: row.name,
      categoryId: isArena ? "sports" : "recreation",
      subcategory: isArena ? "Arenas" : isClub ? "Sports Clubs" : "Gyms",
      subtype: row.tag,
      city: pos.city,
      area: row.location,
      lat: pos.lat,
      lng: pos.lng,
      coordsPrecision: pos.precision,
      image: row.image,
      description: row.description,
      phone: row.phone,
      mapLink: row.map_link,
      keywords: [row.type, "fitness", "sports", "workout"],
    };
  });
}

function fromChurches(): Place[] {
  return CHURCH_ROWS.map((row) => {
    const pos = position(row.district);
    return {
      id: "",
      name: row.name.trim(),
      categoryId: "worship",
      subcategory: row.type === "mosque" ? "Mosques" : "Churches",
      // Denomination is the useful second filter here.
      subtype: row.tag,
      city: pos.city,
      lat: pos.lat,
      lng: pos.lng,
      coordsPrecision: pos.precision,
      image: row.img,
      keywords: [row.type, row.tag, "place of worship", "prayer"],
    };
  });
}

/** The curated directory covering everything the legacy data missed. */
function fromDirectory(): Place[] {
  return DIRECTORY_ROWS.map((row) => {
    const pos = position(row.area ? `${row.area} ${row.district}` : row.district);
    return {
      id: "",
      name: row.name,
      categoryId: row.group,
      subcategory: row.subcategory,
      city: pos.city === "Rwanda" ? row.district : pos.city,
      area: row.area,
      lat: pos.lat,
      lng: pos.lng,
      coordsPrecision: pos.precision,
      description: row.description,
      keywords: [row.subcategory.toLowerCase(), row.group],
    };
  });
}

/* ---------------------------------------------------------------- assembly */

const MAP_ROW_TARGET: Record<string, { group: string; subcategory: string }> = {
  History: { group: "memorials", subcategory: "Genocide Memorials" },
  Hotel: { group: "stays", subcategory: "Hotels" },
  Food: { group: "dining", subcategory: "Restaurants" },
};

/**
 * The old /map page kept its own four-record list, three of which duplicate
 * places already in the catalog but with exact coordinates and a rating. Merge
 * those in rather than shipping duplicates, and add the one that is new.
 */
function mergeMapRows(places: Place[]): Place[] {
  const byName = new Map(places.map((p) => [nameKey(p.name), p]));

  for (const row of MAP_ROWS) {
    const key = nameKey(row.name);
    // "Inzora Rooftop Cafe" vs "Inzora Rooftop" — match on prefix either way.
    const existing =
      byName.get(key) ??
      places.find((p) => {
        const pk = nameKey(p.name);
        return pk.startsWith(key) || key.startsWith(pk);
      });

    if (existing) {
      if (existing.rating === undefined) existing.rating = row.rating;
      if (existing.coordsPrecision !== "exact") {
        existing.lat = row.lat;
        existing.lng = row.lng;
        existing.coordsPrecision = "exact";
      }
      continue;
    }

    const target = MAP_ROW_TARGET[row.type] ?? {
      group: "wonders",
      subcategory: "Landmarks",
    };
    places.push({
      id: "",
      name: row.name,
      categoryId: target.group,
      subcategory: target.subcategory,
      city: resolveDistrict("Kigali") ?? "Nyarugenge",
      lat: row.lat,
      lng: row.lng,
      coordsPrecision: "exact",
      rating: row.rating,
      image: row.img,
    });
  }

  return places;
}

/** Assign stable, unique, URL-safe ids. */
function assignIds(places: Place[]): Place[] {
  const seen = new Map<string, number>();
  for (const place of places) {
    const base = `${place.categoryId}-${slugify(place.name)}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    place.id = n === 1 ? base : `${base}-${n}`;
  }
  return places;
}

/**
 * Roughly 30 legacy records carry their photo as an inline `data:` URI —
 * half a megabyte of base64 in total. Inlining those into every HTML response
 * (and into any client bundle that touched the catalog) is indefensible, so
 * they are lifted out here and served by /api/place-image/[id] with a long
 * cache. `place.image` becomes a short URL like any other.
 */
const INLINE_IMAGES = new Map<string, string>();

function externaliseInlineImages(places: Place[]): Place[] {
  for (const place of places) {
    if (place.image?.startsWith("data:")) {
      INLINE_IMAGES.set(place.id, place.image);
      place.image = `/api/place-image/${place.id}`;
    }
  }
  return places;
}

/** The original data URI for a place, if it had one. Server-only. */
export function inlineImage(id: string): string | undefined {
  return INLINE_IMAGES.get(id);
}

/**
 * Drop entries whose name collides with a directory entry for the same place,
 * so "Amahoro National Stadium" doesn't appear twice once the playground data
 * and the directory both claim it.
 */
function dedupeByName(places: Place[]): Place[] {
  const seen = new Set<string>();
  const out: Place[] = [];
  for (const place of places) {
    const key = nameKey(place.name);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(place);
  }
  return out;
}

function build(): Place[] {
  const places = dedupeByName([
    ...fromRestaurants(),
    ...fromShops(),
    ...fromHistorics(),
    ...fromWonders(),
    ...fromPlaygrounds(),
    ...fromGyms(),
    ...fromChurches(),
    ...fromDirectory(),
  ]);
  return externaliseInlineImages(assignIds(mergeMapRows(places)));
}

/** The catalog. Built once per process. */
export const PLACES: Place[] = build();

export const PLACES_BY_ID: Map<string, Place> = new Map(
  PLACES.map((p) => [p.id, p]),
);

export function getPlace(id: string): Place | undefined {
  return PLACES_BY_ID.get(id);
}

export function placesInCategory(categoryId: string): Place[] {
  return PLACES.filter((p) => p.categoryId === categoryId);
}

export function countByCategory(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const place of PLACES) {
    counts[place.categoryId] = (counts[place.categoryId] ?? 0) + 1;
  }
  return counts;
}

/** How many places sit under each "group/subcategory" pair. */
export function countBySubcategory(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const place of PLACES) {
    const key = `${place.categoryId}/${place.subcategory}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

/** Group counts plus their subcategory counts, for the sidebar and explorer. */
export interface GroupSummary {
  id: string;
  total: number;
  subcategories: { name: string; count: number }[];
}

export function groupSummaries(): GroupSummary[] {
  const byCategory = countByCategory();
  const bySub = countBySubcategory();

  return CATEGORY_GROUPS.map((group) => ({
    id: group.id,
    total: byCategory[group.id] ?? 0,
    subcategories: group.subcategories.map((name) => ({
      name,
      count: bySub[`${group.id}/${name}`] ?? 0,
    })),
  }));
}

/* -------------------------------------------------------------- geography */

/** Kigali's three districts read as one city to a user. */
export function cityGroup(place: Place): string {
  return KIGALI_DISTRICTS.includes(place.city) ? "Kigali" : place.city;
}

export interface CitySummary {
  name: string;
  count: number;
  /** A representative image drawn from the city's own listings. */
  image?: string;
}

export function citySummaries(): CitySummary[] {
  const map = new Map<string, CitySummary>();
  for (const place of PLACES) {
    const name = cityGroup(place);
    const entry = map.get(name) ?? { name, count: 0 };
    entry.count += 1;
    if (!entry.image && isRenderableImage(place.image)) entry.image = place.image;
    map.set(name, entry);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export function placesInCity(city: string): Place[] {
  return PLACES.filter((p) => cityGroup(p) === city);
}

/**
 * A few legacy image URLs are known-dead (a removed Flickr upload, some
 * `googleusercontent.com/image_collection/...` links that never resolved).
 * Skip them when *choosing* a hero image; cards still attempt them and fall
 * back visually if they 404.
 */
export function isRenderableImage(url: string | undefined): url is string {
  if (!url) return false;
  if (url.includes("googleusercontent.com/image_collection")) return false;
  if (url.includes("live.staticflickr.com/65535/48598424266")) return false;
  if (url.startsWith("https://mail.google.com/")) return false;
  return true;
}

/* --------------------------------------------------------------- ranking */

/**
 * Places sorted by distance from `origin`. Records without coordinates are
 * dropped — a "Near You" row cannot honestly include them.
 */
export function nearest(
  origin: Coords,
  options: { limit?: number; categoryId?: string; maxKm?: number } = {},
): PlaceWithDistance[] {
  const { limit = 12, categoryId, maxKm } = options;
  const out: PlaceWithDistance[] = [];

  for (const place of PLACES) {
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
 * "Popular" with no analytics behind it would be a lie. What we do have is
 * ratings and imagery, so this is explicitly *top rated* — and it is labelled
 * that way in the UI. Round-robins across categories so one category can't
 * fill the row.
 */
export function topRated(limit = 10, categoryId?: string): Place[] {
  const eligible = PLACES.filter(
    (p) =>
      p.rating !== undefined &&
      isRenderableImage(p.image) &&
      (!categoryId || p.categoryId === categoryId),
  ).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

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
export function featured(limit = 8): Place[] {
  const wanted = ["nature", "wonders", "memorials", "arts"];
  return PLACES.filter(
    (p) => wanted.includes(p.categoryId) && isRenderableImage(p.image),
  ).slice(0, limit);
}

/* ----------------------------------------------------------- search index */

/**
 * A trimmed copy of the catalog for the search screen to filter in the browser.
 *
 * Descriptions are dropped (they are the heaviest field and the weakest search
 * signal) but keywords are kept, so "coffee" still finds Question Coffee.
 * Images are already short URLs by this point. The result is a few tens of
 * kilobytes — small enough to hand to the client so search feels instant, with
 * no request per keystroke.
 */
export function buildSearchIndex(): Place[] {
  return PLACES.map((place) => ({
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

/** Server-side convenience wrapper around the pure search function. */
export function searchCatalog(
  query: string,
  options: Parameters<typeof searchPlaces>[2] = {},
) {
  return searchPlaces(PLACES, query, options);
}
