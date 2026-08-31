import type { Place } from "./types";

/**
 * What a price means, which depends entirely on what the place is.
 *
 * `priceFrom` was written for hotels and rendered everywhere as
 * "$12000 per night". On a restaurant that is meaningless; on a bank or a
 * memorial it is absurd. A number with the wrong unit is worse than no number,
 * because the reader believes it.
 *
 * Two rules follow:
 *   - Categories where a starting price is not a real concept do not show one
 *     at all, whatever is stored.
 *   - The unit comes from the category, not from a hardcoded string.
 *
 * Currency is Rwandan francs. The old copy said dollars while the seed data
 * was francs, which is the same class of mistake as the unit.
 */

interface PriceShape {
  /** "per night", "per person" — the unit that makes the number mean something. */
  unit: string;
  /** How the figure is introduced. */
  label: string;
}

const BY_CATEGORY: Record<string, PriceShape> = {
  stays: { unit: "per night", label: "Rooms from" },
  dining: { unit: "per person", label: "Mains from" },
  recreation: { unit: "per visit", label: "Entry from" },
  sports: { unit: "per ticket", label: "Tickets from" },
  nature: { unit: "per person", label: "Entry from" },
  wonders: { unit: "per person", label: "Entry from" },
  arts: { unit: "per person", label: "Entry from" },
  transport: { unit: "per trip", label: "Fares from" },
  shopping: { unit: "", label: "Prices from" },
};

/**
 * Categories where a price is never shown, even if one was stored.
 *
 * Memorials are the reason this list is a hard rule rather than a convention:
 * a place of remembrance must not carry a price, and that guarantee cannot
 * depend on nobody having typed one in.
 */
const NEVER_PRICED = new Set([
  "memorials",
  "worship",
  "health",
  "education",
  "finance",
  "safety",
  "airports",
]);

export interface DisplayPrice {
  label: string;
  value: string;
}

/**
 * The price to show for a place, or null when showing one would mislead.
 *
 * Formatted in francs with thousands separators — "12,000 RWF" reads as money;
 * "12000" reads as a reference number.
 */
export function displayPrice(
  place: Pick<Place, "categoryId" | "priceFrom" | "sensitive">,
): DisplayPrice | null {
  if (place.priceFrom === undefined || place.priceFrom === null) return null;
  if (place.priceFrom <= 0) return null;
  if (place.sensitive) return null;
  if (NEVER_PRICED.has(place.categoryId)) return null;

  const shape = BY_CATEGORY[place.categoryId];
  if (!shape) return null;

  const amount = `${place.priceFrom.toLocaleString("en-RW")} RWF`;
  return {
    label: shape.label,
    value: shape.unit ? `${amount} ${shape.unit}` : amount,
  };
}

/** Whether the editor should offer a price field for this category at all. */
export function categoryHasPricing(categoryId: string): boolean {
  return !NEVER_PRICED.has(categoryId) && categoryId in BY_CATEGORY;
}

/** The label to put on the price input, so the editor knows what to type. */
export function priceFieldLabel(categoryId: string): string {
  const shape = BY_CATEGORY[categoryId];
  if (!shape) return "Price from";
  return shape.unit ? `${shape.label} (${shape.unit})` : shape.label;
}
