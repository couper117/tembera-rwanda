import type { Place } from "./types";

/**
 * Where "Directions" goes.
 *
 * Our own screen, not Google's. Every one of the three buttons that offered
 * directions used to hand the reader off to google.com/maps, which ends the
 * visit: they leave Tembera, and whatever they were browsing is gone.
 *
 * `/navigate/[id]` is where they go instead: turn-by-turn steps, distance and
 * an arrival time, on our own map. It was chosen over `/map` because
 * navigating to one place is the whole task the reader just asked for, and
 * that screen is built around it.
 *
 * The external link survives only as the fallback for a listing that has no
 * coordinates but does carry a map link from the source data — there, a
 * hand-off beats a dead button.
 *
 * Pure, so both the server-rendered hero and the client action bar can use it.
 */
export interface Directions {
  href: string;
  /** True only for the fallback: needs target="_blank", not client routing. */
  external: boolean;
}

export function directionsFor(place: Place): Directions | null {
  if (place.lat !== undefined && place.lng !== undefined) {
    return { href: `/navigate/${encodeURIComponent(place.id)}`, external: false };
  }
  if (place.mapLink) return { href: place.mapLink, external: true };
  return null;
}
