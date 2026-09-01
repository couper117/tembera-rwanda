import { isRenderableImage, withPromotedFirst } from "@/lib/places/engine";
import { INTERESTS, interestById } from "@/lib/profile/interests";
import type { Place } from "@/lib/places/types";

/**
 * What the home page shows, and in what order.
 *
 * The old home was the same six rows for everyone — near you, top rated,
 * browse by city, collections, featured, discover. All fine, none of them an
 * answer to "what am I here for". Somebody who came for food and markets got
 * the same page as somebody who came for gorillas.
 *
 * So the rows are built from what a person said they were interested in, and
 * the rule is: **their things first, then a few things they did not pick.**
 * The second half matters as much as the first. A feed that only ever returns
 * what you already asked for stops being a guide to a country and becomes a
 * mirror — and the whole point of a national directory is that it knows things
 * you do not.
 *
 * Pure: takes the catalogue as an argument and imports nothing from lib/data,
 * so the ordering can be tested without a database.
 */

export interface HomeRow {
  /** Stable, for React keys and for testing an order. */
  id: string;
  title: string;
  subtitle: string;
  /** Where "see all" goes. */
  href: string;
  places: Place[];
  /**
   * Why this row is here. "interest" earns the "because you like…" line;
   * "discover" is the deliberate widening, and says so.
   */
  reason: "interest" | "discover" | "everyone";
}

/**
 * A row title worth reading.
 *
 * "Dining" is a database column. "Where to eat tonight" is an invitation, and
 * the difference is most of what makes a directory feel like a guide.
 */
const INTEREST_ROWS: Record<string, { title: string; subtitle: string }> = {
  food: { title: "Where to eat", subtitle: "Restaurants, cafés and places worth the trip" },
  nature: { title: "Into the green", subtitle: "Lakes, forests and the parks between them" },
  culture: { title: "Culture & heritage", subtitle: "Museums, galleries and living tradition" },
  adventure: { title: "Get outside", subtitle: "Trails, water and high ground" },
  wildlife: { title: "Wildlife", subtitle: "Where the country keeps its animals" },
  history: { title: "The country's story", subtitle: "Landmarks and the places behind them" },
  photography: { title: "Worth the photo", subtitle: "Views, landmarks and the light" },
  nightlife: { title: "After dark", subtitle: "Bars and resto bars once the sun goes" },
  shopping: { title: "Markets & shops", subtitle: "Crafts, produce and everything else" },
};

/** Titles for the widening rows, keyed on category. */
const DISCOVER_ROWS: Record<string, { title: string; subtitle: string }> = {
  dining: { title: "Somewhere to eat", subtitle: "In case you are hungry" },
  stays: { title: "Somewhere to stay", subtitle: "Hotels, lodges and guest houses" },
  nature: { title: "Rwanda outdoors", subtitle: "Parks, lakes and waterfalls" },
  arts: { title: "Museums & galleries", subtitle: "Where the country keeps its story" },
  wonders: { title: "Landmarks", subtitle: "The views worth the climb" },
  shopping: { title: "Markets & crafts", subtitle: "Imigongo, baskets and the rest" },
  recreation: { title: "Something active", subtitle: "Pools, courts, gyms and trails" },
  sports: { title: "Sport & events", subtitle: "Stadiums, arenas and venues" },
  worship: { title: "Places of worship", subtitle: "Churches, mosques and temples" },
};

/** How many places a row shows, and the minimum it needs to be worth showing. */
const ROW_SIZE = 8;
const MIN_ROW = 4;

/** How many rows of things they did NOT pick. Enough to widen, not to drown. */
const DISCOVER_COUNT = 2;

/**
 * The most interest rows to show, however many interests were chosen.
 *
 * Nine interests would mean nine near-identical scrollers before the reader
 * reaches anything else, and a page that long stops being read at all.
 */
const MAX_INTEREST_ROWS = 3;

function eligible(places: Place[], sensitive: ReadonlySet<string>): Place[] {
  return places.filter((p) => !sensitive.has(p.categoryId) && isRenderableImage(p.image));
}

/**
 * At most this many places from one subcategory in a row.
 *
 * Without it a row is whatever the catalogue has most of, and the catalogue
 * has 181 ADEPR churches sharing a single stock photograph. "Culture &
 * heritage" came out as six identical pictures of the same church — which is
 * not a row, it is a bug that happens to render.
 */
const MAX_PER_SUBCATEGORY = 2;

/**
 * Best first, but varied.
 *
 * Two rules, and the second is what makes a row look like a row: no
 * photograph twice, and no more than a couple from any one subcategory. Six
 * cards that look identical read as a loading error even when every one is a
 * real place.
 */
