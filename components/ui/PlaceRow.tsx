"use client";

import Link from "next/link";
import Icon from "@/components/Icon";
import PlaceImage from "@/components/ui/PlaceImage";
import { useCategoryMap } from "@/lib/client/categories";
import { useLocation } from "@/lib/client/location";
import { distanceKm, formatDistanceFor } from "@/lib/places/geo";
import type { Coords, Place } from "@/lib/places/types";

interface Props {
  place: Place;
  /** Replaces the chevron with custom trailing content (e.g. a save button). */
  trailing?: React.ReactNode;
  showDistance?: boolean;
  /**
   * Measure distance from here instead of the user's position. Used by the
   * "Nearby" list on a place page, where "620 m away" has to mean away from
   * *that place*, not from wherever the reader happens to be.
   */
  measureFrom?: Coords;
}

/** Compact list row — used in search results, saved, and the map panel. */
export default function PlaceRow({
  place,
  trailing,
  showDistance = true,
  measureFrom,
}: Props) {
  const { origin } = useLocation();
  const from = measureFrom ?? origin;
  const groupLabel = useCategoryMap().get(place.categoryId)?.label ?? place.categoryId;

  const km =
    showDistance && place.lat !== undefined && place.lng !== undefined
      ? distanceKm(from, { lat: place.lat, lng: place.lng })
      : undefined;
  const distance = formatDistanceFor(km, place.coordsPrecision);

  return (
    <Link href={`/place/${place.id}`} className="t-row">
      <div className="t-row__media">
        <PlaceImage
          src={place.image}
          alt={place.name}
          className="t-row__img"
          categoryId={place.categoryId}
          sizes="68px"
        />
      </div>

      <div className="t-row__body">
        <div className="t-row__name t-truncate">{place.name}</div>
        <div className="t-place__meta">
          <span>{place.subcategory ?? groupLabel}</span>
          <span className="t-place__sep" aria-hidden="true" />
          <span>{place.area ?? place.city}</span>
        </div>
        <div className="t-place__meta">
          {place.rating !== undefined && (
            <span className="t-rating">
              <Icon name="star" size={13} filled />
              {place.rating.toFixed(1)}
            </span>
          )}
          {place.rating !== undefined && distance && (
            <span className="t-place__sep" aria-hidden="true" />
          )}
          {distance && <span>{distance} away</span>}
        </div>
      </div>

      {trailing ?? (
        <span className="t-row__chev">
          <Icon name="chevronRight" size={18} />
        </span>
      )}
    </Link>
  );
}
