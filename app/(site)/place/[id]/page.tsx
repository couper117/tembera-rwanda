import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/app/PageHeader";
import Icon from "@/components/Icon";
import PlaceActions from "@/components/place/PlaceActions";
import VisitRecorder from "@/components/place/VisitRecorder";
import ReviewSection from "@/components/place/ReviewSection";
import PlaceImage from "@/components/ui/PlaceImage";
import PlaceRow from "@/components/ui/PlaceRow";
import SectionHeader from "@/components/ui/SectionHeader";
import { groupTitle } from "@/lib/data/categories";
import { getPlace, isSensitivePlace, nearest } from "@/lib/data/places";
import { getThingsToDo } from "@/lib/places/activities";
import { getCurrentUser } from "@/lib/auth";
import { getPlaceReviews } from "@/lib/data/user";
import type { Place } from "@/lib/places/types";

// Fully dynamic: the page renders per-user content (auth + the reader's own
// review) and must reflect admin edits immediately, so it is never prerendered.
// An unknown id falls through to getPlace() -> notFound(), which returns a real
// 404. (Prerendering every place via generateStaticParams would also open a DB
// connection per page at build time and bake in stale, signed-out content.)
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const place = await getPlace(id);
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
  const place = await getPlace(id);
  if (!place) notFound();

  // Other places worth a look, measured from this one.
  const around =
    place.lat !== undefined && place.lng !== undefined
      ? (await nearest({ lat: place.lat, lng: place.lng }, { limit: 6 })).filter(
          (p) => p.id !== place.id,
        )
      : [];

  // The category's display title, resolved server-side for the badge below.
  const categoryTitle = await groupTitle(place.categoryId);

  // Reviews + who's reading, for the ratings section.
  const [reviews, currentUser] = await Promise.all([
    getPlaceReviews(place.id),
    getCurrentUser(),
  ]);

  const sensitive = isSensitivePlace(place);
  const activities = getThingsToDo(place);

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
                    {categoryTitle}
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
                  {!sensitive && place.rating !== undefined && (
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

                  {place.website && (
                    <Fact
                      icon="external"
                      label="Website"
                      value={
                        <a href={place.website} target="_blank" rel="noopener noreferrer">
                          {prettyHost(place.website)}
                        </a>
                      }
                    />
                  )}
                </div>

                {/* ------------------------------------ things to do --- */}
                {activities.length > 0 && (
                  <section style={{ marginTop: "var(--t-6)" }}>
                    <h2 className="t-heading" style={{ marginBottom: "var(--t-3)" }}>
                      Things to do
                    </h2>
                    <div className="t-facts">
                      {activities.map((a) => (
                        <div key={a.label} className="t-activity">
                          <span className="t-activity__icon">
                            <Icon name={a.icon} size={18} />
                          </span>
                          <span className="t-body">{a.label}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* ---------------------------------------- gallery --- */}
                {place.images && place.images.length > 0 && (
                  <section style={{ marginTop: "var(--t-6)" }}>
                    <h2 className="t-heading" style={{ marginBottom: "var(--t-3)" }}>
                      Photos
                    </h2>
                    <div className="t-scroller">
                      {place.images.map((src, i) => (
                        <div key={src} className="t-gallery__tile">
                          <PlaceImage
                            src={src}
                            alt={`${place.name} photo ${i + 2}`}
                            categoryId={place.categoryId}
                            sizes="260px"
                          />
                        </div>
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

            {/* ---------------------------------------------- reviews --- */}
            <section className="t-section">
              <SectionHeader
                title="Ratings & reviews"
                subtitle={
                  sensitive
                    ? undefined
                    : reviews.length
                      ? `${reviews.length} review${reviews.length > 1 ? "s" : ""}`
                      : "Share your experience"
                }
              />
              {sensitive ? (
                <div className="t-notice">
                  <Icon name="memorial" size={18} className="t-notice__icon" />
                  <p className="t-notice__body">
                    Reviews and ratings are turned off for this memorial site out of
                    respect.
                  </p>
                </div>
              ) : (
                <ReviewSection
                  placeId={place.id}
                  reviews={reviews}
                  currentUserId={currentUser?.id ?? null}
                />
              )}
            </section>
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
  icon: "clock" | "phone" | "pin" | "sparkle" | "external";
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

/** "https://www.bkarena.rw/" -> "bkarena.rw" — readable in a fact row. */
function prettyHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  }
}
