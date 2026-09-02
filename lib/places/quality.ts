/**
 * What the catalogue is missing.
 *
 * Pure and data-agnostic, like search and ranking beside it: it takes rows and
 * returns findings, so it is unit tested without a database. `lib/data/quality.ts`
 * is the thin part that reads Postgres and calls in here.
 *
 * Every screen in this app renders correctly whether a place has a description
 * or not, which is exactly the problem — the gaps are invisible until somebody
 * opens one specific place and finds a name, a category and nothing else.
 */

/** The subset of a place these checks need. */
export interface QualityRow {
  id: string;
  name: string;
  city: string;
  categoryId: string;
  description?: string | null;
  image?: string | null;
  imageData?: string | null;
  website?: string | null;
  phone?: string | null;
  lat?: number | null;
  lng?: number | null;
  coordsPrecision?: string | null;
  rating?: number | null;
  hours?: string | null;
  hoursJson?: unknown;
}

export interface QualityPlace {
  id: string;
  name: string;
  city: string;
  categoryId: string;
}

export interface QualityGap {
  key: string;
  /** Short name, for the stat card. */
  label: string;
  /** What is missing and why it matters, for the panel. */
  detail: string;
  count: number;
  /** Every affected place. The screen decides how many to show. */
  places: QualityPlace[];
}

/** A photo used by more than one place. */
export interface DuplicatePhoto {
  image: string;
  places: QualityPlace[];
}

export interface CatalogQuality {
  total: number;
  /** Places with none of the gaps below, and a photo of their own. */
  complete: number;
  gaps: QualityGap[];
  duplicatePhotos: DuplicatePhoto[];
  /** How many places wear a photo that is not theirs alone. */
  duplicatePhotoPlaces: number;
}

const blank = (value: string | null | undefined) => !value || value.trim() === "";

// A place has a photo if either column carries one: `image` is the usual URL
// and `imageData` the inline data URI a handful of seeded rows still use.
const hasPhoto = (r: QualityRow) => !blank(r.image) || !blank(r.imageData);

interface GapDef {
  key: string;
  label: string;
  detail: string;
  hit: (r: QualityRow) => boolean;
}

export const GAPS: GapDef[] = [
  {
    key: "description",
    label: "No description",
    detail:
      "The place page falls back to a name and a category. This is the single field a visitor came for.",
    hit: (r) => blank(r.description),
  },
  {
    key: "photo",
    label: "No photo",
    detail:
      "Renders a placeholder in every card, row and search result the place appears in — not just on its own page.",
    hit: (r) => !hasPhoto(r),
  },
  {
    key: "coords",
    label: "No map pin",
    detail:
      "Cannot be placed on /map, cannot be routed to, and never appears in a near-me result.",
    hit: (r) => r.lat === null || r.lat === undefined || r.lng === null || r.lng === undefined,
  },
  {
    key: "approximate",
    label: "Approximate pin",
    detail:
      "Has coordinates, but only to district accuracy — directions will point at the right area and the wrong building.",
    hit: (r) =>
      r.lat !== null &&
      r.lat !== undefined &&
      r.lng !== null &&
      r.lng !== undefined &&
      r.coordsPrecision !== "exact",
  },
  {
    key: "hours",
    label: "No opening hours",
    detail:
      "Neither structured hours nor the free-text fallback, so the page cannot say whether it is open.",
    hit: (r) => (r.hoursJson === null || r.hoursJson === undefined) && blank(r.hours),
  },
  {
    key: "phone",
    label: "No phone",
    detail: "Nothing to call. The commonest thing a visitor wants after the address.",
    hit: (r) => blank(r.phone),
  },
  {
    key: "website",
    label: "No website",
    detail: "No way through to the place's own booking, menu or opening times.",
    hit: (r) => blank(r.website),
  },
  {
    key: "rating",
    label: "No rating",
    detail:
      "Sorts to the bottom of anything ranked by rating, and cannot appear in a top-rated row.",
    hit: (r) => r.rating === null || r.rating === undefined,
  },
];

const brief = (r: QualityRow): QualityPlace => ({
  id: r.id,
  name: r.name,
  city: r.city,
  categoryId: r.categoryId,
});

export function assessQuality(rows: QualityRow[]): CatalogQuality {
  const gaps: QualityGap[] = GAPS.map((def) => {
    const places = rows.filter(def.hit).map(brief);
    return { key: def.key, label: def.label, detail: def.detail, count: places.length, places };
  });

  /* ------------------------------------------------------- duplicate photos */
  //
  // Two places wearing the same photo is worse than one place wearing none: a
  // missing photo reads as incomplete, while a borrowed one reads as a claim
  // about somewhere the visitor may be about to travel to.
  const byImage = new Map<string, QualityRow[]>();
  for (const row of rows) {
    const key = (row.image ?? "").trim();
    if (!key) continue;
    byImage.set(key, [...(byImage.get(key) ?? []), row]);
  }

  const duplicatePhotos: DuplicatePhoto[] = [...byImage.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([image, group]) => ({ image, places: group.map(brief) }))
    // Worst first: the photo shared by the most places is the one to fix.
    .sort((a, b) => b.places.length - a.places.length);

  const duplicatePhotoPlaces = duplicatePhotos.reduce((n, d) => n + d.places.length, 0);

  const flagged = new Set([
    ...gaps.flatMap((g) => g.places.map((p) => p.id)),
    ...duplicatePhotos.flatMap((d) => d.places.map((p) => p.id)),
  ]);

  return {
    total: rows.length,
    complete: rows.filter((r) => !flagged.has(r.id)).length,
    gaps,
    duplicatePhotos,
    duplicatePhotoPlaces,
  };
}
