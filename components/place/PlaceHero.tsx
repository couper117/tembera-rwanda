import Link from "next/link";
import Icon from "@/components/Icon";
import PlaceImage from "@/components/ui/PlaceImage";
import { directionsFor } from "@/lib/places/directions";
import type { Place } from "@/lib/places/types";

/**
 * The top of a place page.
 *
 * The old hero was a letterboxed strip with the name below it, which told you
 * almost nothing before you scrolled. This is the thing a person actually
 * needs on arrival: is this the right place, is it any good, where is it, and
 * how do I get there or call them.
 *
 * The image carries the text rather than sitting above it, so the fold does
 * the work of a printed cover. On a memorial the rating and the actions are
 * absent entirely — see the sensitive-category rule.
 */
export default function PlaceHero({
  place,
  categoryTitle,
  isSensitive,
  photoCount,
  openLabel,
  isOpen,
}: {
  place: Place;
  categoryTitle: string;
  isSensitive: boolean;
  photoCount: number;
  openLabel: string | null;
  isOpen: boolean | null;
}) {
  const directions = directionsFor(place);

  return (
    <header className={`t-hero${isSensitive ? " t-hero--quiet" : ""}`}>
      <div className="t-hero__media">
        <PlaceImage
          src={place.image}
          alt={place.name}
          categoryId={place.categoryId}
          sizes="100vw"
          eager
        />
        <div className="t-hero__scrim" aria-hidden="true" />

        {photoCount > 1 && (
          <a href="#photos" className="t-hero__count">
            <Icon name="image" size={15} />
            {photoCount} photos
          </a>
        )}
      </div>

      <div className="t-hero__body">
        <div className="t-hero__badges">
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

        <h1 className="t-hero__name">{place.name}</h1>

        <div className="t-hero__meta">
          {/* A rating out of five is never shown for a place of remembrance. */}
          {!isSensitive && place.rating !== undefined && (
            <span className="t-rating t-rating--lg">
              <Icon name="star" size={16} filled />
              {place.rating.toFixed(1)}
            </span>
          )}

          {isOpen !== null && openLabel && (
            <span className={`t-openstate${isOpen ? " t-openstate--on" : ""}`}>
              <span className="t-openstate__dot" aria-hidden="true" />
              {openLabel}
            </span>
          )}

          <span className="t-hero__where">
            <Icon name="pin" size={15} />
            {place.area ? `${place.area}, ${place.city}` : place.city}
          </span>
        </div>

        {!isSensitive && (
          <div className="t-hero__actions">
            {/* Hidden on a phone: the sticky action bar carries Directions
                there, and two of the same button on one screen pushed Call
                and Website onto a second row for nothing. */}
            {directions &&
              (directions.external ? (
                <a
                  href={directions.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="t-btn t-btn--primary t-hero__act--dup"
                >
                  <Icon name="navigate" size={16} />
                  Directions
                </a>
              ) : (
                <Link
                  href={directions.href}
                  className="t-btn t-btn--primary t-hero__act--dup"
                >
                  <Icon name="navigate" size={16} />
                  Directions
                </Link>
              ))}
            {place.phone && (
              <a
                href={`tel:${place.phone.replace(/\s/g, "")}`}
                className="t-btn t-btn--secondary"
              >
                <Icon name="phone" size={16} />
                Call
              </a>
            )}
            {place.website && (
              <a
                href={place.website}
                target="_blank"
                rel="noopener noreferrer"
                className="t-btn t-btn--secondary"
              >
                <Icon name="external" size={16} />
                Website
              </a>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
