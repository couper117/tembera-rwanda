// The one shape every screen renders. Each legacy dataset had its own record
// type (Shop, Wonder, Listing, …); they are normalised into this on load so
// search, cards, the map and detail pages all speak a single language.

/** A category group id from lib/places/taxonomy.ts. */
export type CategoryId = string;

/** How much we actually know about where a place is. */
export type CoordsPrecision =
  /** Real coordinates shipped with the record. */
  | "exact"
  /** Only a district/area was known; coordinates are that district's centre. */
  | "district"
  /** No usable location at all. */
  | "unknown";

/**
 * Where a listing is in its life.
 *
 * Declared here rather than imported from Prisma so this module stays free of
 * the database layer — the public screens render this type, and dragging an
 * ORM type into them would drag it into the browser bundle.
 */
export type PlaceStatus =
  /** Not yet public: a new listing, or an edit awaiting review. */
  | "draft"
  /** Live in the catalogue. */
  | "published"
  /** Retired. The row and its public URL survive; it is out of the catalogue. */
  | "archived";

export interface Place {
  /** Stable, URL-safe. Derived from category + name, so links survive edits. */
  id: string;
  name: string;
  /** Top level of the taxonomy: "dining", "health", "transport"… */
  categoryId: CategoryId;
  /**
   * Second level. Always one of the group's `subcategories`, so category pages
   * can filter on it: "Cafés", "Hospitals", "Bus Stations"…
   */
  subcategory: string;
  /**
   * Optional third level already present in the source data — a denomination
   * ("Catholic"), a room type ("Villa"). Offered as a secondary filter only
   * when it adds something the subcategory doesn't.
   */
  subtype?: string;
  /** District or city the place sits in — always set. */
  city: string;
  /** Neighbourhood/sector when the source knew one. */
  area?: string;
  lat?: number;
  lng?: number;
  coordsPrecision: CoordsPrecision;
  /** Only present when the source actually carried one. Never invented. */
  rating?: number;
  image?: string;
  /** Extra photos for the detail page's gallery, beyond `image`. */
  images?: string[];
  description?: string;
  hours?: string;
  phone?: string;
  /** External maps link supplied by the source, if any. */
  mapLink?: string;
  /** The place's own site, distinct from `mapLink`. */
  website?: string;
  highlights?: string[];
  /** Nightly rate for stays. */
  priceFrom?: number;
  /** Extra keywords folded into search (cuisine, craft, "atm"…). */
  keywords?: string[];
  /** Admin override to hide ratings/reviews. Use isSensitivePlace(), which
   *  also treats every "memorials" category place as sensitive by default. */
  sensitive?: boolean;
  /** Where the listing is in its life. Only the staff reads care: the public
   *  ones return published rows and nothing else. */
  status?: PlaceStatus;
}

/** A place plus the distance from wherever the user currently is. */
export interface PlaceWithDistance extends Place {
  /** Kilometres. Undefined when either side lacks coordinates. */
  distanceKm?: number;
}

export interface Coords {
  lat: number;
  lng: number;
}
