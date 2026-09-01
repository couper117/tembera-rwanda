import { strict as assert } from "node:assert";
import { test } from "node:test";
import { beyondKigali, homeRows } from "../lib/home/rows";
import type { Place } from "../lib/places/types";

/**
 * Enough places in a category that a row is allowed to form.
 *
 * Each gets its own subcategory and photograph on purpose: a row caps how many
 * it takes from one subcategory and refuses a repeated image, so a fixture
 * where every place is identical would collapse to one card — which is the
 * behaviour under test elsewhere, not the baseline.
 */
function bulk(categoryId: string, n: number, city = "Gasabo", rating = 4): Place[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${categoryId}-${city}-${i}`,
    name: `${categoryId} ${i}`,
    categoryId,
    subcategory: `Kind ${i}`,
    city,
    coordsPrecision: "district",
    image: `https://example.com/${categoryId}-${city}-${i}.jpg`,
    rating: rating + i / 100,
  })) as Place[];
}

const CATALOGUE = [
  ...bulk("dining", 6),
  ...bulk("nature", 6),
  ...bulk("shopping", 6),
  ...bulk("arts", 6),
  ...bulk("stays", 6),
  ...bulk("memorials", 6),
];

test("interests lead, and the categories they name are used", () => {
  const rows = homeRows(CATALOGUE, ["food", "shopping"], new Set(["memorials"]));
  assert.equal(rows[0].id, "interest-food");
  assert.equal(rows[1].id, "interest-shopping");
  assert.equal(rows[0].reason, "interest");
});

test("a few rows they did not pick follow, and never repeat a category", () => {
  const rows = homeRows(CATALOGUE, ["food"], new Set(["memorials"]));
  const discover = rows.filter((r) => r.reason === "discover");
  assert.ok(discover.length > 0, "the feed must widen, not mirror");
  assert.ok(discover.length <= 3, "widening, not drowning");
  // "food" took dining, so no discovery row may show dining again.
  assert.ok(!discover.some((r) => r.id === "discover-dining"));
});

test("no interests still produces the full default page", () => {
  const rows = homeRows(CATALOGUE, [], new Set(["memorials"]));
  assert.ok(rows.length > 0, "personalisation adds; it never removes the default");
  assert.ok(rows.every((r) => r.reason === "everyone"));
});

test("sensitive categories never appear", () => {
  const rows = homeRows(CATALOGUE, ["food"], new Set(["memorials"]));
  for (const row of rows) {
    assert.ok(row.places.every((p) => p.categoryId !== "memorials"));
    assert.ok(!row.id.includes("memorial"));
  }
});

test("a category too thin to fill a row is skipped rather than shown short", () => {
  const thin = [...bulk("dining", 6), ...bulk("nature", 2)];
  const rows = homeRows(thin, ["nature", "food"], new Set());
  assert.ok(!rows.some((r) => r.id === "interest-nature"), "two places is not a row");
  assert.ok(rows.some((r) => r.id === "interest-food"));
});

test("places with no usable photo are left out", () => {
  const noPhotos = bulk("dining", 6).map((p) => ({ ...p, image: undefined }));
  const rows = homeRows(noPhotos, ["food"], new Set());
  assert.equal(rows.length, 0);
});

test("beyond Kigali surfaces the rest of the country", () => {
  const mixed = [
    ...bulk("nature", 4, "Gasabo", 5),
    ...bulk("nature", 4, "Musanze", 4),
  ];
  const out = beyondKigali(mixed, new Set());
  assert.ok(out.length > 0);
  assert.ok(
    out.every((p) => !["Gasabo", "Kicukiro", "Nyarugenge", "Kigali"].includes(p.city)),
    "the whole point is that Kigali does not fill this row",
  );
});

test("beyond Kigali does not require a rating", () => {
  // Only twelve listings in the real catalogue carry a rating and all are in
  // Kigali, so requiring one left this row permanently empty.
  const unrated = bulk("nature", 6, "Rubavu").map((p) => ({ ...p, rating: undefined }));
  assert.ok(beyondKigali(unrated, new Set()).length > 0);
});

test("beyond Kigali spreads across districts", () => {
  const many = [
    ...bulk("nature", 8, "Musanze"),
    ...bulk("nature", 8, "Rubavu"),
    ...bulk("nature", 8, "Huye"),
  ];
  const cities = new Set(beyondKigali(many, new Set(), 6).map((p) => p.city));
  assert.equal(cities.size, 3, "breadth of the country, not depth in one district");
});

test("a row never repeats a photograph", () => {
  // The real failure this guards: 181 ADEPR churches share one stock photo,
  // and "Culture & heritage" rendered as six identical pictures.
  const same = bulk("arts", 8).map((p) => ({ ...p, image: "https://example.com/one.jpg" }));
  const rows = homeRows(same, ["culture"], new Set());
  assert.equal(rows.length, 0, "eight copies of one photo is not a row");
});

test("a row never fills with one subcategory", () => {
  const churchy = bulk("arts", 8).map((p) => ({ ...p, subcategory: "Churches" }));
  const varied = bulk("arts", 4, "Huye").map((p, i) => ({ ...p, subcategory: `Other ${i}` }));
  const rows = homeRows([...churchy, ...varied], ["culture"], new Set());
  const row = rows.find((r) => r.id === "interest-culture");
  assert.ok(row);
  const churches = row.places.filter((p) => p.subcategory === "Churches").length;
  assert.ok(churches <= 2, `one subcategory took ${churches} of the row`);
});

test("the page does not grow without limit", () => {
  const big = [
    ...bulk("dining", 8), ...bulk("nature", 8), ...bulk("arts", 8),
    ...bulk("shopping", 8), ...bulk("wonders", 8), ...bulk("recreation", 8),
    ...bulk("stays", 8),
  ];
  const rows = homeRows(big, ["food", "nature", "culture", "shopping", "photography"], new Set());
  assert.ok(rows.length <= 5, `nine near-identical scrollers is not a page (${rows.length})`);
});

test("a Top-plan listing leads its row", () => {
  const ordinary = bulk("dining", 6, "Gasabo", 5);
  const paid = { ...bulk("dining", 1, "Huye", 1)[0], id: "paid", name: "Paid", plan: "top" as const };
  const rows = homeRows([...ordinary, paid], ["food"], new Set());
  const row = rows.find((r) => r.id === "interest-food");
  assert.ok(row);
  // Worst rating in the set, first in the row — that is what was bought.
  assert.equal(row.places[0].id, "paid");
});

test("promotion still cannot put a listing in the wrong row", () => {
  // A paid restaurant must not appear under an interest that does not name
  // dining. Promotion reorders; it never invents relevance.
  const paidDining = { ...bulk("dining", 1)[0], id: "paid", plan: "top" as const };
  const nature = bulk("nature", 6, "Huye");
  const rows = homeRows([paidDining, ...nature], ["nature"], new Set());
  const row = rows.find((r) => r.id === "interest-nature");
  assert.ok(row);
  assert.ok(!row.places.some((p) => p.id === "paid"));
});
