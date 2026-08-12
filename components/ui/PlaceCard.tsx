"use client";

import Link from "next/link";
import Icon from "@/components/Icon";
import PlaceImage from "@/components/ui/PlaceImage";
import SaveButton from "@/components/ui/SaveButton";
import { useLocation } from "@/lib/client/location";
import { distanceKm, formatDistanceFor } from "@/lib/places/geo";
import type { Place } from "@/lib/places/types";

interface Props {
  place: Place;
  /** Grid cards stretch to their column; rail cards keep a fixed width. */
  variant?: "rail" | "grid";
  /** Hide distance where it would be noise (e.g. a city-scoped list). */
  showDistance?: boolean;
}

/**
 * The primary discovery card: image, name, then the facts that help someone
 * decide — category, rating, distance. No marketing copy.
 */
export default function PlaceCard({
  place,
  variant = "rail",
  showDistance = true,
}: Props) {
  // Distance is measured from the shared origin (device position, chosen city,
  // or Kigali). Sections that show distances state which, so the card doesn't
  // have to repeat it.
  const { origin } = useLocation();

  const km =
    showDistance && place.lat !== undefined && place.lng !== undefined
      ? distanceKm(origin, { lat: place.lat, lng: place.lng })
      : undefined;

  // A "~" prefix signals the pin is a district centre, not a surveyed address;
  // sub-kilometre readings are dropped entirely for those.
  const distance = formatDistanceFor(km, place.coordsPrecision);

  return (
    <Link
      href={`/place/${place.id}`}
      className={`t-place${variant === "grid" ? " t-place--grid" : ""}`}
    >
      <div className="t-place__media">
        <PlaceImage
          src={place.image}
          alt={place.name}
          className="t-place__img"
          categoryId={place.categoryId}
          sizes="(min-width: 1100px) 260px, (min-width: 720px) 33vw, 45vw"
        />
        <SaveButton placeId={place.id} placeName={place.name} />
      </div>

      <div className="t-place__body">
        <h3 className="t-place__name t-truncate">{place.name}</h3>

        <div className="t-place__meta">
          <span>{place.subcategory ?? place.city}</span>

          {place.rating !== undefined && (
            <>
              <span className="t-place__sep" aria-hidden="true" />
              <span className="t-rating">
                <Icon name="star" size={13} filled />
                {place.rating.toFixed(1)}
              </span>
            </>
          )}

          {distance && (
            <>
              <span className="t-place__sep" aria-hidden="true" />
              <span>{distance}</span>
            </>
          )}
        </div>

      </div>
    </Link>
  );
}
