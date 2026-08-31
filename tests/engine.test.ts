import { test, describe } from "node:test";
import assert from "node:assert/strict";

import * as engine from "../lib/places/engine";
import { place, KIGALI, MUSANZE } from "./helpers";

describe("cityGroup", () => {
  test("collapses Kigali's three districts into one city", () => {
    for (const district of ["Gasabo", "Kicukiro", "Nyarugenge"]) {
      assert.equal(engine.cityGroup(place({ city: district })), "Kigali");
    }
  });

  test("leaves other districts alone", () => {
    assert.equal(engine.cityGroup(place({ city: "Musanze" })), "Musanze");
  });
});

describe("isRenderableImage", () => {
  test("rejects missing images", () => {
    assert.equal(engine.isRenderableImage(undefined), false);
    assert.equal(engine.isRenderableImage(null), false);
    assert.equal(engine.isRenderableImage(""), false);
  });

  test("rejects the known-dead source URLs", () => {
    assert.equal(
      engine.isRenderableImage("https://lh3.googleusercontent.com/image_collection/x"),
      false,
    );
    assert.equal(
      engine.isRenderableImage("https://live.staticflickr.com/65535/48598424266_a.jpg"),
      false,
    );
    assert.equal(engine.isRenderableImage("https://mail.google.com/thing.jpg"), false);
  });

  test("accepts an ordinary URL", () => {
    assert.equal(
      engine.isRenderableImage("https://images.unsplash.com/photo-123"),
      true,
    );
  });
});

describe("counting", () => {
  const places = [
    place({ categoryId: "dining", subcategory: "Cafés" }),
    place({ categoryId: "dining", subcategory: "Cafés" }),
    place({ categoryId: "dining", subcategory: "Restaurants" }),
    place({ categoryId: "stays", subcategory: "Hotels" }),
  ];

  test("countByCategory totals each category", () => {
    assert.deepEqual(engine.countByCategory(places), { dining: 3, stays: 1 });
  });

  test("countBySubcategory keys on category and subcategory together", () => {
    const counts = engine.countBySubcategory(places);
    assert.equal(counts["dining/Cafés"], 2);
    assert.equal(counts["dining/Restaurants"], 1);
    assert.equal(counts["stays/Hotels"], 1);
  });

  test("an empty catalog counts to an empty object, not a crash", () => {
    assert.deepEqual(engine.countByCategory([]), {});
  });
});

describe("groupSummaries", () => {
  test("reports zero for a subcategory with no places rather than omitting it", () => {
    // The UI shows empty subcategories greyed out instead of hiding them, so a
    // zero must survive all the way through the summary.
    const summaries = engine.groupSummaries(
      [place({ categoryId: "transport", subcategory: "Bus Stations" })],
      [
        {
          id: "transport",
          label: "Transport",
          title: "Getting around",
          icon: "bus",
          subcategories: ["Bus Stations", "Train Stations"],
        } as never,
      ],
    );

    const transport = summaries[0];
    assert.equal(transport.total, 1);
    const train = transport.subcategories.find((s) => s.name === "Train Stations");
    assert.equal(train?.count, 0, "empty subcategory must be present with count 0");
  });
});

describe("citySummaries", () => {
  test("groups by display city and counts them", () => {
    const summaries = engine.citySummaries([
      place({ city: "Gasabo" }),
      place({ city: "Kicukiro" }),
      place({ city: "Musanze" }),
    ]);

    const kigali = summaries.find((c) => c.name === "Kigali");
    assert.equal(kigali?.count, 2);
    assert.equal(summaries.find((c) => c.name === "Musanze")?.count, 1);
  });

  test("sorts by count, densest city first", () => {
    const summaries = engine.citySummaries([
      place({ city: "Musanze" }),
      place({ city: "Gasabo" }),
      place({ city: "Gasabo" }),
    ]);
    assert.equal(summaries[0].name, "Kigali");
  });

  test("never picks a known-dead image to represent a city", () => {
    // "Bukavu" is not a Rwandan district and so has no curated photo, which is
    // what puts this on the fallback path the assertion is about.
    const summaries = engine.citySummaries([
      place({
        city: "Bukavu",
        image: "https://lh3.googleusercontent.com/image_collection/dead",
      }),
      place({ city: "Bukavu", image: "https://images.unsplash.com/good" }),
    ]);
    assert.equal(summaries[0].image, "https://images.unsplash.com/good");
  });

  test("prefers the curated city photo over any listing's own image", () => {
    // A city card should show the city. Left to the listings it showed
    // whichever row happened to have a photo first, which for most districts
    // was a bulk-seeded church image.
    const summaries = engine.citySummaries([
      place({ city: "Musanze", image: "https://images.unsplash.com/some-listing" }),
    ]);
    assert.equal(
      summaries[0].image,
      "/assets/images/wonder_volcanoes_national_park.jpg",
    );
  });
});

