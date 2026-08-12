import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/app/PageHeader";
import Icon from "@/components/Icon";
import PlaceActions from "@/components/place/PlaceActions";
import VisitRecorder from "@/components/place/VisitRecorder";
import PlaceImage from "@/components/ui/PlaceImage";
import PlaceRow from "@/components/ui/PlaceRow";
import SectionHeader from "@/components/ui/SectionHeader";
import { groupTitle } from "@/lib/places/taxonomy";
import { PLACES, getPlace, nearest } from "@/lib/places/catalog";
import type { Place } from "@/lib/places/types";

export function generateStaticParams() {
  return PLACES.map((place) => ({ id: place.id }));
}

/**
 * Every valid param is enumerated above. Without this, Next renders an
 * unlisted param on demand and serves the not-found page with a 200 — the
 * right screen, the wrong status. Refusing unknown params gives a real 404.
 */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const place = getPlace(id);
  if (!place) return { title: "Place not found" };

  return {
    title: place.name,
    description:
      place.description ??
      `${place.subcategory} in ${place.area ?? place.city}, Rwanda.`,
  };
}

export default async function PlaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const place = getPlace(id);
  if (!place) notFound();

  // Other places worth a look, measured from this one.
  const around =
    place.lat !== undefined && place.lng !== undefined
      ? nearest({ lat: place.lat, lng: place.lng }, { limit: 6 }).filter(
          (p) => p.id !== place.id,
        )
      : [];

  return (
    <>
      <PageHeader title={place.name} fallbackHref="/explore" revealTitleOnScroll />
      <VisitRecorder id={place.id} />

      <main className="t-main t-main--hasactionbar">
        <div className="t-page">
          {/* Controlled hero — big enough to place you, not big enough to
              push the useful information off the screen. */}
          <div className="t-detail__hero">
            <PlaceImage
              src={place.image}
              alt={place.name}
              categoryId={place.categoryId}
              sizes="(min-width: 768px) 900px, 100vw"
            />
          </div>

          <div className="t-detail__body">
            <div className="t-detail__cols">
              <div>
                <div className="t-inline t-wrap" style={{ marginBottom: "var(--t-2)" }}>
                  <Link href={`/c/${place.categoryId}`} className="t-badge t-badge--accent">
                    {groupTitle(place.categoryId)}
                  </Link>
                  <Link
                    href={`/c/${place.categoryId}?type=${encodeURIComponent(place.subcategory)}`}
                    className="t-badge"
                  >
                    {place.subcategory}
                  </Link>
                  {place.subtype && place.subtype !== place.subcategory && (
                    <span className="t-badge">{place.subtype}</span>
                  )}
                </div>

                <h1 className="t-display">{place.name}</h1>

                <div className="t-detail__metarow">
                  {place.rating !== undefined && (
                    <>
                      <span className="t-rating">
                        <Icon name="star" size={15} filled />
                        {place.rating.toFixed(1)}
                      </span>
                      <span className="t-place__sep" aria-hidden="true" />
                    </>
                  )}
                  <span className="t-inline" style={{ gap: 4 }}>
                    <Icon name="pin" size={15} style={{ color: "var(--t-ink-3)" }} />
                    <Link href={`/city/${encodeURIComponent(cityLink(place))}`}>
                      {place.area ?? place.city}
                    </Link>
                  </span>
                </div>

                {place.description && (
                  <p className="t-body" style={{ marginTop: "var(--t-4)", lineHeight: 1.6 }}>
                    {place.description}
                  </p>
                )}

                {/* ------------------------------------------- facts --- */}
                <div className="t-facts" style={{ marginTop: "var(--t-5)" }}>
                  {place.hours && (
                    <Fact icon="clock" label="Opening hours" value={place.hours} />
                  )}

                  {place.phone && (
                    <Fact
                      icon="phone"
                      label="Phone"
                      value={
                        <a href={`tel:${place.phone.replace(/\s/g, "")}`}>{place.phone}</a>
                      }
                    />
                  )}

                  <Fact
                    icon="pin"
                    label="Location"
                    value={
                      <>
                        {locationLine(place)}
                        {place.coordsPrecision === "district" && (
                          <span className="t-small t-muted" style={{ display: "block" }}>
                            Approximate — we have the district, not an exact address.
                          </span>
                        )}
                      </>
                    }
                  />

                  {place.priceFrom !== undefined && (
                    <Fact
                      icon="sparkle"
                      label="From"
                      value={`$${place.priceFrom} per night`}
                    />
                  )}
                </div>

                {/* -------------------------------------- highlights --- */}
                {place.highlights && place.highlights.length > 0 && (
                  <section style={{ marginTop: "var(--t-6)" }}>
                    <h2 className="t-heading" style={{ marginBottom: "var(--t-3)" }}>
                      What to expect
                    </h2>
                    <div className="t-inline t-wrap">
                      {place.highlights.map((item) => (
                        <span key={item} className="t-chip" style={{ cursor: "default" }}>
                          <Icon name="check" size={14} />
                          {item}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Desktop action panel; mobile gets the sticky bar below. */}
              <aside className="t-detail__aside t-show-desktop">
                <PlaceActions place={place} variant="panel" />
              </aside>
            </div>

            {/* ---------------------------------------------- nearby --- */}
            {around.length > 0 && (
              <section className="t-section">
                <SectionHeader
                  title="Nearby"
                  subtitle={`Other places close to ${place.name}`}
                />
                <div className="t-list">
                  {around.map((other) => (
                    <PlaceRow
                      key={other.id}
                      place={other}
                      measureFrom={{ lat: place.lat!, lng: place.lng! }}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      <PlaceActions place={place} variant="bar" />
    </>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: "clock" | "phone" | "pin" | "sparkle";
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="t-fact">
      <span className="t-fact__icon">
        <Icon name={icon} size={17} />
      </span>
      <span>
        <span className="t-fact__label">{label}</span>
        <span className="t-fact__value" style={{ display: "block" }}>
          {value}
        </span>
      </span>
    </div>
  );
}

/** Kigali's districts link to the combined "Kigali" city page. */
function cityLink(place: Place): string {
  return ["Gasabo", "Kicukiro", "Nyarugenge"].includes(place.city) ? "Kigali" : place.city;
}

/**
 * Area and district overlap in the source data: the area reads "Gisozi,
 * Kigali" while the district is "Gasabo", giving the nonsense line "Gisozi,
 * Kigali, Gasabo". Append the district only when the area doesn't already
 * place the reader — either by naming the district itself or the wider city.
 */
function locationLine(place: Place): string {
  const parts = (place.area ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const known = new Set(parts.map((part) => part.toLowerCase()));
  const alreadyPlaced =
    known.has(place.city.toLowerCase()) || known.has(cityLink(place).toLowerCase());

  if (!alreadyPlaced) parts.push(place.city);
  return [...new Set(parts)].join(", ");
}
