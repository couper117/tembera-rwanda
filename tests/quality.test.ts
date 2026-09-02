import { strict as assert } from "node:assert";
import { test } from "node:test";
import { assessQuality, type QualityRow } from "../lib/places/quality";

/** A place with nothing missing. Each test spoils exactly one field. */
function complete(over: Partial<QualityRow> & { id: string }): QualityRow {
  return {
    name: `Place ${over.id}`,
    city: "Gasabo",
    categoryId: "dining",
    description: "A real description.",
    image: `https://example.com/${over.id}.jpg`,
    imageData: null,
    website: "https://example.com",
    phone: "+250 788 000 000",
    lat: -1.94,
    lng: 30.06,
    coordsPrecision: "exact",
    rating: 4.5,
    hours: "09:00–17:00",
    hoursJson: null,
    ...over,
  };
}

function countOf(rows: QualityRow[], key: string): number {
  const gap = assessQuality(rows).gaps.find((g) => g.key === key);
  assert.ok(gap, `no gap named ${key}`);
  return gap.count;
}

test("a complete place trips nothing", () => {
  const result = assessQuality([complete({ id: "a" })]);
  assert.equal(result.total, 1);
  assert.equal(result.complete, 1);
  assert.equal(
    result.gaps.every((g) => g.count === 0),
    true,
    result.gaps.filter((g) => g.count > 0).map((g) => g.key).join(", "),
  );
});

test("a blank string counts as missing, not as content", () => {
  // The seed writes "" rather than NULL in places, and a description of ""
  // renders exactly as emptily as no description at all.
  assert.equal(countOf([complete({ id: "a", description: "" })], "description"), 1);
  assert.equal(countOf([complete({ id: "a", description: "   " })], "description"), 1);
  assert.equal(countOf([complete({ id: "a", website: "" })], "website"), 1);
  assert.equal(countOf([complete({ id: "a", phone: "  " })], "phone"), 1);
});

test("an inline data URI still counts as having a photo", () => {
  // ~30 seeded rows carry their image in imageData rather than image, and
  // those places do render a picture — flagging them would be false work.
  const rows = [complete({ id: "a", image: null, imageData: "data:image/jpeg;base64,/9j/" })];
  assert.equal(countOf(rows, "photo"), 0);
});

test("no photo in either column is a gap", () => {
  assert.equal(countOf([complete({ id: "a", image: null, imageData: null })], "photo"), 1);
  assert.equal(countOf([complete({ id: "a", image: "", imageData: "" })], "photo"), 1);
});

test("a missing pin and an approximate pin are different problems", () => {
  const missing = [complete({ id: "a", lat: null, lng: null })];
  assert.equal(countOf(missing, "coords"), 1);
  // Not also counted as approximate: there is no pin to be approximate about,
  // and double-counting one place would overstate the work.
  assert.equal(countOf(missing, "approximate"), 0);

  const rough = [complete({ id: "b", coordsPrecision: "district" })];
  assert.equal(countOf(rough, "coords"), 0);
  assert.equal(countOf(rough, "approximate"), 1);

  const unknown = [complete({ id: "c", coordsPrecision: "unknown" })];
  assert.equal(countOf(unknown, "approximate"), 1);
});

test("either kind of opening hours satisfies the check", () => {
  assert.equal(countOf([complete({ id: "a", hours: "Daily 8–6", hoursJson: null })], "hours"), 0);
  assert.equal(
    countOf([complete({ id: "b", hours: null, hoursJson: { mon: "9-5" } })], "hours"),
    0,
  );
  assert.equal(countOf([complete({ id: "c", hours: null, hoursJson: null })], "hours"), 1);
  assert.equal(countOf([complete({ id: "d", hours: "", hoursJson: null })], "hours"), 1);
});

test("a rating of zero is a rating", () => {
  // Nullish, not falsy: 0 is a real (bad) score and must not read as absent.
  assert.equal(countOf([complete({ id: "a", rating: 0 })], "rating"), 0);
  assert.equal(countOf([complete({ id: "b", rating: null })], "rating"), 1);
});

test("places sharing a photo are grouped, worst group first", () => {
  const rows = [
    complete({ id: "a", image: "https://example.com/shared.jpg" }),
    complete({ id: "b", image: "https://example.com/shared.jpg" }),
    complete({ id: "c", image: "https://example.com/shared.jpg" }),
    complete({ id: "d", image: "https://example.com/pair.jpg" }),
    complete({ id: "e", image: "https://example.com/pair.jpg" }),
    complete({ id: "f", image: "https://example.com/unique.jpg" }),
  ];
  const result = assessQuality(rows);

  assert.equal(result.duplicatePhotos.length, 2);
  assert.equal(result.duplicatePhotos[0].places.length, 3);
  assert.equal(result.duplicatePhotos[1].places.length, 2);
  assert.equal(result.duplicatePhotoPlaces, 5);
  // Only the place with its own photo is clean.
  assert.equal(result.complete, 1);
});

test("places with no photo are not grouped together as duplicates", () => {
  // Empty is not a shared image. Grouping every photoless place into one
  // enormous "duplicate" would bury the real ones.
  const rows = [
    complete({ id: "a", image: null, imageData: null }),
    complete({ id: "b", image: "", imageData: null }),
  ];
  assert.equal(assessQuality(rows).duplicatePhotos.length, 0);
});

test("one place with several gaps is still one incomplete place", () => {
  const rows = [complete({ id: "a", description: null, website: null, phone: null })];
  const result = assessQuality(rows);
  assert.equal(result.complete, 0);
  assert.equal(result.total, 1);
  assert.equal(countOf(rows, "description"), 1);
  assert.equal(countOf(rows, "website"), 1);
});

test("an empty catalogue is not a pile of problems", () => {
  const result = assessQuality([]);
  assert.equal(result.total, 0);
  assert.equal(result.complete, 0);
  assert.equal(result.duplicatePhotoPlaces, 0);
  assert.equal(
    result.gaps.every((g) => g.count === 0),
    true,
  );
});
