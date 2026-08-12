import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/app/PageHeader";
import Icon, { type IconName } from "@/components/Icon";
import { countByCategory, citySummaries } from "@/lib/places/catalog";
import { CATEGORY_GROUPS } from "@/lib/places/taxonomy";

export const metadata: Metadata = {
  title: "About",
  description: "What Tembera is, what's in it, and how it works.",
};

/**
 * A short, factual "about" — what the product is and what is actually in it.
 * The legacy page was a marketing brochure with a hero and mission statement;
 * this states the numbers instead.
 */
export default function AboutPage() {
  const counts = countByCategory();
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const cities = citySummaries().length;

  return (
    <>
      <PageHeader title="About Tembera" fallbackHref="/profile" revealTitleOnScroll />

      <main className="t-main">
        <div className="t-page" style={{ maxWidth: 680 }}>
          <div className="t-section">
            <h1 className="t-display">About Tembera</h1>
            <p className="t-body" style={{ marginTop: "var(--t-3)", lineHeight: 1.6 }}>
              Tembera is a directory of real places in Rwanda — where to eat,
              stay, shop, worship, train and visit. Search it, filter it, and get
              directions. That&apos;s the whole product.
            </p>
          </div>

          <section className="t-section">
            <div className="t-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              <Stat value={total.toLocaleString()} label="Places listed" />
              <Stat value={String(CATEGORY_GROUPS.length)} label="Categories" />
              <Stat value={String(cities)} label="Cities & districts" />
            </div>
          </section>

          <section className="t-section">
            <h2 className="t-heading" style={{ marginBottom: "var(--t-3)" }}>
              What&apos;s covered
            </h2>
            <div className="t-card">
              {CATEGORY_GROUPS.map((category) => (
                <Link
                  key={category.id}
                  href={`/c/${category.id}`}
                  className="t-fact"
                  style={{ padding: "var(--t-3) var(--t-4)", alignItems: "center" }}
                >
                  <span className="t-fact__icon">
                    <Icon name={category.icon as IconName} size={17} />
                  </span>
                  <span className="t-row__name" style={{ flex: 1 }}>
                    {category.title}
                  </span>
                  <span className="t-small t-muted">{counts[category.id] ?? 0}</span>
                  <span className="t-row__chev">
                    <Icon name="chevronRight" size={18} />
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="t-section">
            <h2 className="t-heading" style={{ marginBottom: "var(--t-3)" }}>
              How to read the data
            </h2>
            <div className="t-stack-3">
              <Note
                icon="pin"
                title="Distances marked with ~ are approximate"
                text="Some listings only record a district, not a street address. Those are pinned to the district centre and their distance is prefixed with a tilde."
              />
              <Note
                icon="star"
                title="Ratings only appear where we have them"
                text="A place with no star simply has no rating in the data — it isn't a low score."
              />
              <Note
                icon="info"
                title="This is a demo directory"
                text="Listings are real, well-known Rwandan places, but they're a seed set rather than a verified register. Check opening times and locations with the place itself before you travel."
              />
              <Note
                icon="sparkle"
                title="A few subcategories are still empty"
                text="Where Tembera has no listings yet the subcategory is shown but greyed out, rather than padded with placeholder entries."
              />
              <Note
                icon="bookmark"
                title="Saves stay on your device"
                text="Tembera has no public accounts. Saved places and recent searches live in this browser only."
              />
            </div>
          </section>

        </div>
      </main>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="t-card" style={{ padding: "var(--t-4) var(--t-3)", textAlign: "center" }}>
      <div className="t-title">{value}</div>
      <div className="t-small t-muted" style={{ marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

function Note({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  return (
    <div className="t-notice">
      <span className="t-notice__icon">
        <Icon name={icon} size={18} />
      </span>
      <div className="t-notice__body">
        <div className="t-notice__title">{title}</div>
        {text}
      </div>
    </div>
  );
}
