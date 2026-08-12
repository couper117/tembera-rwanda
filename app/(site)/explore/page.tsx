import type { Metadata } from "next";
import Link from "next/link";
import AppHeader from "@/components/app/AppHeader";
import Icon from "@/components/Icon";
import { categoryColor, resolveIconName } from "@/components/ui/categoryIcon";
import PlaceImage from "@/components/ui/PlaceImage";
import SectionHeader from "@/components/ui/SectionHeader";
import { citySummaries, groupSummaries } from "@/lib/data/places";
import { getCategories } from "@/lib/data/categories";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore",
  description: "Every category, subcategory and city covered by Tembera.",
};

/**
 * The full taxonomy, laid out so the whole product is visible on one screen:
 * every group, every subcategory, each with its real count and each a link
 * straight into the filtered listing.
 */
export default async function ExplorePage() {
  const summaries = await groupSummaries();
  const byId = new Map(summaries.map((s) => [s.id, s]));
  const cities = await citySummaries();
  const categories = await getCategories();
  const total = summaries.reduce((sum, group) => sum + group.total, 0);

  return (
    <>
      <AppHeader />

      <main className="t-main">
        <div className="t-page">
          <section className="t-section">
            <h1 className="t-display">Explore</h1>
            <p className="t-small t-muted" style={{ marginTop: 4 }}>
              {total.toLocaleString()} places across {categories.length} categories
            </p>

            <Link
              href="/search"
              className="t-searchlink"
              style={{ marginTop: "var(--t-4)" }}
            >
              <Icon name="search" size={20} />
              <span>Search places, restaurants, hotels…</span>
            </Link>
          </section>

          <section className="t-section">
            <SectionHeader
              title="All categories"
              subtitle="Tap a subcategory to jump straight to it"
            />

            <div className="t-catcols">
              {categories.map((group) => {
                const summary = byId.get(group.id);
                const color = categoryColor(group.id);
                return (
                  <div
                    key={group.id}
                    className="t-catcard"
                    // One source of colour for the icon, the hover states and
                    // every chip inside this card.
                    style={
                      {
                        "--cat-bg": color.bg,
                        "--cat-fg": color.fg,
                      } as React.CSSProperties
                    }
                  >
                    <Link href={`/c/${group.id}`} className="t-catcard__head">
                      <span className="t-catcard__icon">
                        <Icon name={resolveIconName(group.icon)} size={21} />
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span className="t-catcard__title">{group.title}</span>
                        <span className="t-catcard__count">
                          {summary?.total ?? 0} places
                        </span>
                      </span>
                      <span className="t-catcard__go">
                        <Icon name="chevronRight" size={17} />
                      </span>
                    </Link>

                    <div className="t-catcard__subs">
                      {group.subcategories.map((sub) => {
                        const count =
                          summary?.subcategories.find((s) => s.name === sub)?.count ?? 0;

                        // Listed either way so the taxonomy reads completely,
                        // but only linked when there is something behind it.
                        if (count === 0) {
                          return (
                            <span key={sub} className="t-subchip t-subchip--empty">
                              {sub}
                            </span>
                          );
                        }
                        return (
                          <Link
                            key={sub}
                            href={`/c/${group.id}?type=${encodeURIComponent(sub)}`}
                            className="t-subchip"
                          >
                            {sub}
                            <span className="t-chip__count">{count}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="t-section">
            <SectionHeader
              title="Cities & districts"
              subtitle={`${cities.length} places across Rwanda have listings`}
            />
            <div className="t-grid">
              {cities.map((city) => (
                <Link
                  key={city.name}
                  href={`/city/${encodeURIComponent(city.name)}`}
                  className="t-city"
                  style={{ width: "100%", aspectRatio: "4 / 3" }}
                >
                  <PlaceImage
                    src={city.image}
                    alt=""
                    className="t-city__img"
                    fallbackIcon="pin"
                    sizes="(min-width: 720px) 30vw, 45vw"
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
        </div>
      </main>
    </>
  );
}
