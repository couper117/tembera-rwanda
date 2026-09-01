import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import PageHeader from "@/components/app/PageHeader";
import PlaceCard from "@/components/ui/PlaceCard";
import SectionHeader from "@/components/ui/SectionHeader";
import { publicBusiness } from "@/lib/data/business";
import { planById } from "@/lib/business/plans";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const found = await publicBusiness(Number(id));
  if (!found) return { title: "Business not found" };
  return {
    title: found.business.name,
    description: `${found.business.name} on Tembera — ${found.places.length} listing${
      found.places.length === 1 ? "" : "s"
    } kept up to date by the business itself.`,
  };
}

/**
 * A verified business, and everything it looks after.
 *
 * The point of this page is accountability rather than promotion. A visitor
 * reading a listing can now see who stands behind it and what else they run —
 * which is worth more than the tick on its own, because it turns an anonymous
 * badge into a name with a track record attached.
 *
 * Unverified businesses have no page at all. Gathering listings under the name
 * of somebody nobody has checked would be Tembera vouching for them.
 */
export default async function BusinessProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric <= 0) notFound();

  const found = await publicBusiness(numeric);
  if (!found) notFound();

  const { business, places } = found;
  const plan = planById(business.plan);
  const since = business.createdAt.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <PageHeader title={business.name} fallbackHref="/explore" revealTitleOnScroll />

      <main className="t-main">
        <div className="t-page">
          <section className="t-section">
            <div className="t-bizhead">
              <span className="t-bizhead__mark" aria-hidden="true">
                {business.name.slice(0, 2).toUpperCase()}
              </span>
              <div style={{ minWidth: 0 }}>
                <h1 className="t-display">{business.name}</h1>
                <div className="t-bizhead__meta">
                  {/* The tick means the same thing here as on a listing: paid
                      plan plus a person having checked who they are. */}
                  <span className="t-bizhead__verified">
                    <Icon name="shield" size={15} />
                    Verified business
                  </span>
                  <span className="t-place__sep" aria-hidden="true" />
                  <span>
                    <Icon name="pin" size={14} /> {business.city}
                  </span>
                  <span className="t-place__sep" aria-hidden="true" />
                  <span>On Tembera since {since}</span>
                </div>
              </div>
            </div>

            <p className="t-body" style={{ marginTop: "var(--t-4)", lineHeight: 1.6 }}>
              {business.name} keeps {places.length === 1 ? "this listing" : "these listings"}{" "}
              up to date{plan ? ` on the ${plan.name} plan` : ""}. Opening hours,
              photos and contact details come from the business itself rather
              than from us.
            </p>
          </section>

          <section className="t-section">
            <SectionHeader
              title={places.length === 1 ? "Their listing" : "Their listings"}
              subtitle={`${places.length} place${places.length === 1 ? "" : "s"} on Tembera`}
            />

            {places.length > 0 ? (
              <div className="t-tilegrid">
                {places.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={{
                      ...place,
                      subtype: undefined,
                      coordsPrecision: "unknown",
                      area: place.area ?? undefined,
                      image: place.image ?? undefined,
                      rating: place.rating ?? undefined,
                    }}
                    variant="tile"
                  />
                ))}
              </div>
            ) : (
              <p className="t-small t-muted">
                Nothing published yet. Anything they add appears here.
              </p>
            )}
          </section>

          <section className="t-section">
            <p className="t-small t-muted">
              Is this your business?{" "}
              <Link href="/business/register">Claim your listing on Tembera</Link>.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
