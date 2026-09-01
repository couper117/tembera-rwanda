// Search over a list of places.
//
// Every function here is pure and takes its data as an argument — it never
// imports the catalog. That matters: the catalog module pulls in the raw source
// datasets, so importing it from a client component would ship the whole thing
// to the browser. The search screen instead receives a slim index as props and
// runs these functions locally, which is what makes results feel instant.

import { DISTRICT_CENTRES, KIGALI_DISTRICTS, distanceKm } from "./geo";
import { CATEGORY_GROUPS } from "./taxonomy";
import type { CategoryId, Coords, Place, PlaceWithDistance } from "./types";
import { comparePromotion, relevanceBand } from "./ranking";

/** Words that map a query onto a category group. */
const CATEGORY_SYNONYMS: Record<CategoryId, string[]> = {
  dining: [
    "eat", "food", "restaurant", "restaurants", "dining", "dine", "cafe",
    "cafes", "café", "cafés", "coffee", "bar", "bars", "resto bar", "nightlife",
    "drink", "drinks", "lunch", "dinner", "breakfast", "brunch", "pizza",
    "grill", "fast food", "takeaway",
  ],
  stays: [
    "stay", "stays", "hotel", "hotels", "accommodation", "lodge", "lodges",
    "guest house", "guesthouse", "guest houses", "sleep", "motel", "resort",
    "resorts", "hostel", "hostels", "bnb", "where to sleep",
  ],
  shopping: [
    "market", "markets", "shop", "shops", "shopping", "supermarket",
    "supermarkets", "mall", "malls", "shopping center", "shopping centre",
    "craft", "crafts", "souvenir", "souvenirs", "boutique", "grocery",
    "groceries", "store", "stores",
  ],
  finance: [
    "bank", "banks", "atm", "atms", "cash", "cashpoint", "money",
    "mobile money", "momo", "microfinance", "sacco", "forex", "exchange",
    "banking",
  ],
  worship: [
    "church", "churches", "mosque", "mosques", "worship", "prayer", "pray",
    "cathedral", "parish", "masjid", "temple", "temples", "catholic",
    "anglican", "pentecostal", "islam", "muslim", "christian", "shrine",
  ],
  education: [
    "school", "schools", "university", "universities", "college", "colleges",
    "campus", "library", "libraries", "training", "education", "academy",
    "polytechnic", "study",
  ],
  health: [
    "hospital", "hospitals", "clinic", "clinics", "pharmacy", "pharmacies",
    "chemist", "health", "health center", "health centre", "doctor",
    "doctors", "medical", "healthcare",
  ],
  arts: [
    "museum", "museums", "gallery", "galleries", "art", "arts", "cultural",
    "culture", "cultural center", "cultural centre", "exhibition",
  ],
  recreation: [
    "gym", "gyms", "fitness", "workout", "swimming", "swimming pool", "pool",
    "sports club", "playground", "playgrounds", "kids", "children", "family",
    "recreation", "leisure",
  ],
  sports: [
    "stadium", "stadiums", "arena", "arenas", "sports ground", "event venue",
    "event venues", "conference", "match", "football", "basketball",
  ],
  memorials: [
    "memorial", "memorials", "genocide", "genocide memorial", "history",
    "historic", "historical", "heritage", "remembrance",
  ],
  safety: [
    "police", "police station", "fire", "fire station", "emergency",
    "emergency services", "ambulance", "help", "safety",
  ],
  nature: [
    "nature", "park", "parks", "national park", "forest", "forests", "lake",
    "lakes", "hiking", "hike", "trail", "trails", "waterfall", "waterfalls",
    "wildlife", "safari", "gorilla", "gorillas", "outdoors", "reserve",
  ],
  transport: [
    "transport", "bus", "buses", "bus station", "bus park", "taxi", "taxis",
    "moto", "station", "terminal", "car rental", "car hire", "train",
    "transport hub",
  ],
  airports: [
    "airport", "airports", "flight", "flights", "terminal", "airstrip",
    "airstrips", "fly",
  ],
  wonders: [
    "wonder", "wonders", "attraction", "attractions", "landmark", "landmarks",
    "viewpoint", "viewpoints", "scenic", "monument", "monuments",
    "things to do", "sightseeing", "tourist",
  ],
};

