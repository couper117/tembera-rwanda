import { strict as assert } from "node:assert";
import { test } from "node:test";
import { comparePromotion, isPromoted, placementOf, relevanceBand } from "../lib/places/ranking";
import { searchPlaces } from "../lib/places/search";
import { sponsored, withPromotedFirst } from "../lib/places/engine";
import type { Place } from "../lib/places/types";

function place(over: Partial<Place> & { id: string; name: string }): Place {
  return {
    categoryId: "dining",
    subcategory: "Restaurants",
    city: "Gasabo",
    coordsPrecision: "district",
    image: "https://example.com/a.jpg",
    ...over,
  } as Place;
}

test("only the Top plan buys placement", () => {
  assert.equal(placementOf({ plan: "top" }), "top");
  assert.equal(placementOf({ plan: "checked" }), "checked");
  assert.equal(placementOf({ plan: "free" }), "none");
  assert.equal(placementOf({}), "none");
  // Checked buys the verified tick, not the ordering.
  assert.equal(isPromoted({ plan: "checked" }), false);
  assert.equal(isPromoted({ plan: "top" }), true);
});

test("a sensitive place cannot be promoted at any price", () => {
  assert.equal(placementOf({ plan: "top", sensitive: true }), "none");
  assert.equal(isPromoted({ plan: "top", sensitive: true }), false);
});

test("promotion never invents relevance", () => {
  // A promoted restaurant must not appear in a search for a pharmacy.
  const rows = [
    place({ id: "a", name: "Paid Restaurant", plan: "top" }),
    place({ id: "b", name: "City Pharmacy", categoryId: "health", subcategory: "Pharmacies" }),
  ];
  const { places } = searchPlaces(rows, "pharmacy");
  assert.deepEqual(places.map((p) => p.id), ["b"]);
});

test("promotion never beats a materially better match", () => {
  // An exact name match (100) against a promoted description hit (5). The
  // free listing must win — this is the whole point of banding.
  const rows = [
    place({ id: "paid", name: "Somewhere Else", description: "great burgers here", plan: "top" }),
    place({ id: "free", name: "Burgers" }),
  ];
  const { places } = searchPlaces(rows, "Burgers");
  assert.equal(places[0].id, "free");
});

test("promotion reorders listings that matched in the same way", () => {
  // Two substring matches of the same kind. The promoted one leads, even
  // though the free one is better rated — rating is the tie-break BELOW
  // placement, which is exactly what is being sold.
  const rows = [
    place({ id: "free", name: "Umuco Bakery", rating: 4.9 }),
    place({ id: "paid", name: "Ubuki Bakery", plan: "top", rating: 4.0 }),
  ];
  const { places } = searchPlaces(rows, "bakery");
  assert.equal(places[0].id, "paid", "a Top listing leads among comparable matches");
});

test("distance still wins when the reader asked for near me", () => {
  const rows = [
    // "cafe" parses into a subcategory filter of its own, which would decide
    // this test before promotion got a look in. "bakery" is plain text.
    place({ id: "far", name: "Far Bakery", plan: "top", lat: -2.6, lng: 29.7, coordsPrecision: "exact" }),
    place({ id: "near", name: "Near Bakery", lat: -1.95, lng: 30.06, coordsPrecision: "exact" }),
  ];
  const { places } = searchPlaces(rows, "bakery near me", {
    origin: { lat: -1.95, lng: 30.06 },
  });
  assert.equal(places.length, 2);
  assert.equal(places[0].id, "near", "paying must not make a listing nearer than it is");
});

test("the sponsored row carries only promoted, non-sensitive listings", () => {
  const rows = [
    place({ id: "top", name: "Paid", plan: "top", rating: 4.1 }),
    place({ id: "top2", name: "Paid Better", plan: "top", rating: 4.8 }),
    place({ id: "checked", name: "Checked", plan: "checked", rating: 5 }),
    place({ id: "free", name: "Free", rating: 5 }),
    place({ id: "memorial", name: "Memorial", plan: "top", sensitive: true, categoryId: "memorials" }),
  ];
  const out = sponsored(rows, 8, new Set(["memorials"]));
  // Rating orders the row, so one business cannot outbid another for first.
  assert.deepEqual(out.map((p) => p.id), ["top2", "top"]);
});

test("a browse list puts promoted first and leaves the rest alone", () => {
  const rows = [
    place({ id: "a", name: "A" }),
    place({ id: "b", name: "B", plan: "top" }),
    place({ id: "c", name: "C" }),
  ];
  assert.deepEqual(withPromotedFirst(rows).map((p) => p.id), ["b", "a", "c"]);
  // Nothing promoted: the original order survives untouched.
  const plain = [place({ id: "x", name: "X" }), place({ id: "y", name: "Y" })];
  assert.equal(withPromotedFirst(plain), plain);
});

test("comparePromotion composes as a tie-break", () => {
  assert.equal(comparePromotion({ plan: "top" }, { plan: "free" }), -1);
  assert.equal(comparePromotion({ plan: "free" }, { plan: "top" }), 1);
  assert.equal(comparePromotion({ plan: "top" }, { plan: "top" }), 0);
  assert.equal(comparePromotion({ plan: "free" }, { plan: "checked" }), 0);
});

test("relevance bands group comparable scores", () => {
  assert.equal(relevanceBand(100), relevanceBand(110));
  assert.notEqual(relevanceBand(100), relevanceBand(40));
  assert.notEqual(relevanceBand(40), relevanceBand(5));
});
