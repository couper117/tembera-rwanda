import type { Place } from "../lib/places/types";

/**
 * A Place with sensible defaults, so each test only states the fields it is
 * actually about. Tests that spell out all fifteen fields hide their own point.
 */
export function place(overrides: Partial<Place> = {}): Place {
  return {
    id: overrides.id ?? `p-${Math.random().toString(36).slice(2, 9)}`,
    name: "Test Place",
    categoryId: "dining",
    subcategory: "Restaurants",
    city: "Gasabo",
    coordsPrecision: "exact",
    ...overrides,
  };
}

/** Coordinates of a few real landmarks, for distance assertions. */
export const KIGALI = { lat: -1.9441, lng: 30.0619 };
export const MUSANZE = { lat: -1.4995, lng: 29.6347 };
export const HUYE = { lat: -2.5967, lng: 29.7392 };
