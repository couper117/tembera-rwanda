import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/app/PageHeader";
import Icon from "@/components/Icon";
import PlaceActions from "@/components/place/PlaceActions";
import PlaceHero from "@/components/place/PlaceHero";
import PlaceMap from "@/components/place/PlaceMap";
import OpeningHours from "@/components/place/OpeningHours";
import WhyVisit from "@/components/place/WhyVisit";
import VisitRecorder from "@/components/place/VisitRecorder";
import CalendarNotice from "@/components/app/CalendarNotice";
import ReportProblem from "@/components/place/ReportProblem";
import ReviewSection from "@/components/place/ReviewSection";
import PlaceImage from "@/components/ui/PlaceImage";
import PlaceRow from "@/components/ui/PlaceRow";
import SectionHeader from "@/components/ui/SectionHeader";
import { getGroup, groupTitle } from "@/lib/data/categories";
import { getPlace, isSensitivePlace, nearest } from "@/lib/data/places";
import { getThingsToDo } from "@/lib/places/activities";
import { displayPrice } from "@/lib/places/pricing";
import { openStateNow, weekHoursOf } from "@/lib/places/hours";
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

  // A place of remembrance is not a place to consume. Memorial sites reach
  // this page through the same route as a restaurant, so the page itself has
  // to know the difference: no rating out of five, no reviews, no price, no
  // "what to expect" chips. See `sensitive` in lib/places/taxonomy.ts.
  // Three ways in, because they answer different questions: the category flag
  // covers a whole class of place, the per-place flag covers a memorial seeded
  // under another category (the Campaign Against Genocide museum sits in
  // "arts"), and the memorials id is the backstop for rows predating both.
  const group = await getGroup(place.categoryId);
  const isSensitive = group?.sensitive === true || isSensitivePlace(place);

  // What a price means depends on what the place is: "per night" on a
  // restaurant is noise, and on a memorial it is worse than noise.
  const price = displayPrice(place);

  // Structured hours drive both the hero pill and the week table. The
  // free-text `hours` line stays as the fallback for imported rows.
  const week = weekHoursOf(place);
  const openState = openStateNow(week);

  // Reviews + who's reading, for the ratings section. Skipped entirely for
  // sensitive places — not fetched, not rendered, not collectable.
  const [reviews, currentUser] = isSensitive
    ? [[], null]
    : await Promise.all([getPlaceReviews(place.id), getCurrentUser()]);

  // "Things to do" is the wrong register for a place of remembrance, for the
  // same reason the highlights chips are.
  const activities = isSensitive ? [] : getThingsToDo(place);

  // `images` includes the hero shot on most rows, so an unfiltered gallery
  // showed the same photograph twice and claimed "2 photos" for one.
  const gallery = (place.images ?? []).filter((src) => src !== place.image);

  return (
    <>
      <PageHeader title={place.name} fallbackHref="/explore" revealTitleOnScroll />
      <VisitRecorder id={place.id} />

      <main className="t-main t-main--hasactionbar">
        <div className="t-page">
          <PlaceHero
            place={place}
            categoryTitle={categoryTitle}
            isSensitive={isSensitive}
            photoCount={gallery.length + 1}
            openLabel={openState.label}
            isOpen={openState.open}
          />

          <div className="t-detail__body">
            <div className="t-detail__cols">
              <div className="t-detail__main">
                {/* --------------------------------------- quick facts --- */}
                <div className="t-facts t-facts--quick">
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

                  {place.phone && (
                    <Fact
                      icon="phone"
                      label="Phone"
                      value={
                        <a href={`tel:${place.phone.replace(/\s/g, "")}`}>{place.phone}</a>
                      }
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

                  {price && !isSensitive && (
                    <Fact icon="sparkle" label={price.label} value={price.value} />
                  )}
                </div>

                {/* A closure warning sits directly above the opening hours,
                    because that is the line it contradicts. */}
                <div style={{ marginTop: "var(--t-5)" }}>
                  <CalendarNotice />
                </div>

                {/* --------------------------------------------- about --- */}
                {place.description && (
                  <section className="t-section" id="about">
                    <h2 className="t-heading">About</h2>
                    <p
                      className="t-body"
                      style={{ marginTop: "var(--t-2)", lineHeight: 1.7 }}
                    >
                      {place.description}
                    </p>
                  </section>
                )}

                {isSensitive && (
                  <div className="t-remember__note" style={{ marginTop: "var(--t-5)" }}>
                    <p>
                      This is a place of remembrance. Visitors are asked to dress
                      modestly, keep their voices low, and follow the guidance of
                      staff on site — including where photography is and is not
                      permitted.
                    </p>
                    <p>
                      Tembera does not rate or review memorial sites. Please
                      confirm opening times with the site before travelling.
                    </p>
                  </div>
                )}

                {/* ----------------------------------------- why visit --- */}
                {!isSensitive && <WhyVisit place={place} />}

                {/* -------------------------------------- things to do --- */}
                {activities.length > 0 && (
                  <section className="t-section">
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

                {/* -------------------------------------------- photos --- */}
                {gallery.length > 0 && (
                  <section className="t-section" id="photos">
                    <h2 className="t-heading" style={{ marginBottom: "var(--t-3)" }}>
                      Photos
                    </h2>
                    <div className="t-scroller">
                      {gallery.map((src, i) => (
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

                {/* --------------------------------------------- hours --- */}
                <OpeningHours week={week} state={openState} fallback={place.hours} />

                {/* ------------------------------------------ location --- */}
                {place.lat !== undefined && place.lng !== undefined && (
                  <section className="t-section" id="location">
                    <h2 className="t-heading" style={{ marginBottom: "var(--t-3)" }}>
                      Where it is
                    </h2>
                    <PlaceMap
                      lat={place.lat}
                      lng={place.lng}
                      name={place.name}
                      approximate={place.coordsPrecision !== "exact"}
                    />
                  </section>
                )}
              </div>

              {/* Desktop action panel; mobile gets the sticky bar below. */}
              <aside className="t-detail__aside t-show-desktop">
                <PlaceActions place={place} variant="panel" />
              </aside>
            </div>

            {/* ---------------------------------------------- reviews --- */}
            {!isSensitive && (
              <section className="t-section">
                <SectionHeader
                  title="Ratings & reviews"
                  subtitle={
                    reviews.length
                      ? `${reviews.length} review${reviews.length > 1 ? "s" : ""}`
                      : "Share your experience"
                  }
                />
                <ReviewSection
                  placeId={place.id}
                  reviews={reviews}
                  currentUserId={currentUser?.id ?? null}
                />
              </section>
            )}

            {/* ----------------------------------------------- nearby --- */}
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

            {/* ----------------------------------------------- report --- */}
            <ReportProblem placeId={place.id} placeName={place.name} />
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
