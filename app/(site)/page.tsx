import Link from "next/link";
import AppHeader from "@/components/app/AppHeader";
import CalendarNotice from "@/components/app/CalendarNotice";
import Icon from "@/components/Icon";
import HomeFeed from "@/components/home/HomeFeed";
import PlaceImage from "@/components/ui/PlaceImage";
import PlaceCard from "@/components/ui/PlaceCard";
import SectionHeader from "@/components/ui/SectionHeader";
import { getCurrentUser } from "@/lib/auth";
import { getProfileOverview } from "@/lib/data/user";
import { cleanInterests } from "@/lib/profile/interests";
import { getCategories } from "@/lib/data/categories";
import {
  cityGroup,
  citySummaries,
  countByCategory,
  featured,
  personalRows,
  sponsored,
  nearest,
  topRated,
} from "@/lib/data/places";
import { KIGALI } from "@/lib/places/geo";
import { getCollections } from "@/lib/collections";
import type { Place } from "@/lib/places/types";

// The curated-collections row reads from Postgres.
export const dynamic = "force-dynamic";

/**
 * Cards per row. One full row on a desktop grid, so "Near you" and "Top rated"
 * both land above the fold on a laptop instead of one of them being a rumour.
 */
const ROW = 5;

/**
 * Home is a discovery dashboard, not a landing page. Above the fold you get the
 * headline, the search box, the category chips and two rows of photographs —
 * and nothing that only describes what is already visible.
 */