/**
 * Colloquial ways of asking for a specific subcategory that its label alone
 * doesn't cover. The labels themselves (and their singulars) are derived
 * automatically below.
 */
const SUBCATEGORY_EXTRAS: Record<string, [string, string]> = {
  "cash machine": ["finance", "ATMs"],
  cashpoint: ["finance", "ATMs"],
  momo: ["finance", "Mobile Money"],
  sacco: ["finance", "Microfinance Institutions"],
  microfinance: ["finance", "Microfinance Institutions"],
  chemist: ["health", "Pharmacies"],
  drugstore: ["health", "Pharmacies"],
  "health centre": ["health", "Health Centers"],
  "fire brigade": ["safety", "Fire Stations"],
  fire: ["safety", "Fire Stations"],
  police: ["safety", "Police Stations"],
  ambulance: ["safety", "Emergency Services"],
  emergency: ["safety", "Emergency Services"],
  "bus park": ["transport", "Bus Stations"],
  "bus terminal": ["transport", "Bus Stations"],
  railway: ["transport", "Train Stations"],
  "car hire": ["transport", "Car Rental"],
  coffee: ["dining", "Cafés"],
  cafe: ["dining", "Cafés"],
  cafes: ["dining", "Cafés"],
  takeaway: ["dining", "Fast Food"],
  "shopping centre": ["shopping", "Shopping Centers"],
  masjid: ["worship", "Mosques"],
  cathedral: ["worship", "Churches"],
  parish: ["worship", "Churches"],
  campus: ["education", "Universities"],
  "training centre": ["education", "Training Centers"],
  "fitness centre": ["recreation", "Fitness Centers"],
  fitness: ["recreation", "Fitness Centers"],
  swimming: ["recreation", "Swimming Pools"],
  pool: ["recreation", "Swimming Pools"],
  conference: ["sports", "Event Venues"],
  genocide: ["memorials", "Genocide Memorials"],
  "nature reserve": ["nature", "Nature Reserves"],
  "national park": ["nature", "Parks"],
  trail: ["nature", "Hiking Trails"],
  trails: ["nature", "Hiking Trails"],
  hiking: ["nature", "Hiking Trails"],
  hike: ["nature", "Hiking Trails"],
  scenic: ["wonders", "Scenic Viewpoints"],
  sightseeing: ["wonders", "Tourist Attractions"],
};

/** "Pharmacies" -> "pharmacy", "Churches" -> "church", "ATMs" -> "atm". */
function singularise(label: string): string {
  const lower = label.toLowerCase();
  if (lower.endsWith("ies")) return `${lower.slice(0, -3)}y`;
  if (/(ches|shes|sses)$/.test(lower)) return lower.slice(0, -2);
  if (lower.endsWith("s")) return lower.slice(0, -1);
  return lower;
}

/**
 * Every phrase that should pin a query to one subcategory, longest first.
 *
 * Without this, "atm" only resolves as far as the Finance group and the user
 * gets twelve banks before the first cash machine.
 */
const SUBCATEGORY_MATCHERS: { phrase: string; group: string; subcategory: string }[] =
  (() => {
    const out = new Map<string, { group: string; subcategory: string }>();

    for (const group of CATEGORY_GROUPS) {
      for (const sub of group.subcategories) {
        const entry = { group: group.id, subcategory: sub };
        out.set(sub.toLowerCase(), entry);
        out.set(singularise(sub), entry);
        // Accent-free spelling, so "cafes" finds "Cafés".
        const ascii = sub.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
        out.set(ascii, entry);
        out.set(singularise(ascii), entry);
      }
    }
    for (const [phrase, [group, subcategory]] of Object.entries(SUBCATEGORY_EXTRAS)) {
      out.set(phrase, { group, subcategory });
    }

    return [...out.entries()]
      .map(([phrase, entry]) => ({ phrase, ...entry }))
      .sort((a, b) => b.phrase.length - a.phrase.length);
  })();

/** Longest first, so "Kigali" doesn't shadow a district inside it. */
const CITY_NAMES: string[] = ["Kigali", ...Object.keys(DISTRICT_CENTRES)].sort(
  (a, b) => b.length - a.length,
);