describe("nearest", () => {
  test("drops places with no coordinates", () => {
    // A "Near You" row cannot honestly include a place whose location is unknown.
    const results = engine.nearest(
      [
        place({ id: "known", lat: MUSANZE.lat, lng: MUSANZE.lng }),
        place({ id: "unknown" }),
      ],
      KIGALI,
    );
    assert.deepEqual(
      results.map((r) => r.id),
      ["known"],
    );
  });

  test("sorts by real distance, closest first", () => {
    const results = engine.nearest(
      [
        place({ id: "far", lat: MUSANZE.lat, lng: MUSANZE.lng }),
        place({ id: "here", lat: KIGALI.lat, lng: KIGALI.lng }),
      ],
      KIGALI,
    );
    assert.deepEqual(
      results.map((r) => r.id),
      ["here", "far"],
    );
    assert.ok(results[0].distanceKm! < results[1].distanceKm!);
  });

  test("honours maxKm", () => {
    const results = engine.nearest(
      [
        place({ id: "here", lat: KIGALI.lat, lng: KIGALI.lng }),
        place({ id: "far", lat: MUSANZE.lat, lng: MUSANZE.lng }),
      ],
      KIGALI,
      { maxKm: 10 },
    );
    assert.deepEqual(
      results.map((r) => r.id),
      ["here"],
    );
  });

  test("honours limit and categoryId", () => {
    const places = Array.from({ length: 20 }, (_, i) =>
      place({ id: `p${i}`, categoryId: i % 2 ? "stays" : "dining", lat: -1.9, lng: 30.0 }),
    );
    assert.equal(engine.nearest(places, KIGALI, { limit: 5 }).length, 5);
    assert.ok(
      engine
        .nearest(places, KIGALI, { categoryId: "stays", limit: 50 })
        .every((p) => p.categoryId === "stays"),
    );
  });
});

describe("topRated", () => {
  test("excludes places with no rating", () => {
    // A missing star means missing data, never a low score — so an unrated
    // place must not be ranked at all rather than ranked last.
    const results = engine.topRated([
      place({ id: "rated", rating: 4.5, image: "https://images.unsplash.com/a" }),
      place({ id: "unrated", image: "https://images.unsplash.com/b" }),
    ]);
    assert.deepEqual(
      results.map((r) => r.id),
      ["rated"],
    );
  });

  test("excludes places whose image will not load", () => {
    const results = engine.topRated([
      place({ id: "no-image", rating: 5 }),
      place({ id: "ok", rating: 4, image: "https://images.unsplash.com/a" }),
    ]);
    assert.deepEqual(
      results.map((r) => r.id),
      ["ok"],
    );
  });

  test("round-robins across categories so one cannot fill the row", () => {
    // 50 same-category places all rated 4.9 would otherwise take every slot.
    const flood = Array.from({ length: 20 }, (_, i) =>
      place({
        id: `stay${i}`,
        categoryId: "stays",
        rating: 4.9,
        image: "https://images.unsplash.com/s",
      }),
    );
    const others = [
      place({
        id: "dining1",
        categoryId: "dining",
        rating: 4.1,
        image: "https://images.unsplash.com/d",
      }),
      place({
        id: "nature1",
        categoryId: "nature",
        rating: 4.0,
        image: "https://images.unsplash.com/n",
      }),
    ];

    const results = engine.topRated([...flood, ...others], 6);
    const categories = new Set(results.map((r) => r.categoryId));
    assert.ok(
      categories.size >= 3,
      `expected several categories in the row, got ${[...categories].join(", ")}`,
    );
  });

  test("does not round-robin when a single category was requested", () => {
    const results = engine.topRated(
      [
        place({ id: "a", categoryId: "dining", rating: 3, image: "https://x/a" }),
        place({ id: "b", categoryId: "dining", rating: 5, image: "https://x/b" }),
        place({ id: "c", categoryId: "stays", rating: 4, image: "https://x/c" }),
      ],
      10,
      "dining",
    );
    assert.deepEqual(
      results.map((r) => r.id),
      ["b", "a"],
      "highest rated first, and stays excluded",
    );
  });

  test("respects the limit", () => {
    const places = Array.from({ length: 30 }, (_, i) =>
      place({
        id: `p${i}`,
        categoryId: `cat${i % 5}`,
        rating: 4,
        image: "https://images.unsplash.com/x",
      }),
    );
    assert.equal(engine.topRated(places, 7).length, 7);
  });

  test("returns an empty row rather than padding when nothing qualifies", () => {
    assert.deepEqual(engine.topRated([place({ id: "a" })]), []);
  });
});

