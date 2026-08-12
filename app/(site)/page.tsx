import Link from "next/link";
import AppHeader from "@/components/app/AppHeader";
import Icon from "@/components/Icon";
import NearYou from "@/components/home/NearYou";
import CategoryTile from "@/components/ui/CategoryTile";
import PlaceCard from "@/components/ui/PlaceCard";
import PlaceImage from "@/components/ui/PlaceImage";
import SectionHeader from "@/components/ui/SectionHeader";
import { CATEGORY_GROUPS } from "@/lib/places/taxonomy";
import {
  cityGroup,
  citySummaries,
  countByCategory,
  featured,
  nearest,
  topRated,
} from "@/lib/places/catalog";
import { KIGALI } from "@/lib/places/geo";
import { getCollections } from "@/lib/collections";

// The curated-collections row reads from Postgres.
export const dynamic = "force-dynamic";

/**
 * Home is a discovery dashboard, not a landing page. Above the fold you get
 * the question, the search box and the categories — the three things that let
 * someone actually use Tembera. Photography appears further down as content,
 * never as a hero.
 */
export default async function HomePage() {
  const counts = countByCategory();
  const primary = CATEGORY_GROUPS.filter((group) => group.primary);
  const collections = await getCollections();

  // Default "near you" list, measured from Kigali. The client swaps this for a
  // real one if the user shares their location.
  const nearbyDefault = nearest(KIGALI, { limit: 12 });
  const rated = topRated(10);
  const cities = citySummaries().slice(0, 8);
  const destinations = featured(8);

  return (
    <>
      <AppHeader />

      <main className="t-main">
        <div className="t-page">
          {/* ------------------------------------------------ search ---- */}
          <section className="t-section">
            <h1 className="t-display">What are you looking for?</h1>
            <p className="t-small t-muted" style={{ marginTop: 4 }}>
              {placeCountLabel(counts)} across Rwanda
            </p>

            <Link
              href="/search"
              className="t-searchlink"
              style={{ marginTop: "var(--t-4)" }}
            >
              <Icon name="search" size={20} />
              <span>Search places, restaurants, hotels…</span>
              <span className="t-searchlink__hint">/</span>
            </Link>
          </section>

          {/* -------------------------------------------- categories ---- */}
          <section className="t-section">
            <SectionHeader
              title="Explore"
              subtitle={`${CATEGORY_GROUPS.length} categories, from restaurants to hospitals`}
              actionLabel="All categories"
              actionHref="/explore"
            />
            <div className="t-catgrid">
              {primary.map((category) => (
                <CategoryTile
                  key={category.id}
                  category={category}
                  count={counts[category.id]}
                />
              ))}
            </div>
          </section>

          {/* ----------------------------------------------- near you --- */}
          <NearYou initial={nearbyDefault} />

          {/* ---------------------------------------------- top rated --- */}
          {rated.length > 0 && (
            <section className="t-section">
              <SectionHeader
                title="Top rated"
                subtitle="Highest rated places in the guide"
              />
              <div className="t-scroller">
                {rated.map((place) => (
                  <PlaceCard key={place.id} place={place} />
                ))}
              </div>
            </section>
          )}

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

/** "298 places" — the honest scale of the guide, stated once. */
function placeCountLabel(counts: Record<string, number>): string {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  return `${total.toLocaleString()} places`;
}