export default async function HomePage() {
  const counts = await countByCategory();
  const categories = await getCategories();
  const collections = await getCollections();

  // Each chip's row is ranked here rather than by filtering one long list in
  // the browser: "nearest five restaurants" and "the restaurants that happen
  // to be in the nearest fifty places" are different answers, and only the
  // first one is the one being asked for. Only the primary categories get a
  // chip, so this is six extra rankings over an already-cached catalog.
  const filterable = categories.filter((group) => group.primary).map((g) => g.id);

  // requireImage on the unfiltered row only. Unfiltered is the view almost
  // everyone sees, and there are enough photographed places near Kigali to
  // fill it, so it stays all-photography. Requiring one per category would
  // empty the row instead: Finance, Healthcare and Shopping have no photos at
  // all between them, and a blank row is a worse answer than a placeholder.
  // Those rows lean on the category gradients in PlaceImage.
  const nearby = await rowsByCategory(filterable, (categoryId) =>
    nearest(KIGALI, { limit: ROW, categoryId, requireImage: !categoryId }),
  );

  // topRated needs no such flag — the engine already drops anything without a
  // renderable image from the rating queue.
  const rated = await rowsByCategory(filterable, (categoryId) =>
    topRated(ROW, categoryId),
  );

  const cities = (await citySummaries()).slice(0, 8);
  const destinations = await featured(8);

  // Paid placement. Its own row with its own label — never mixed into
  // "Top rated", which is a claim about ratings. See lib/places/ranking.ts.
  const promoted = await sponsored(6);

  // What this reader is here for. A guest has none, and gets the same page
  // everyone used to get — personalisation adds rows, it never removes them.
  const user = await getCurrentUser();
  const interests = user ? cleanInterests((await getProfileOverview(user.id)).interests) : [];
  const rows = await personalRows(interests);

  return (
    <>
      <AppHeader />

      <main className="t-main">
        <div className="t-page">
          {/* Renders nothing unless the country is about to close — Umuganda,
              a public holiday, or the commemoration week. */}
          <CalendarNotice />

          {/* ------------------------------------------------ search ---- */}
          <section className="t-section">
            <h1 className="t-display">Where to?</h1>

            {/* The scale of the guide used to sit in a subtitle under the
                headline, restating what the search box is for. It says more
                inside the placeholder, where it doubles as a prompt. */}
            <Link
              href="/search"
              className="t-searchlink"
              style={{ marginTop: "var(--t-4)" }}
            >
              <Icon name="search" size={20} />
              <span>Search {placeCountLabel(counts)} across Rwanda</span>
              <span className="t-searchlink__hint">/</span>
            </Link>
          </section>

          {/* --------------------------- chips, near you, top rated ---- */}
          {/* The "Explore" section used to sit here: a heading, a subtitle, a
              link and six tiles that between them said "places" six times.
              The chips inside HomeFeed carry the same information in a row,
              and they filter the two rows under them instead of navigating
              away. */}
          <HomeFeed nearby={nearby} rated={rated} limit={ROW} />

          {/* ------------------------------------------- your rows ---- */}
          {/* Their interests first, then a few things they did not pick. A
              feed that only returns what you already asked for stops being a
              guide to a country and becomes a mirror. */}
          {rows.map((row) => (
            <section key={row.id} className="t-section">
              {/* The "why" goes in the subtitle rather than on a line of its
                  own. As a separate element it appeared on some rows and not
                  others, so every row had a different height above its cards
                  and the page lost its rhythm. */}
              <SectionHeader
                title={row.title}
                subtitle={
                  row.reason === "interest"
                    ? `${row.subtitle} · picked for you`
                    : row.reason === "discover"
                      ? `${row.subtitle} · something different`
                      : row.subtitle
                }
                actionLabel="See all"
                actionHref={row.href}
              />
              {/* The same grid Near you and Top rated use, so every card on the
                  page is one size. A scroller here made these rows visibly
                  different from the two above them for no reason. */}
              <div className="t-tilegrid">
                {row.places.map((place) => (
                  <PlaceCard key={place.id} place={place} variant="tile" />
                ))}
              </div>
            </section>
          ))}

          {/* -------------------------------------------------- cities -- */}
          <section className="t-section">
            <SectionHeader
              title="Browse by city"
              subtitle="Pick a district to see everything listed there"
            />
            <div className="t-scroller">
              {cities.map((city) => (
                <Link
                  key={city.name}
                  href={`/city/${encodeURIComponent(city.name)}`}
                  className="t-city"
                >
                  <PlaceImage
                    src={city.image}
                    alt=""
                    className="t-city__img"
                    fallbackIcon="pin"
                    sizes="164px"
                  />
                  <span className="t-city__veil" />
                  <span className="t-city__body">
                    <span className="t-city__name">{city.name}</span>
                    <span className="t-city__count">{city.count} places</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* ------------------------------ admin-curated collections --- */}
          {collections.length > 0 && (
            <section className="t-section">
              <SectionHeader
                title="Collections"
                subtitle="Hand-picked routes through the guide"
              />
              <div className="t-scroller">
                {collections.map((collection) => (
                  <Link
                    key={collection.pageLink}
                    href={`/${collection.pageLink}`}
                    className="t-dest"
                    style={{ aspectRatio: "4 / 3", width: 230 }}
                  >
                    <PlaceImage
                      src={collection.imageUrl}
                      alt={collection.title}
                      className="t-dest__img"
                      fallbackIcon="sparkle"
                      sizes="230px"
                    />
                    <span className="t-dest__veil" />
                    <span className="t-dest__body">
                      <span className="t-dest__name">{collection.title}</span>
                      <span className="t-dest__meta t-clamp-2">
                        {collection.description}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ---------------------------------------------- sponsored -- */}
          {promoted.length > 0 && (
            <section className="t-section">
              <SectionHeader
                title="Featured businesses"
                subtitle="Places on Tembera's Top plan · sponsored"
              />
              <div className="t-tilegrid">
                {promoted.map((place) => (
                  <PlaceCard key={place.id} place={place} variant="tile" />
                ))}
              </div>
            </section>
          )}

          {/* ------------------------------------------------ discover -- */}
          {destinations.length > 0 && (
            <section className="t-section">
              <SectionHeader
                title="Discover Rwanda"
                subtitle="Parks, lakes and heritage sites worth the trip"
                actionLabel="See all"
                actionHref="/c/nature"
              />
              <div className="t-scroller">
                {destinations.map((place) => (
                  <Link
                    key={place.id}
                    href={`/place/${place.id}`}
                    className="t-dest"
                  >
                    <PlaceImage
                      src={place.image}
                      alt={place.name}
                      className="t-dest__img"
                      categoryId={place.categoryId}
                      sizes="230px"
                    />
                    <span className="t-dest__veil" />
                    <span className="t-dest__body">
                      <span className="t-dest__name">{place.name}</span>
                      {/* City group, not the raw district — a reader expects
                          "Kigali", not "Gasabo". */}
                      <span className="t-dest__meta">
                        {place.subtype} · {cityGroup(place)}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}

/**
 * Runs a ranking once unfiltered and once per filterable category, keyed for
 * the client. "all" is the key the chips use when nothing is selected.
 */
async function rowsByCategory(
  categoryIds: string[],
  rank: (categoryId?: string) => Promise<Place[]>,
): Promise<Record<string, Place[]>> {
  const entries = await Promise.all([
    rank().then((places) => ["all", places] as const),
    ...categoryIds.map((id) => rank(id).then((places) => [id, places] as const)),
  ]);
  return Object.fromEntries(entries);
}

/** "495 places" — the honest scale of the guide, stated once, in the search
 *  placeholder. Counted from the catalog, never written down. */
function placeCountLabel(counts: Record<string, number>): string {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  return `${total.toLocaleString()} places`;
}
