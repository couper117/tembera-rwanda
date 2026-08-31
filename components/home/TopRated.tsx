"use client";

import Link from "next/link";
import PlaceCard from "@/components/ui/PlaceCard";
import SectionHeader from "@/components/ui/SectionHeader";
import { useGroupLabel } from "@/lib/client/categories";
import type { Place } from "@/lib/places/types";

interface Props {
  /**
   * Rows ranked on the server, keyed by category id plus "all". Ranking the
   * whole catalog and filtering that in the browser would be wrong: the ten
   * best-rated places overall contain almost no dining, so a "Dining" filter
   * would show whatever dining happened to make the global cut rather than
   * the best-rated dining.
   */
  rows: Record<string, Place[]>;
  categoryId: string | null;
}

export default function TopRated({ rows, categoryId }: Props) {
  const places = rows[categoryId ?? "all"] ?? [];
  const label = useGroupLabel(categoryId ?? "");

  return (
    <section className="t-section">
      <SectionHeader title="Top rated" />

      {places.length > 0 ? (
        <div className="t-tilegrid">
          {places.map((place) => (
            <PlaceCard key={place.id} place={place} variant="tile" />
          ))}
        </div>
      ) : (
        // The section keeps its place rather than vanishing, so filtering
        // doesn't shuffle everything below it up the screen.
        <p className="t-small t-muted">
          Nothing in {label} carries a rating yet.{" "}
          {categoryId && <Link href={`/c/${categoryId}`}>Browse {label}</Link>}
        </p>
      )}
    </section>
  );
}
