import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  categoryHints,
  categoryForTerm,
  followUpSuggestions,
  placesContext,
  rankPlaces,
  searchTerms,
  scorePlace,
  scoreDetail,
  type RetrievedPlace,
} from "../lib/ai/retrieval";
import {
  endpointFor,
  maskKey,
  redactSecrets,
  describeUpstreamError,
} from "../lib/ai/providers";

const place = (over: Partial<RetrievedPlace>): RetrievedPlace => ({
  id: "x",
  name: "X",
  city: "Kigali",
  subcategory: "Restaurant",
  categoryId: "dining",
  rating: null,
  description: null,
  sensitive: false,
  ...over,
});

describe("searchTerms", () => {
  test("drops the filler that used to match everything", () => {
    // "where can i find good coffee" once searched for where/can/find/good too.
    assert.deepEqual(searchTerms("where can I find good coffee"), ["coffee"]);
  });

  test("drops 'rwanda', which every row would match", () => {
    assert.deepEqual(searchTerms("best hotels in Rwanda"), ["hotels"]);
  });

  test("keeps proper nouns and de-duplicates", () => {
    assert.deepEqual(searchTerms("Musanze hotels near Musanze"), ["musanze", "hotels", "near"]);
  });

  test("ignores punctuation and words under three characters", () => {
    assert.deepEqual(searchTerms("Is it ok? Nyungwe!"), ["nyungwe"]);
  });

  test("returns nothing for a greeting", () => {
    assert.deepEqual(searchTerms("hello there!"), []);
  });

  test("caps the term list", () => {
    assert.equal(searchTerms("alpha bravo charlie delta echo foxtrot golf hotel").length, 6);
  });
});

describe("scorePlace", () => {
  test("a name match outranks a city match", () => {
    const byName = scorePlace(place({ name: "Coffee House", city: "Huye" }), ["coffee"]);
    const byCity = scorePlace(place({ name: "Somewhere", city: "Coffee" }), ["coffee"]);
    assert.ok(byName > byCity);
  });

  test("a whole word outranks a substring", () => {
    const whole = scorePlace(place({ name: "Art Gallery" }), ["art"]);
    const partial = scorePlace(place({ name: "Smart Bistro" }), ["art"]);
    assert.ok(whole > partial);
  });

  test("rating breaks a tie but never overturns a term match", () => {
    const matched = scorePlace(place({ name: "Coffee Hut", rating: null }), ["coffee"]);
    const unmatchedButLoved = scorePlace(place({ name: "Other", rating: 5 }), ["coffee"]);
    assert.ok(matched > unmatchedButLoved);
  });

  test("matching more of the query beats matching one word well", () => {
    // "coffee in Kigali" returned Kigali International Airport above the cafes,
    // because "kigali" hit its name hard and nothing weighed coverage.
    const both = scorePlace(
      place({ name: "Bourbon Coffee Kigali Heights", city: "Gasabo" }),
      ["coffee", "kigali"],
    );
    const oneOnly = scorePlace(
      place({ name: "Kigali International Airport", city: "Kicukiro" }),
      ["coffee", "kigali"],
    );
    assert.ok(both > oneOnly);
  });

  test("'kigali' matches the districts the column actually stores", () => {
    // cityGroup() folds Gasabo/Kicukiro/Nyarugenge into "Kigali" for display,
    // so the query term has to be folded the same way going the other way.
    assert.ok(scorePlace(place({ name: "Cafe", city: "Gasabo" }), ["kigali"]) > 0);
    assert.equal(scorePlace(place({ name: "Cafe", city: "Musanze" }), ["kigali"]), 0);
  });

  test("a regex metacharacter in a term does not throw", () => {
    assert.doesNotThrow(() => scorePlace(place({}), ["c++", "a.b", "("]));
  });
});

describe("category synonyms", () => {
  test("maps the words people use onto the ids the catalogue uses", () => {
    // Musanze has Lodges, not Hotels. Without this, "hotels in Musanze"
    // matched only "musanze" and returned the fire station.
    assert.equal(categoryForTerm("hotels"), "stays");
    assert.equal(categoryForTerm("eat"), "dining");
    assert.equal(categoryForTerm("gorilla"), "nature");
    assert.equal(categoryForTerm("kwibuka"), "memorials");
  });

  test("an unknown word maps to nothing", () => {
    assert.equal(categoryForTerm("bisate"), null);
  });

  test("hints are de-duplicated", () => {
    assert.deepEqual(categoryHints(["hotel", "lodge", "eat"]), ["stays", "dining"]);
  });

  test("a lodge answers a question about hotels", () => {
    const lodge = place({ name: "Bisate Lodge", subcategory: "Lodges", categoryId: "stays", city: "Musanze" });
    const firestation = place({ name: "Musanze Fire Station", subcategory: "Fire Stations", categoryId: "safety", city: "Musanze" });
    assert.ok(scorePlace(lodge, ["hotels", "musanze"]) > scorePlace(firestation, ["hotels", "musanze"]));
  });

  test("two words meaning the same category count as one piece of evidence", () => {
    // "gorilla trekking" is two nature words. Crediting each one separately
    // made every park look like a two-term answer and buried the row whose
    // name actually says gorilla.
    const named = place({ name: "Gorilla Guardians Village", categoryId: "wonders", subcategory: "Tourist Attractions" });
    const anyPark = place({ name: "Akagera National Park", categoryId: "nature", subcategory: "Parks" });
    assert.ok(scorePlace(named, ["gorilla", "trekking"]) > scorePlace(anyPark, ["gorilla", "trekking"]));
  });

  test("a description match ranks but does not count as answering a term", () => {
    // Nyungwe's blurb says "chimpanzee trekking", which is not a reason to
    // treat it as the answer to a question about gorillas.
    const byProse = place({ name: "Nyungwe", categoryId: "nature", description: "famous for chimpanzee trekking" });
    const detail = scoreDetail(byProse, ["gorilla", "trekking"]);
    assert.equal(detail.matched, 1, "only the category hit counts");
    assert.ok(detail.score > 0);
  });
});