describe("sensitive categories are never promoted", () => {
  // Memorial sites must not be rated out of five, ranked, or paraded on a home
  // page. These tests exist because that failure would be a serious harm and
  // an easy one to reintroduce by accident — a refactor that drops the
  // `sensitive` argument would restore the old behaviour silently.
  const sensitive = new Set(["memorials"]);

  const catalog = [
    place({
      id: "memorial",
      categoryId: "memorials",
      rating: 5,
      image: "https://images.unsplash.com/m",
    }),
    place({
      id: "restaurant",
      categoryId: "dining",
      rating: 4,
      image: "https://images.unsplash.com/r",
    }),
  ];

  test("topRated excludes a sensitive place even when it is rated highest", () => {
    const results = engine.topRated(catalog, 10, undefined, sensitive);
    assert.deepEqual(
      results.map((r) => r.id),
      ["restaurant"],
    );
  });

  test("topRated excludes it even when that category is asked for by name", () => {
    // Browsing the category is fine. Ranking inside it is not.
    const results = engine.topRated(catalog, 10, "memorials", sensitive);
    assert.deepEqual(results, []);
  });

  test("featured excludes sensitive categories", () => {
    const results = engine.featured(
      [
        place({ id: "memorial", categoryId: "memorials", image: "https://x/m" }),
        place({ id: "park", categoryId: "nature", image: "https://x/p" }),
      ],
      10,
      sensitive,
    );
    assert.deepEqual(
      results.map((r) => r.id),
      ["park"],
    );
  });

  test("featured no longer lists memorials even without the sensitive set", () => {
    // Belt and braces: the id was removed from the editorial list too, so a
    // caller that forgets to pass the set still cannot promote a memorial.
    const results = engine.featured([
      place({ id: "memorial", categoryId: "memorials", image: "https://x/m" }),
    ]);
    assert.deepEqual(results, []);
  });

  test("ordinary categories are unaffected", () => {
    const results = engine.topRated(catalog, 10, undefined, new Set<string>());
    assert.equal(results.length, 2, "no exclusions when nothing is sensitive");
  });

  test("browsing a sensitive category still works normally", () => {
    // Suppressing promotion must not make the places unreachable.
    const results = engine.placesInCategory(catalog, "memorials");
    assert.deepEqual(
      results.map((r) => r.id),
      ["memorial"],
    );
  });
});

describe("featured", () => {
  test("only includes the editorial categories", () => {
    const results = engine.featured([
      place({ id: "n", categoryId: "nature", image: "https://x/n" }),
      place({ id: "d", categoryId: "dining", image: "https://x/d" }),
      place({ id: "a", categoryId: "arts", image: "https://x/a" }),
    ]);
    assert.deepEqual(results.map((r) => r.id).sort(), ["a", "n"]);
  });

  test("skips places whose image will not load", () => {
    const results = engine.featured([
      place({ id: "broken", categoryId: "nature" }),
      place({ id: "fine", categoryId: "nature", image: "https://x/f" }),
    ]);
    assert.deepEqual(
      results.map((r) => r.id),
      ["fine"],
    );
  });
});

describe("buildSearchIndex", () => {
  test("drops descriptions, because it is shipped to the browser", () => {
    const index = engine.buildSearchIndex([
      place({ id: "a", description: "a very long description".repeat(50) }),
    ]);
    assert.equal(index[0].description, undefined);
  });

  test("keeps the fields search actually matches on", () => {
    const index = engine.buildSearchIndex([
      place({
        id: "a",
        name: "Repub Lounge",
        city: "Gasabo",
        subcategory: "Restaurants",
        keywords: ["rwandan", "dinner"],
      }),
    ]);
    assert.equal(index[0].name, "Repub Lounge");
    assert.equal(index[0].city, "Gasabo");
    assert.equal(index[0].subcategory, "Restaurants");
    assert.deepEqual(index[0].keywords, ["rwandan", "dinner"]);
  });

  test("preserves the catalog length", () => {
    const places = Array.from({ length: 12 }, (_, i) => place({ id: `p${i}` }));
    assert.equal(engine.buildSearchIndex(places).length, 12);
  });
});
