import type { Place } from "./types";

/**
 * Where paid placement is allowed to change what a visitor sees.
 *
 * This is the part of the product where money touches the answers, so the
 * rules are written down rather than left to whoever edits a sort function
 * next. Tembera is a directory people use to find real places; the moment
 * paying can make a listing *look* better rather than *appear more often*, the
 * whole catalogue is worth less — including to the businesses paying for it.
 *
 * Four rules, and the code below exists to enforce them:
 *
 * 1. **Promotion never invents relevance.** A promoted listing can only rise
 *    among results that already match. Searching "pharmacy" must never surface
 *    a restaurant, whatever it paid.
 *
 * 2. **Promotion never beats a materially better match.** It reorders within a
 *    band of comparable relevance, never across one. This is why the boost is
 *    banded rather than added to the score: adding points lets a weak paid
 *    match overtake a strong free one, and that is how a directory becomes
 *    useless.
 *
 * 3. **Promotion never fakes quality.** "Top rated" is a claim about ratings
 *    and stays sorted purely by rating — putting paid listings in a section
 *    with that name would make the label a lie. Paid placement gets its own
 *    row, which says what it is.
 *
 * 4. **Promotion is always disclosed, and never in a sensitive category.** A
 *    memorial cannot be promoted at any price; `Place.plan` is already
 *    stripped from sensitive categories at the source in lib/data/places.ts.
 */

/** What a listing's owner is paying for, as far as ranking is concerned. */
export type Placement = "none" | "checked" | "top";

/**
 * A listing is only promoted while its owner's plan says so AND the business
 * is verified — the same pair that grants the tick. An unverified business
 * that has somehow acquired a plan string gets nothing.
 *
 * `plan` on a Place is derived in lib/data/places.ts from the owning business
 * and is undefined unless that business is verified, so reading it here is
 * already the whole check.
 */
export function placementOf(place: Pick<Place, "plan" | "sensitive">): Placement {
  if (place.sensitive) return "none";
  if (place.plan === "top") return "top";
  if (place.plan === "checked") return "checked";
  return "none";
}

/** Only the Top plan buys placement. Checked buys the tick, not the ordering. */
export function isPromoted(place: Pick<Place, "plan" | "sensitive">): boolean {
  return placementOf(place) === "top";
}

/**
 * Sort comparator: promoted first, otherwise unchanged.
 *
 * Returns 0 for two listings of the same standing so it composes as a
 * tie-break inside a larger sort rather than deciding one on its own.
 */
export function comparePromotion(
  a: Pick<Place, "plan" | "sensitive">,
  b: Pick<Place, "plan" | "sensitive">,
): number {
  return Number(isPromoted(b)) - Number(isPromoted(a));
}

/**
 * How coarsely search relevance is bucketed before promotion applies.
 *
 * Search scores run in steps: an exact name match is 100, a prefix 60, a
 * substring 40, subcategory 30, and so on down to 5 for a description hit.
 * A band of 20 means a promoted listing can outrank another that matched in
 * roughly the same way — two substring hits, say — and can never outrank one
 * that matched better in kind. Widening this would start selling the top of
 * the results page outright; that is the line, and it is here in one number so
 * moving it has to be a decision rather than a drift.
 */
export const RELEVANCE_BAND = 20;

export function relevanceBand(score: number): number {
  return Math.floor(score / RELEVANCE_BAND);
}