export interface ParsedQuery {
  /** Text left over after removing recognised category and city words. */
  text: string;
  categoryId?: CategoryId;
  /** Set when the query named a specific subcategory ("ATMs", "waterfalls"). */
  subcategory?: string;
  city?: string;
  /** True when the query asked for proximity ("near me", "nearby"). */
  nearMe: boolean;
  raw: string;
}

const NEAR_ME =
  /\b(near\s*me|nearby|near\s*by|around\s*me|close\s*to\s*me|closest|nearest)\b/i;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Synonyms flattened once, longest first ("things to do" beats "do"). */
const SORTED_SYNONYMS: { word: string; id: CategoryId }[] = Object.entries(
  CATEGORY_SYNONYMS,
)
  .flatMap(([id, words]) => words.map((word) => ({ word, id: id as CategoryId })))
  .sort((a, b) => b.word.length - a.word.length);

export function parseQuery(raw: string): ParsedQuery {
  const trimmed = raw.trim();
  let working = ` ${trimmed.toLowerCase()} `;

  const nearMe = NEAR_ME.test(trimmed);
  if (nearMe) working = working.replace(NEAR_ME, " ");

  let city: string | undefined;
  for (const name of CITY_NAMES) {
    const pattern = new RegExp(
      `\\b(?:in|at|around|near)?\\s*${escapeRegex(name.toLowerCase())}\\b`,
    );
    if (pattern.test(working)) {
      city = name;
      working = working.replace(pattern, " ");
      break;
    }
  }

  // A named subcategory is the most specific thing a query can say, so try it
  // before falling back to the broader group synonyms.
  let categoryId: CategoryId | undefined;
  let subcategory: string | undefined;

  for (const matcher of SUBCATEGORY_MATCHERS) {
    const pattern = new RegExp(`\\b${escapeRegex(matcher.phrase)}\\b`);
    if (pattern.test(working)) {
      categoryId = matcher.group;
      subcategory = matcher.subcategory;
      working = working.replace(pattern, " ");
      break;
    }
  }

  if (!categoryId) {
    for (const { word, id } of SORTED_SYNONYMS) {
      const pattern = new RegExp(`\\b${escapeRegex(word)}\\b`);
      if (pattern.test(working)) {
        categoryId = id;
        working = working.replace(pattern, " ");
        break;
      }
    }
  }

  const text = working
    .replace(/\b(in|at|the|a|an|near|around|for|to|me)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { text, categoryId, subcategory, city, nearMe, raw: trimmed };
}

/**
 * Terms of four characters or more match as substrings, so "restaur" finds
 * "restaurant". Shorter terms must match a whole word — otherwise "atm" hits
 * "atmosphere" and a search for a cash machine returns a produce market.
 */
function contains(haystack: string | undefined, term: string): boolean {
  if (!haystack) return false;
  const text = haystack.toLowerCase();
  if (term.length >= 4) return text.includes(term);
  return new RegExp(`\\b${escapeRegex(term)}\\b`).test(text);
}

function scoreText(place: Place, text: string): number {
  if (!text) return 1; // no text constraint — everything passes with a base score

  const name = place.name.toLowerCase();
  const terms = text.split(" ").filter(Boolean);
  let score = 0;

  for (const term of terms) {
    if (name === term) score += 100;
    else if (name.startsWith(term)) score += 60;
    else if (contains(name, term)) score += 40;
    else if (contains(place.subcategory, term)) score += 30;
    else if (contains(place.subtype, term)) score += 25;
    else if (contains(place.area, term)) score += 20;
    else if (contains(place.city, term)) score += 15;
    else if (place.keywords?.some((k) => contains(k, term))) score += 10;
    else if (contains(place.description, term)) score += 5;
    else return 0; // every term must land somewhere
  }

  return score;
}

export function matchesCity(place: Place, city: string): boolean {
  if (city === "Kigali") return KIGALI_DISTRICTS.includes(place.city);
  return place.city === city;
}

export interface SearchOptions {
  /** User position, used for "near me" and to attach distances. */
  origin?: Coords | null;
  limit?: number;
  /** Force a category regardless of what the query says. */
  categoryId?: string;
  subcategory?: string;
  city?: string;
}

export interface SearchResult {
  places: PlaceWithDistance[];
  parsed: ParsedQuery;
  /** Total matches before `limit` was applied. */
  total: number;
}

export function searchPlaces(
  places: Place[],
  query: string,
  options: SearchOptions = {},
): SearchResult {
  const { origin = null, limit = 40 } = options;
  const parsed = parseQuery(query);

  const categoryId = options.categoryId ?? parsed.categoryId;
  const subcategory = options.subcategory ?? parsed.subcategory;
  const city = options.city ?? parsed.city;

  const scored: { place: Place; score: number; distanceKm?: number }[] = [];

  for (const place of places) {
    if (categoryId && place.categoryId !== categoryId) continue;
    if (subcategory && place.subcategory !== subcategory) continue;
    if (city && !matchesCity(place, city)) continue;

    const score = scoreText(place, parsed.text);
    if (score === 0) continue;

    const distance =
      origin && place.lat !== undefined && place.lng !== undefined
        ? distanceKm(origin, { lat: place.lat, lng: place.lng })
        : undefined;

    scored.push({ place, score, distanceKm: distance });
  }

  // Proximity dominates when the user asked for it; otherwise text relevance
  // leads, then paid placement within a band of comparable relevance, then
  // rating.
  //
  // Banded, not additive. Adding points for a paid plan lets a weak paid match
  // overtake a strong free one — searching a restaurant's exact name and being
  // shown a different restaurant that paid. Banding means promotion reorders
  // listings that matched in roughly the same way and can never cross a real
  // difference in relevance. See lib/places/ranking.ts for the rules this is
  // enforcing; RELEVANCE_BAND is the one number that decides how much of the
  // results page is for sale.
  scored.sort((a, b) => {
    if (parsed.nearMe && origin) {
      // A promoted listing does not get to be nearer than it is.
      return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
    }
    const band = relevanceBand(b.score) - relevanceBand(a.score);
    if (band !== 0) return band;

    const promoted = comparePromotion(a.place, b.place);
    if (promoted !== 0) return promoted;

    if (b.score !== a.score) return b.score - a.score;
    return (b.place.rating ?? 0) - (a.place.rating ?? 0);
  });

  return {
    places: scored
      .slice(0, limit)
      .map(({ place, distanceKm: km }) => ({ ...place, distanceKm: km })),
    parsed,
    total: scored.length,
  };
}

/* ----------------------------------------------------------- suggestions */

export interface Suggestion {
  kind: "category" | "place" | "city";
  label: string;
  sublabel?: string;
  href: string;
}

/** Type-ahead: matching categories and cities first, then place names. */
export function suggest(places: Place[], query: string, limit = 8): Suggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const out: Suggestion[] = [];

  for (const category of CATEGORY_GROUPS) {
    if (
      category.label.toLowerCase().includes(q) ||
      CATEGORY_SYNONYMS[category.id]?.some((w) => w.startsWith(q))
    ) {
      out.push({
        kind: "category",
        label: category.title,
        sublabel: "Category",
        href: `/c/${category.id}`,
      });
    }

    // Subcategories are what people actually type ("pharmacies", "airstrips").
    for (const sub of category.subcategories) {
      if (sub.toLowerCase().startsWith(q)) {
        out.push({
          kind: "category",
          label: sub,
          sublabel: category.title,
          href: `/c/${category.id}?type=${encodeURIComponent(sub)}`,
        });
      }
    }
  }

  for (const name of CITY_NAMES) {
    if (name.toLowerCase().startsWith(q)) {
      out.push({
        kind: "city",
        label: name,
        sublabel: "City",
        href: `/city/${encodeURIComponent(name)}`,
      });
    }
  }

  for (const place of searchPlaces(places, query, { limit }).places) {
    out.push({
      kind: "place",
      label: place.name,
      sublabel: place.area ?? place.city,
      href: `/place/${place.id}`,
    });
  }

  return out.slice(0, limit);
}

/** Shown on the empty search screen — real queries this catalog can answer. */
export const SUGGESTED_SEARCHES = [
  "Restaurants in Kigali",
  "Hotels near me",
  "ATMs nearby",
  "Hospitals in Kigali",
  "Coffee",
  "Bus stations",
  "Museums",
  "Waterfalls",
  "Universities",
  "Lodges in Musanze",
];
