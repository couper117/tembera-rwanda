"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import PlaceCard from "@/components/ui/PlaceCard";
import SectionHeader from "@/components/ui/SectionHeader";
import { SkeletonTiles } from "@/components/ui/Skeleton";
import { useGroupLabel } from "@/lib/client/categories";
import { useLocation } from "@/lib/client/location";
import type { Place } from "@/lib/places/types";

interface Props {
  /**
   * Rows measured from the default origin on the server, keyed by category id
   * plus "all", so a chip can be pressed before the network is involved.
   */
  rows: Record<string, Place[]>;
  categoryId: string | null;
  /** How many cards a row holds. */
  limit: number;
}

/**
 * "Near you" — server-rendered against the default city on first paint, then
 * re-ranked against the device position once (and only if) the user grants
 * location. Pressing a category chip re-runs the same query scoped to that
 * category, so the row stays a real "nearest N in X" either way.
 */
export default function NearYou({ rows, categoryId, limit }: Props) {
  const { coords, status, requestLocation, originLabel } = useLocation();
  const [located, setLocated] = useState<Place[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const label = useGroupLabel(categoryId ?? "");

  useEffect(() => {
    // Without a device position the server rows already answer the question.
    if (!coords) {
      setLocated(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setFailed(false);

    const query = new URLSearchParams({
      lat: String(coords.lat),
      lng: String(coords.lng),
      limit: String(limit),
    });
    if (categoryId) query.set("category", categoryId);

    fetch(`/api/nearby?${query}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data: { places: Place[] }) => setLocated(data.places))
      .catch((error) => {
        if (error.name !== "AbortError") setFailed(true);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [coords, categoryId, limit]);

  const places = located ?? rows[categoryId ?? "all"] ?? [];

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
        <SkeletonTiles count={limit} />
      ) : places.length > 0 ? (
        <div className="t-tilegrid">
          {places.map((place) => (
            <PlaceCard key={place.id} place={place} variant="tile" />
          ))}
        </div>
      ) : (
        <p className="t-small t-muted">
          Nothing in {label} is mapped near {originLabel} yet.{" "}
          {categoryId && <Link href={`/c/${categoryId}`}>Browse {label}</Link>}
        </p>
      )}
    </section>
  );
}
