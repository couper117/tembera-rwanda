import Link from "next/link";
import AppHeader from "@/components/app/AppHeader";
import CalendarNotice from "@/components/app/CalendarNotice";
import Icon from "@/components/Icon";
import HomeFeed from "@/components/home/HomeFeed";
import PlaceImage from "@/components/ui/PlaceImage";
import SectionHeader from "@/components/ui/SectionHeader";
import { getCategories } from "@/lib/data/categories";
import {
  cityGroup,
  citySummaries,
  countByCategory,
  featured,
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

  const nearby = await rowsByCategory(filterable, (categoryId) =>
    nearest(KIGALI, { limit: ROW, categoryId }),
  );
  const rated = await rowsByCategory(filterable, (categoryId) =>
    topRated(ROW, categoryId),
  );

  const cities = (await citySummaries()).slice(0, 8);
  const destinations = await featured(8);

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
                    sizes="148px"
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
                    style={{ aspectRatio: "4 / 3", width: 260 }}
                  >
                    <PlaceImage
                      src={collection.imageUrl}
                      alt={collection.title}
                      className="t-dest__img"
                      fallbackIcon="sparkle"
                      sizes="260px"
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
                      sizes="260px"
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
