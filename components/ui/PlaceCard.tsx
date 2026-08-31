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
  /**
   * Rail cards keep a fixed width; grid cards stretch to their column; tile
   * cards are the landing page's photo-led form, where the caption sits over
   * the image instead of under it.
   */
  variant?: "rail" | "grid" | "tile";
  /** Hide distance where it would be noise (e.g. a city-scoped list). */
  showDistance?: boolean;
}

/**
 * The primary discovery card: image, name, then the facts that help someone
 * decide — category, rating, distance. No marketing copy.
 *
 * The "tile" variant folds all of that onto the photograph. It exists because
 * a places guide is chosen from pictures: the text block under the old card
 * cost as much height as the thumbnail above it, which left the photo small on
 * the one screen where photos should be doing the work.
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
  const category = place.subcategory ?? place.city;

  if (variant === "tile") {
    return (
      <Link href={`/place/${place.id}`} className="t-tile">
        {/* The photo lives inside its own overflow:hidden box so that scaling
            it on hover cannot clip the caption or the badges, which are
            siblings of this wrapper rather than children. */}
        <span className="t-tile__media">
          <PlaceImage
            src={place.image}
            alt={place.name}
            className="t-tile__img"
            categoryId={place.categoryId}
            seed={place.id}
            sizes="(min-width: 1240px) 213px, (min-width: 560px) 22vw, 45vw"
          />
        </span>

        {/* Dark at the bottom for the caption, and again at the top so the
            badges hold up over a bright sky. */}
        <span className="t-tile__scrim" aria-hidden="true" />

        {place.rating !== undefined && (
          <span className="t-tile__rating">
            <Icon name="star" size={12} filled />
            {place.rating.toFixed(1)}
          </span>
        )}

        <SaveButton placeId={place.id} placeName={place.name} />

        <span className="t-tile__caption">
          <span className="t-tile__name t-truncate">{place.name}</span>
          <span className="t-tile__meta t-truncate">
            {distance ? `${category} · ${distance}` : category}
          </span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={`/place/${place.id}`}
      className={`t-place${variant === "rail" ? "" : " t-place--grid"}`}
    >
      <div className="t-place__media">
        <PlaceImage
          src={place.image}
          alt={place.name}
          className="t-place__img"
          categoryId={place.categoryId}
          sizes="(min-width: 1100px) 240px, (min-width: 720px) 33vw, 45vw"
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
