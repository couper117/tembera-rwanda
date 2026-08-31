"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import PlaceCard from "@/components/ui/PlaceCard";
import SectionHeader from "@/components/ui/SectionHeader";
import { SkeletonRail } from "@/components/ui/Skeleton";
import { useLocation } from "@/lib/client/location";
import type { Place } from "@/lib/places/types";

interface Props {
  /** Server-rendered list for the default origin, so the row is never empty. */
  initial: Place[];
}

/**
 * "Near you" — server-rendered against the default city on first paint, then
 * re-fetched against the device position once (and only if) the user grants
 * location. The heading always says which origin the distances came from.
 */
export default function NearYou({ initial }: Props) {
  const { coords, status, requestLocation, originLabel } = useLocation();
  const [places, setPlaces] = useState<Place[]>(initial);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!coords) return;

    const controller = new AbortController();
    setLoading(true);
    setFailed(false);

    fetch(`/api/nearby?lat=${coords.lat}&lng=${coords.lng}&limit=12`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data: { places: Place[] }) => setPlaces(data.places))
      .catch((error) => {
        if (error.name !== "AbortError") setFailed(true);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [coords]);

  return (
    <section className="t-section">
      {/* No subtitle: it used to name the origin and explain that distances
          were measured from a city centre, both of which every card already
          shows in its own caption. */}
      <SectionHeader title="Near you" actionLabel="See all" actionHref="/map" />

      {/* Offered, never auto-triggered. Once the browser has blocked us there
          is nothing a button can do, so say what would actually fix it. */}
      {!coords && status === "denied" && (
        <div className="t-notice" style={{ marginBottom: "var(--t-3)" }}>
          <span className="t-notice__icon">
            <Icon name="info" size={18} />
          </span>
          <div className="t-notice__body">
            Location is blocked for this site. Allow it in your browser settings,
            or pick a city from the pin in the header.
          </div>
        </div>
      )}

      {!coords && status !== "locating" && status !== "denied" && (
        <button
          type="button"
          className="t-btn t-btn--secondary t-btn--sm"
          onClick={requestLocation}
          style={{ marginBottom: "var(--t-3)" }}
        >
          <Icon name="navigate" size={16} />
          Locate me
        </button>
      )}

      {failed && (
        <div className="t-notice" style={{ marginBottom: "var(--t-3)" }}>
          <span className="t-notice__icon">
            <Icon name="info" size={18} />
          </span>
          <div className="t-notice__body">
            We couldn&apos;t refresh places near you, so these are around{" "}
            {originLabel}.
          </div>
        </div>
      )}

      {loading ? (
        <SkeletonRail count={4} />
      ) : (
        <div className="t-scroller t-fadein">
          {places.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      )}
    </section>
  );
}
