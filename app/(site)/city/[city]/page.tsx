import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/app/PageHeader";
import PlaceBrowser from "@/components/browse/PlaceBrowser";
import { placesInCity } from "@/lib/data/places";

/**
 * Fully dynamic, like /place/[id]. Cities come from admin-editable place data,
 * so prerendering the list would open a DB connection at build time and leave a
 * newly added city 404-ing until the next deploy. A city with no places falls
 * through to notFound() below, which returns a real 404.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: raw } = await params;
  const city = decodeURIComponent(raw);
  return {
    title: city,
    description: `Restaurants, stays, markets and more listed in ${city} on Tembera.`,
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: raw } = await params;
  const city = decodeURIComponent(raw);

  const places = await placesInCity(city);
  if (places.length === 0) notFound();

  return (
    <>
      <PageHeader title={city} fallbackHref="/explore" revealTitleOnScroll />

      <main className="t-main">
        <div className="t-page">
          <div className="t-section">
            <h1 className="t-display">{city}</h1>
            <p className="t-small t-muted" style={{ marginTop: 4 }}>
              {places.length} {places.length === 1 ? "place" : "places"} listed
            </p>
          </div>

          <div style={{ marginTop: "var(--t-5)" }}>
            <PlaceBrowser
              places={places}
              emptyTitle={`Nothing listed in ${city} yet`}
              emptyActions={[{ label: "Browse all cities", href: "/explore", variant: "primary" }]}
            />
          </div>
        </div>
      </main>
    </>
  );
}