describe("rankPlaces", () => {
  test("drops rows that match nothing rather than padding the list", () => {
    const rows = [
      place({ id: "a", name: "Coffee Hut" }),
      // Not dining: "coffee" maps to the dining category, so a dining row
      // would legitimately match even without the word in its name.
      place({ id: "b", name: "Tyre Shop", categoryId: "transport", subcategory: "Garages" }),
    ];
    assert.deepEqual(rankPlaces(rows, ["coffee"]).map((p) => p.id), ["a"]);
  });

  test("with no terms it keeps the order it was given", () => {
    const rows = [place({ id: "a" }), place({ id: "b" })];
    assert.deepEqual(rankPlaces(rows, []).map((p) => p.id), ["a", "b"]);
  });

  test("orders by score, best first", () => {
    const rows = [
      place({ id: "weak", name: "Nice Spot", city: "Musanze" }),
      place({ id: "strong", name: "Musanze Lodge" }),
    ];
    assert.equal(rankPlaces(rows, ["musanze"])[0].id, "strong");
  });
});

describe("placesContext", () => {
  test("tells the model not to invent listings when nothing matched", () => {
    assert.match(placesContext([]), /Do not invent listings/);
  });

  test("flags a memorial so the model is told how to treat it", () => {
    const context = placesContext([place({ name: "Kigali Genocide Memorial", sensitive: true })]);
    assert.match(context, /MEMORIAL/);
    assert.match(context, /never rate, rank or market/);
  });

  test("gives the id the link format depends on", () => {
    const context = placesContext([place({ id: "dining-repub", name: "Repub" })]);
    assert.match(context, /id: dining-repub/);
    assert.match(context, /\[Name\]\(\/place\/id\)/);
  });
});

describe("followUpSuggestions", () => {
  test("names a place that was actually found", () => {
    const out = followUpSuggestions("coffee", [place({ name: "Question Coffee" })]);
    assert.ok(out.some((s) => s.includes("Question Coffee")));
  });

  test("never offers a memorial as the follow-up subject", () => {
    const out = followUpSuggestions("memorial", [
      place({ name: "Kigali Genocide Memorial", sensitive: true }),
    ]);
    assert.ok(!out.some((s) => s.includes("Kigali Genocide Memorial")));
  });

  test("always returns three distinct chips", () => {
    for (const q of ["", "gorillas", "hotel in Huye", "claim my business"]) {
      const out = followUpSuggestions(q, []);
      assert.equal(out.length, 3, q);
      assert.equal(new Set(out).size, 3, q);
    }
  });
});

describe("endpointFor", () => {
  test("gemini has no OpenAI-shaped endpoint", () => {
    assert.equal(endpointFor("gemini"), null);
  });

  test("groq and openrouter go to their own hosts, not OpenAI", () => {
    // The admin test button used to send every non-Gemini provider to OpenAI,
    // so a valid Groq key reported itself as invalid.
    assert.match(endpointFor("groq")!, /groq\.com/);
    assert.match(endpointFor("openrouter")!, /openrouter\.ai/);
  });

  test("a stale custom endpoint does not leak into a named provider", () => {
    assert.match(endpointFor("openai", "https://stale.example/v1")!, /api\.openai\.com/);
  });

  test("custom uses its own URL, and falls back when blank", () => {
    assert.equal(endpointFor("custom", "https://mine.example/v1/chat"), "https://mine.example/v1/chat");
    assert.match(endpointFor("custom", "  ")!, /api\.openai\.com/);
  });
});

describe("redactSecrets", () => {
  test("strips keys a provider echoed back", () => {
    assert.match(redactSecrets("bad key AIzaSyC1234567890abcdef"), /redacted/);
    assert.match(redactSecrets("sk-proj-1234567890abcdefgh rejected"), /redacted/);
    assert.match(redactSecrets("gsk_1234567890abcdefgh rejected"), /redacted/);
  });

  test("strips a key carried in a URL or a header", () => {
    assert.ok(!redactSecrets("...?key=AIzaSyABCDEF1234").includes("AIzaSyABCDEF1234"));
    assert.ok(!redactSecrets("Bearer sk-abcdefghijklmnop").includes("sk-abcdefghijklmnop"));
  });

  test("leaves an ordinary message alone", () => {
    assert.equal(redactSecrets("model not found"), "model not found");
  });
});

describe("describeUpstreamError", () => {
  test("collapses whitespace and caps the length", () => {
    const out = describeUpstreamError(500, "x".repeat(1000));
    assert.ok(out.length < 340);
    assert.match(out, /^HTTP 500: /);
  });

  test("reports the status alone when the body is empty", () => {
    assert.equal(describeUpstreamError(429, "   "), "HTTP 429");
  });
});

describe("maskKey", () => {
  test("shows only the ends of a real key", () => {
    const key = "AIzaSyC0123456789abcdefghij";
    const masked = maskKey(key);
    assert.equal(masked, "AIza…ghij");
    assert.ok(!masked.includes("0123456789"));
    assert.ok(masked.length < key.length);
  });

  test("collapses a short value instead of revealing most of it", () => {
    assert.equal(maskKey("abcdef"), "••••••••");
  });

  test("an unset key masks to nothing at all", () => {
    assert.equal(maskKey(""), "");
    assert.equal(maskKey("   "), "");
  });
});
