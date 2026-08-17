import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { parseQuery, matchesCity, searchPlaces } from "../lib/places/search";
import { place, KIGALI } from "./helpers";

describe("parseQuery", () => {
  test("pulls a city out of the query and leaves the rest as text", () => {
    const parsed = parseQuery("coffee in Musanze");
    assert.equal(parsed.city, "Musanze");
    assert.ok(!parsed.text.includes("musanze"));
  });

  test("detects the near-me intent in its various phrasings", () => {
    for (const phrase of ["near me", "nearby", "closest", "around me"]) {
      assert.equal(parseQuery(`pharmacy ${phrase}`).nearMe, true, phrase);
    }
  });

  test("does not claim near-me when it was not asked for", () => {
    assert.equal(parseQuery("pharmacy in Huye").nearMe, false);
  });

  test("prefers a specific subcategory over the broader group", () => {
    // "waterfalls" is more specific than "nature"; resolving it to the group
    // would lose the filter the user actually asked for.
    const parsed = parseQuery("waterfalls");
    assert.ok(parsed.subcategory, "expected a subcategory to be resolved");
  });

  test("strips filler words from the leftover text", () => {
    const parsed = parseQuery("the best hotel in the city");
    const words = parsed.text.split(" ");
    assert.ok(!words.includes("the"));
    assert.ok(!words.includes("in"));
  });

  test("keeps the raw query untouched for display", () => {
    assert.equal(parseQuery("  Repub Lounge  ").raw, "Repub Lounge");
  });

  test("handles an empty query without throwing", () => {
    const parsed = parseQuery("");
    assert.equal(parsed.text, "");
    assert.equal(parsed.nearMe, false);
  });
});

describe("matchesCity", () => {
  test("Kigali matches any of its three districts", () => {
    for (const district of ["Gasabo", "Kicukiro", "Nyarugenge"]) {
      assert.equal(matchesCity(place({ city: district }), "Kigali"), true);
    }
  });

  test("Kigali does not match another district", () => {
    assert.equal(matchesCity(place({ city: "Musanze" }), "Kigali"), false);
  });

  test("other cities match exactly", () => {
    assert.equal(matchesCity(place({ city: "Musanze" }), "Musanze"), true);
    assert.equal(matchesCity(place({ city: "Musanze" }), "Huye"), false);
  });
});

describe("searchPlaces", () => {
  const catalog = [
    place({ id: "repub", name: "Repub Lounge", city: "Gasabo", categoryId: "dining" }),
    place({
      id: "market",
      name: "Kimironko Market",
      city: "Gasabo",
      categoryId: "shopping",
      subcategory: "Markets",
      description: "A busy market with a lively atmosphere",
    }),
    place({
      id: "atm",
      name: "Bank of Kigali ATM",
      city: "Nyarugenge",
      categoryId: "finance",
      subcategory: "ATMs",
    }),
    place({ id: "lodge", name: "Musanze Lodge", city: "Musanze", categoryId: "stays" }),
  ];

  const ids = (query: string, options = {}) =>
    searchPlaces(catalog, query, options).places.map((p) => p.id);

  test("finds a place by an exact name", () => {
    assert.equal(ids("Repub Lounge")[0], "repub");
  });

  test("finds a place by a prefix of its name", () => {
    assert.equal(ids("Kimiron")[0], "market");
  });

  test("a recognised term resolves to its subcategory filter", () => {
    // "atm" is a known subcategory phrase, so it narrows to finance/ATMs
    // rather than being matched as free text.
    const found = ids("atm");
    assert.deepEqual(found, ["atm"]);
  });

  test("a short term must match a whole word, not a substring", () => {
    // A 3-letter term matching as a substring is how a search for a cash
    // machine ("atm") ends up returning somewhere with an "atmosphere".
    const shortTerms = [
      place({ id: "whole", name: "Zen Garden" }),
      place({ id: "substring", name: "Yoghurt Bar", description: "frozen yoghurt" }),
    ];
    const found = searchPlaces(shortTerms, "zen").places.map((p) => p.id);
    assert.deepEqual(found, ["whole"], '"zen" must not match inside "frozen"');
  });

  test("a longer term may match as a substring", () => {
    assert.ok(ids("lodg").includes("lodge"));
  });

  test("every term must land somewhere", () => {
    assert.equal(ids("Repub Zanzibar").length, 0);
  });

  test("a city in the query narrows the results", () => {
    const result = searchPlaces(catalog, "in Musanze");
    assert.ok(result.places.length > 0);
    assert.ok(result.places.every((p) => p.city === "Musanze"));
  });

  test("an explicit city option narrows the results", () => {
    const result = searchPlaces(catalog, "", { city: "Kigali" });
    assert.ok(result.places.length > 0);
    assert.ok(result.places.every((p) => p.city !== "Musanze"));
  });

  test("an explicit category option narrows the results", () => {
    assert.deepEqual(ids("", { categoryId: "stays" }), ["lodge"]);
  });

  test("limit caps the returned places but total reports the real count", () => {
    const result = searchPlaces(catalog, "", { limit: 2 });
    assert.equal(result.places.length, 2);
    assert.equal(result.total, catalog.length, "total must ignore the limit");
  });

  test("attaches a distance when an origin is given", () => {
    const withCoords = [
      place({ id: "near", name: "Near Place", lat: KIGALI.lat, lng: KIGALI.lng }),
    ];
    const result = searchPlaces(withCoords, "Near Place", { origin: KIGALI });
    assert.equal(typeof result.places[0]?.distanceKm, "number");
  });

  test("near me sorts by distance rather than text score", () => {
    // "coffee" resolves to dining/Cafés, so both fixtures must sit in that
    // subcategory to survive the filter and reach the sort being tested.
    const cafes = [
      // The better text match is the further away of the two.
      place({
        id: "far",
        name: "Coffee",
        subcategory: "Cafés",
        lat: -2.5967,
        lng: 29.7392,
      }),
      place({
        id: "close",
        name: "Corner Cafe",
        subcategory: "Cafés",
        lat: KIGALI.lat,
        lng: KIGALI.lng,
      }),
    ];
    const result = searchPlaces(cafes, "coffee near me", { origin: KIGALI });
    assert.equal(result.places[0]?.id, "close");
  });

  test("returns nothing for a query that matches nothing", () => {
    assert.deepEqual(ids("zzzzzzzz"), []);
  });

  test("handles an empty catalog", () => {
    const result = searchPlaces([], "anything");
    assert.deepEqual(result.places, []);
    assert.equal(result.total, 0);
  });
});