function pick(places: Place[], categoryIds: string[], limit = ROW_SIZE): Place[] {
  // Top-plan listings lead their row, then rating decides the rest. The same
  // rule the category pages and search already follow, and disclosed the same
  // way — every card carries its "Sponsored" label. See lib/places/ranking.ts
  // for why promotion is allowed to reorder here but never to invent
  // relevance: a paid listing still has to be in the category being shown.
  const wanted = withPromotedFirst(
    places
      .filter((p) => categoryIds.includes(p.categoryId))
      .slice()
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)),
  );

  const out: Place[] = [];
  const perSub = new Map<string, number>();
  const seenImage = new Set<string>();

  for (const place of wanted) {
    if (out.length >= limit) break;
    const image = place.image ?? "";
    if (seenImage.has(image)) continue;
    const used = perSub.get(place.subcategory) ?? 0;
    if (used >= MAX_PER_SUBCATEGORY) continue;

    out.push(place);
    seenImage.add(image);
    perSub.set(place.subcategory, used + 1);
  }

  // The cap is there to stop one subcategory swamping a row, not to starve a
  // category that genuinely only has one. Museums & Arts has four photographed
  // listings and all four are museums; capping at two dropped the row
  // entirely, which is a worse answer than showing all four. So top up from
  // what the cap held back — the no-repeated-photo rule still applies, because
  // that is the one that was actually making rows look broken.
  if (out.length < MIN_ROW) {
    for (const place of wanted) {
      if (out.length >= limit) break;
      const image = place.image ?? "";
      if (seenImage.has(image)) continue;
      out.push(place);
      seenImage.add(image);
    }
  }
  return out;
}

/**
 * The personalised feed.
 *
 * With no interests — a guest, or somebody who skipped onboarding — this
 * returns the discovery rows alone, which is the same page everybody used to
 * get. Personalisation adds; it never takes the default away.
 */
export function homeRows(
  places: Place[],
  interests: string[],
  sensitive: ReadonlySet<string> = new Set(),
): HomeRow[] {
  const pool = eligible(places, sensitive);
  const rows: HomeRow[] = [];
  const usedCategories = new Set<string>();

  // 1. Their things, in the order they picked them.
  for (const id of interests) {
    const interest = interestById(id);
    const copy = INTEREST_ROWS[id];
    if (!interest || !copy) continue;

    const found = pick(pool, interest.categories);
    if (found.length < MIN_ROW) continue;

    if (rows.length >= MAX_INTEREST_ROWS) break;
    interest.categories.forEach((c) => usedCategories.add(c));
    rows.push({
      id: `interest-${id}`,
      title: copy.title,
      subtitle: copy.subtitle,
      href: `/c/${interest.categories[0]}`,
      places: found,
      reason: "interest",
    });
  }

  // 2. A few things they did not pick. Ordered by how much the catalogue has
  //    to offer there, so the widening leads with the strongest material
  //    rather than with whatever category happens to sort first.
  const discoverable = Object.keys(DISCOVER_ROWS)
    .filter((categoryId) => !usedCategories.has(categoryId) && !sensitive.has(categoryId))
    .map((categoryId) => ({ categoryId, places: pick(pool, [categoryId]) }))
    .filter((entry) => entry.places.length >= MIN_ROW)
    .sort((a, b) => b.places.length - a.places.length)
    .slice(0, DISCOVER_COUNT);

  for (const entry of discoverable) {
    const copy = DISCOVER_ROWS[entry.categoryId];
    rows.push({
      id: `discover-${entry.categoryId}`,
      title: copy.title,
      subtitle: copy.subtitle,
      href: `/c/${entry.categoryId}`,
      places: entry.places,
      // Only call it discovery when there was something to contrast it with.
      reason: interests.length > 0 ? "discover" : "everyone",
    });
  }

  return rows;
}

/**
 * Places outside Kigali.
 *
 * Most of the catalogue is in the capital, so every ranked row fills with
 * Kigali and the rest of the country never surfaces. This is the one row that
 * cannot be reached by browsing, which is why it is worth having.
 *
 * Deliberately NOT "top rated outside Kigali": only twelve listings in the
 * whole catalogue carry a rating and every one of them is in Kigali, so that
 * row would be permanently empty. Ranking by a signal the data does not have
 * is how a good idea becomes a blank space. A rating still sorts where one
 * exists; a photograph is the real requirement, because this row is
 * photographs.
 */
export function beyondKigali(
  places: Place[],
  sensitive: ReadonlySet<string> = new Set(),
  limit = ROW_SIZE,
): Place[] {
  const KIGALI = ["Gasabo", "Kicukiro", "Nyarugenge", "Kigali"];
  const out = eligible(places, sensitive).filter((p) => !KIGALI.includes(p.city));

  // Spread across districts rather than eight from whichever one sorts first —
  // the point of the row is the breadth of the country, not depth in Musanze.
  const byDistrict = new Map<string, Place[]>();
  for (const place of withPromotedFirst(out.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)))) {
    byDistrict.set(place.city, [...(byDistrict.get(place.city) ?? []), place]);
  }

  const picked: Place[] = [];
  let round = 0;
  while (picked.length < limit && round < 4) {
    for (const list of byDistrict.values()) {
      if (list[round]) picked.push(list[round]);
      if (picked.length >= limit) break;
    }
    round++;
  }
  return picked;
}

/** Every interest that has a row title, for the onboarding screen. */
export const INTEREST_CHOICES = INTERESTS.filter((i) => i.id in INTEREST_ROWS);
