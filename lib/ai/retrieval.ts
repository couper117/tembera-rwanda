/**
 * Turning what somebody typed into something worth searching for, and turning
 * what we found into something worth putting in front of a model.
 *
 * Pure on purpose: retrieval quality is the difference between the assistant
 * naming a real restaurant and inventing one, and it is much easier to argue
 * about a term list in a test than through a live chat.
 */

/**
 * Words that carry no signal against a catalogue of place names, cities and
 * subcategories. The old term filter kept anything over two characters, so
 * "where can i find good coffee" searched for "where", "can", "find" and
 * "good" as well as "coffee" — and since the clauses are OR'd, a place called
 * "Good Vibes Bar" outranked nothing in particular. Every term that matches
 * everything makes the result set worse, not better.
 */
const STOPWORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "your", "with", "that",
  "this", "have", "has", "had", "from", "they", "them", "there", "their",
  "what", "when", "where", "which", "who", "whom", "why", "how", "can",
  "could", "would", "should", "will", "shall", "may", "might", "must",
  "about", "into", "over", "under", "some", "any", "all", "each", "more",
  "most", "other", "such", "only", "own", "same", "than", "too", "very",
  "just", "also", "here", "now", "then", "get", "got", "give", "want",
  "need", "like", "know", "tell", "show", "find", "looking", "look",
  "please", "thanks", "thank", "hello", "hey", "good", "great", "best",
  "nice", "any", "one", "two", "three", "was", "were", "been", "being",
  "does", "did", "doing", "going", "make", "made", "take", "come",
  "rwanda", "rwandan", "tembera", "place", "places", "visit", "trip",
]);

/**
 * `rwanda` is a stopword above even though it is the whole subject: every row
 * in the catalogue is in Rwanda, so matching on it returns the catalogue.
 */
