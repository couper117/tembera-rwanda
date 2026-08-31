import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  DISTRICT_CENTRES,
  distanceKm,
  formatDistance,
  formatDistanceFor,
  resolveDistrict,
} from "../lib/places/geo";
import { KIGALI, MUSANZE, HUYE } from "./helpers";

describe("distanceKm", () => {
  test("is zero for the same point", () => {
    assert.equal(distanceKm(KIGALI, KIGALI), 0);
  });

  test("matches the real Kigali–Musanze distance", () => {
    // ~68 km as the crow flies (the road is ~106 km — this is not that). A
    // wrong Haversine, degrees left unconverted to radians say, would be out by
    // orders of magnitude, which is what this guards against.
    const km = distanceKm(KIGALI, MUSANZE);
    assert.ok(km > 63 && km < 73, `expected ~68 km, got ${km.toFixed(1)}`);
  });

  test("matches the real Kigali–Huye distance", () => {
    const km = distanceKm(KIGALI, HUYE);
    assert.ok(km > 76 && km < 86, `expected ~81 km, got ${km.toFixed(1)}`);
  });

  test("is symmetric", () => {
    assert.equal(
      distanceKm(KIGALI, HUYE).toFixed(6),
      distanceKm(HUYE, KIGALI).toFixed(6),
    );
  });
});

describe("formatDistance", () => {
  test("uses metres below a kilometre", () => {
    assert.equal(formatDistance(0.45), "450 m");
  });

  test("uses one decimal below ten kilometres", () => {
    assert.equal(formatDistance(2.44), "2.4 km");
  });

  test("rounds to whole kilometres above ten", () => {
    assert.equal(formatDistance(17.6), "18 km");
  });

  test("returns nothing for a missing or non-finite distance", () => {
    assert.equal(formatDistance(undefined), undefined);
    assert.equal(formatDistance(Number.NaN), undefined);
    assert.equal(formatDistance(Number.POSITIVE_INFINITY), undefined);
  });
});

describe("formatDistanceFor", () => {
  test("shows an exact distance plainly", () => {
    assert.equal(formatDistanceFor(0.45, "exact"), "450 m");
  });

  test("marks a district-level distance with a tilde", () => {
    assert.equal(formatDistanceFor(12, "district"), "~12 km");
  });

  test("says nothing sub-kilometre for a district-level record", () => {
    // Two places pinned to the same district centre would both read "0 m away",
    // which claims a precision the data does not have.
    assert.equal(formatDistanceFor(0.4, "district"), undefined);
    assert.equal(formatDistanceFor(0, "district"), undefined);
  });

  test("applies the same suppression to unknown precision", () => {
    assert.equal(formatDistanceFor(0.4, "unknown"), undefined);
    assert.equal(formatDistanceFor(30, "unknown"), "~30 km");
  });

  test("says nothing for district distances inside one city", () => {
    // Every Kigali district centre sits within a few km of the others, so a
    // list of places pinned to those centroids used to read "~3.3 km away"
    // over and over — one centroid printed many times, not many distances.
    // The card already names the area, so we let that line do the work.
    assert.equal(formatDistanceFor(3.3, "district"), undefined);
    assert.equal(formatDistanceFor(8, "district"), undefined);
    assert.equal(formatDistanceFor(9.9, "district"), undefined);
  });

  test("still shows a district distance once it means a different trip", () => {
    // Musanze and Huye are ~90 km and ~130 km from Kigali. At that range the
    // centroid error is irrelevant and the number is the whole point.
    assert.equal(formatDistanceFor(10, "district"), "~10 km");
    assert.equal(formatDistanceFor(90, "district"), "~90 km");
  });

  test("an exact record is never suppressed, however close", () => {
    // The 17 places we have real coordinates for should say so.
    assert.equal(formatDistanceFor(0.62, "exact"), "620 m");
    assert.equal(formatDistanceFor(3.3, "exact"), "3.3 km");
  });
});

describe("resolveDistrict", () => {
  test("finds an exact district name", () => {
    assert.equal(resolveDistrict("Musanze"), "Musanze");
  });

  test("is case-insensitive and tolerates surrounding text", () => {
    assert.equal(resolveDistrict("Western Province, RUSIZI"), "Rusizi");
  });

  test("maps a known neighbourhood to its district", () => {
    assert.equal(resolveDistrict("Kimironko Sector"), "Gasabo");
  });

  test("falls back to the central district for a bare Kigali", () => {
    assert.equal(resolveDistrict("Kigali"), "Nyarugenge");
  });

  test("returns nothing rather than guessing for unknown text", () => {
    assert.equal(resolveDistrict("Atlantis"), undefined);
    assert.equal(resolveDistrict(undefined), undefined);
    assert.equal(resolveDistrict(""), undefined);
  });
});

describe("DISTRICT_CENTRES", () => {
  test("covers all 30 districts", () => {
    assert.equal(Object.keys(DISTRICT_CENTRES).length, 30);
  });

  test("every centre sits inside Rwanda's bounding box", () => {
    // Rwanda spans roughly -2.85..-1.05 latitude and 28.85..30.90 longitude.
    // A transposed lat/lng pair — an easy mistake in a coordinate table — lands
    // far outside this and would be caught here.
    for (const [district, coords] of Object.entries(DISTRICT_CENTRES)) {
      assert.ok(
        coords.lat >= -2.9 && coords.lat <= -1.0,
        `${district} latitude ${coords.lat} is outside Rwanda`,
      );
      assert.ok(
        coords.lng >= 28.8 && coords.lng <= 31.0,
        `${district} longitude ${coords.lng} is outside Rwanda`,
      );
    }
  });
});