export function searchTerms(query: string, limit = 6): string[] {
  const seen = new Set<string>();
  const terms: string[] = [];

  for (const raw of query.toLowerCase().split(/[^a-z0-9']+/)) {
    const term = raw.replace(/^'+|'+$/g, "");
    if (term.length < 3) continue;
    if (STOPWORDS.has(term)) continue;
    if (seen.has(term)) continue;
    seen.add(term);
    terms.push(term);
    if (terms.length >= limit) break;
  }

  return terms;
}

/**
 * The words people use, mapped to the category ids the catalogue uses.
 *
 * "hotels in Musanze" found fire stations and ATMs, because Musanze's
 * accommodation is filed under the subcategory "Lodges" and the word "hotel"
 * appears nowhere in it — so the only term that matched anything was "musanze",
 * and every row in the district matched that equally.
 *
 * This is deliberately a hand-written list rather than a stemmer: it encodes
 * what this catalogue actually calls things, which no general-purpose stemmer
 * knows. Keys are matched whole, against terms that have already been
 * lowercased by searchTerms().
 */
const CATEGORY_SYNONYMS: Record<string, string> = {
  hotel: "stays", hotels: "stays", lodge: "stays", lodges: "stays",
  motel: "stays", hostel: "stays", hostels: "stays", resort: "stays",
  resorts: "stays", guesthouse: "stays", accommodation: "stays",
  staying: "stays", stays: "stays", sleep: "stays", room: "stays",
  rooms: "stays", night: "stays", nights: "stays",

  eat: "dining", eating: "dining", food: "dining", restaurant: "dining",
  restaurants: "dining", dining: "dining", dinner: "dining", lunch: "dining",
  breakfast: "dining", coffee: "dining", cafe: "dining", cafes: "dining",
  bar: "dining", bars: "dining", drink: "dining", drinks: "dining",
  brunch: "dining", cuisine: "dining", meal: "dining",

  park: "nature", parks: "nature", nature: "nature", hike: "nature",
  hiking: "nature", trail: "nature", trails: "nature", forest: "nature",
  lake: "nature", waterfall: "nature", safari: "nature", wildlife: "nature",
  gorilla: "nature", gorillas: "nature", chimpanzee: "nature",
  trekking: "nature", trek: "nature", birding: "nature",

  museum: "arts", museums: "arts", art: "arts", arts: "arts",
  gallery: "arts", galleries: "arts", culture: "arts", cultural: "arts",

  memorial: "memorials", memorials: "memorials", genocide: "memorials",
  kwibuka: "memorials", remembrance: "memorials",

  market: "shopping", markets: "shopping", shop: "shopping",
  shopping: "shopping", craft: "shopping", crafts: "shopping",
  souvenir: "shopping", souvenirs: "shopping", mall: "shopping",

  bank: "finance", banks: "finance", atm: "finance", atms: "finance",
  money: "finance", cash: "finance", exchange: "finance", forex: "finance",

  hospital: "health", hospitals: "health", clinic: "health",
  pharmacy: "health", pharmacies: "health", doctor: "health",
  medical: "health", health: "health",

  bus: "transport", buses: "transport", taxi: "transport", moto: "transport",
  transport: "transport", travel: "transport",

  airport: "airports", airports: "airports", flight: "airports",
  flights: "airports", flying: "airports",

  church: "worship", churches: "worship", mosque: "worship",
  mosques: "worship", worship: "worship", prayer: "worship",

  gym: "recreation", fitness: "recreation", swimming: "recreation",
  golf: "recreation", pool: "recreation",

  stadium: "sports", sports: "sports", football: "sports", match: "sports",

  school: "education", schools: "education", university: "education",
  college: "education", library: "education",

  viewpoint: "wonders", attraction: "wonders", attractions: "wonders",
  volcano: "wonders", volcanoes: "wonders", scenic: "wonders",
  landmark: "wonders", wonder: "wonders", wonders: "wonders",
};

/** The category a single query word points at, if any. */
export function categoryForTerm(term: string): string | null {
  return CATEGORY_SYNONYMS[term] ?? null;
}

/** Every category the query as a whole points at, for widening the SQL. */
export function categoryHints(terms: string[]): string[] {
  return [...new Set(terms.map(categoryForTerm).filter((c): c is string => c !== null))];
}

export interface RetrievedPlace {
  id: string;
  name: string;
  city: string;
  subcategory: string;
  categoryId: string;
  rating: number | null;
  description: string | null;
  sensitive: boolean;
}

/**
 * "Kigali" is what people type; it is not what the `city` column holds. The
 * catalogue stores the three districts, and cityGroup() folds them back for
 * display — so a query naming the capital has to be matched against all three
 * or it only hits rows with "Kigali" in their *name*, which is how a question
 * about coffee came back with Kigali International Airport.
 */
export const KIGALI_DISTRICTS = ["Gasabo", "Kicukiro", "Nyarugenge"];
const KIGALI_LOWER = KIGALI_DISTRICTS.map((d) => d.toLowerCase());

function cityMatches(city: string, term: string): boolean {
  if (term === "kigali") return KIGALI_LOWER.includes(city);
  return wordRegex(term).test(city) || city.includes(term);
}

/** A whole-word matcher for a term that may contain regex metacharacters. */
function wordRegex(term: string): RegExp {
  return new RegExp(String.raw`\b` + term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + String.raw`\b`);
}

/**
 * How well a row answers the query, so the six rows we hand the model are the
 * six most relevant rather than whichever six Postgres returned first.
 *
 * A name match is worth more than a city match: somebody typing "Repub Lounge"
 * wants that restaurant, while somebody typing "Huye" wants a spread of what
 * is in Huye. An exact whole-word hit beats a substring so that "art" ranks
 * the Inema Arts Center above every "Restaurant".
 *
 * Coverage outweighs all of it. The clauses are OR'd in SQL, so a row matching
 * one term of three comes back alongside a row matching all three; without a
 * coverage term, one strong name hit on the least important word wins. That is
 * exactly how "coffee in Kigali" surfaced an airport.
 */
export function scoreDetail(
  place: RetrievedPlace,
  terms: string[],
): { score: number; matched: number } {
  if (terms.length === 0) return { score: 0, matched: 0 };

  const name = place.name.toLowerCase();
  const city = place.city.toLowerCase();
  const sub = place.subcategory.toLowerCase();
  const category = place.categoryId.toLowerCase();
  const description = (place.description ?? "").toLowerCase();

  let score = 0;
  let matched = 0;

  // "gorilla trekking" is two words that both mean `nature`. Credited once per
  // term, every park in the country scored as though it answered both halves
  // of the question, which outranked Gorilla Guardians Village — the one row
  // whose name actually says gorilla. A category is evidence once.
  let categoryCredited = false;

  for (const term of terms) {
    const word = wordRegex(term);
    let termScore = 0;

    if (word.test(name)) termScore += 10;
    else if (name.includes(term)) termScore += 6;

    if (word.test(sub)) termScore += 5;
    else if (sub.includes(term)) termScore += 3;

    if (word.test(category)) termScore += 4;
    if (cityMatches(city, term)) termScore += 4;

    // "hotel" is not a word in this catalogue; "stays" is. Worth nearly as
    // much as a subcategory hit, because it is usually the term carrying the
    // actual intent — the other term is just the town.
    if (!categoryCredited && categoryForTerm(term) === category) {
      termScore += 6;
      categoryCredited = true;
    }

    if (termScore > 0) matched += 1;

    // Counted for ranking but never for coverage. Nyungwe's description says
    // "chimpanzee trekking", which was enough to make it look like a two-term
    // answer to "gorilla trekking" and push out the row actually named after
    // gorillas. Prose is a tiebreaker, not evidence that a listing is the
    // thing being asked for.
    if (termScore === 0 && word.test(description)) termScore = 2;

    score += termScore;
  }

  if (matched === 0) return { score: 0, matched: 0 };

  // Answering two of the asked-about things beats answering one of them well.
  score += matched * 25;

  // A tie between two equally-matched rows goes to the better-rated one, but
  // rating never outweighs a term match — otherwise every query drifts back to
  // the same handful of five-star listings.
  if (place.rating) score += Math.min(place.rating, 5) / 10;

  return { score, matched };
}

export function scorePlace(place: RetrievedPlace, terms: string[]): number {
  return scoreDetail(place, terms).score;
}

/**
 * Rank, then cut.
 *
 * Rows that match fewer of the query's terms than the best row are dropped
 * rather than used as padding. Asking for "coffee in Kigali" finds two cafés
 * with "coffee" in the name; filling the remaining slots with rows that only
 * matched "Kigali" put the international airport under a heading that said
 * "recommended", and gave the model three irrelevant places to talk about.
 * A short honest list beats a padded one.
 */
export function rankPlaces(
  places: RetrievedPlace[],
  terms: string[],
  limit = 6,
): RetrievedPlace[] {
  if (terms.length === 0) return places.slice(0, limit);

  const scored = places
    .map((place) => ({ place, ...scoreDetail(place, terms) }))
    .filter((row) => row.matched > 0);

  if (scored.length === 0) return [];

  const best = Math.max(...scored.map((row) => row.matched));

  return scored
    .filter((row) => row.matched === best)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.place);
}

/**
 * The catalogue block appended to the system prompt.
 *
 * Sensitive rows are labelled rather than hidden. They are excluded from the
 * "recommend something" paths, but a direct question about the Kigali Genocide
 * Memorial deserves a real answer — so the model is told the row exists and
 * told, in the same line, how to talk about it.
 */
export function placesContext(places: RetrievedPlace[]): string {
  if (places.length === 0) {
    return (
      "\n\nNo listing in the Tembera catalogue matched this question. Do not " +
      "invent listings, addresses, prices or phone numbers. Answer from general " +
      "knowledge of Rwanda and point to /explore or /map to browse."
    );
  }

  const rows = places
    .map((p) => {
      const rating = p.rating ? `${p.rating.toFixed(1)}/5` : "unrated";
      const note = p.sensitive
        ? " [MEMORIAL — describe with dignity; never rate, rank or market it]"
        : "";
      const description = p.description
        ? ` — ${p.description.replace(/\s+/g, " ").slice(0, 200)}`
        : "";
      return `- ${p.name} (id: ${p.id}) · ${p.subcategory} in ${p.city} · ${rating}${note}${description}`;
    })
    .join("\n");

  return (
    `\n\nListings currently in the Tembera catalogue that match this question:\n${rows}\n\n` +
    `Link any of these as [Name](/place/id) using the id shown. These are the ` +
    `only listings you may present as being on Tembera — never invent an id, ` +
    `and never state a price, phone number or opening time that is not given above.`
  );
}

/* ------------------------------------------------------------ follow-ups */

/**
 * The chips under the reply. They used to be three hardcoded strings shown
 * after every answer, including "How to claim a business listing" in the
 * middle of a conversation about gorilla permits.
 *
 * Suggestions are drawn from what the user actually asked and what we actually
 * found, and a chip is only offered when the page behind it exists.
 */
export function followUpSuggestions(
  query: string,
  places: RetrievedPlace[],
): string[] {
  const q = query.toLowerCase();
  const out: string[] = [];

  const city = places.find((p) => !p.sensitive)?.city;
  const named = places.find((p) => !p.sensitive)?.name;

  if (named) out.push(`Tell me more about ${named}`);
  if (city) out.push(`What else is worth seeing in ${city}?`);

  if (/gorilla|volcano|trek|permit|nyungwe|akagera|safari|park/.test(q)) {
    out.push("What should I pack for a trek?");
  }
  if (/eat|food|dining|restaurant|coffee|cafe|bar|lunch|dinner/.test(q)) {
    out.push("Somewhere quieter for dinner?");
  }
  if (/hotel|stay|lodge|sleep|accommodation|room/.test(q)) {
    out.push("Anything cheaper nearby?");
  }
  if (/memorial|genocide|kwibuka|remember/.test(q)) {
    out.push("How should I prepare for a memorial visit?");
  }
  if (/business|claim|listing|partner|plan|pricing/.test(q)) {
    out.push("What do the paid plans include?");
  }
  if (/umuganda|holiday|closed|calendar|open/.test(q)) {
    out.push("What is closed during Umuganda?");
  }

  // Enough of a fallback that the row is never empty or one lonely chip.
  out.push("Plan a 3-day trip", "Show me the map", "What is Umuganda?");

  return [...new Set(out)].slice(0, 3);
}
