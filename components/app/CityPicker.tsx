"use client";

import { useRef, useState } from "react";
import Icon from "@/components/Icon";
import Popover from "@/components/ui/Popover";
import Spinner from "@/components/ui/Spinner";
import { useLocation } from "@/lib/client/location";
import { DISTRICT_CENTRES, KIGALI_DISTRICTS } from "@/lib/places/geo";

/**
 * The actual location controls — grant access, or pick a city. Shared by the
 * header's dropdown (below) and the mobile "Browse categories" sheet, which
 * embeds this directly rather than nesting another modal inside itself.
 */
export function LocationPickerBody({ onPicked }: { onPicked?: () => void }) {
  const { status, requestLocation, setCity, chosenCity, coords } = useLocation();

  const cities = [
    "Kigali",
    ...Object.keys(DISTRICT_CENTRES)
      .filter((d) => !KIGALI_DISTRICTS.includes(d))
      .sort(),
  ];

  return (
    <div className="t-stack-3">
      <button
        type="button"
        className="t-btn t-btn--primary t-btn--block"
        onClick={() => {
          requestLocation();
          setCity(null);
        }}
        disabled={status === "locating"}
      >
        {status === "locating" ? (
          <>
            <Spinner size={17} tone="current" label="Finding your location" />
            Finding you…
          </>
        ) : (
          <>
            <Icon name="navigate" size={18} />
            Use my current location
          </>
        )}
      </button>

      {status === "denied" && (
        <div className="t-notice t-notice--danger">
          <span className="t-notice__icon">
            <Icon name="alert" size={18} />
          </span>
          <div className="t-notice__body">
            <div className="t-notice__title">Location access is blocked</div>
            Allow location for this site in your browser settings, or pick a
            city below.
          </div>
        </div>
      )}

      {status === "unavailable" && (
        <div className="t-notice">
          <span className="t-notice__icon">
            <Icon name="info" size={18} />
          </span>
          <div className="t-notice__body">
            We couldn&apos;t read your location. Pick a city instead.
          </div>
        </div>
      )}

      {coords && (
        <div className="t-notice">
          <span className="t-notice__icon">
            <Icon name="check" size={18} />
          </span>
          <div className="t-notice__body">
            Using your current location for distances.
          </div>
        </div>
      )}

      <div>
        <p className="t-label" style={{ marginBottom: "var(--t-2)" }}>
          Or choose a city
        </p>
        <div className="t-list">
          {cities.map((city) => {
            const selected = chosenCity === city && !coords;
            return (
              <button
                key={city}
                type="button"
                className="t-row"
                style={{ textAlign: "left" }}
                onClick={() => {
                  setCity(city);
                  onPicked?.();
                }}
              >
                <span className="t-row__body t-row__name">{city}</span>
                {selected && (
                  <span style={{ color: "var(--t-accent)" }}>
                    <Icon name="check" size={18} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * The header's location chip. Clicking it drops the picker directly under
 * the button — a quick switch shouldn't take over the whole screen.
 */
export default function CityPicker() {
  const [open, setOpen] = useState(false);
  const { originLabel } = useLocation();
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="t-chip"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Icon name="pin" size={15} />
        <span className="t-truncate" style={{ maxWidth: 110 }}>
          {originLabel}
        </span>
      </button>

      <Popover open={open} anchorRef={buttonRef} onClose={() => setOpen(false)}>
        <p className="t-label" style={{ marginBottom: "var(--t-3)" }}>
          Set your location
        </p>
        <LocationPickerBody onPicked={() => setOpen(false)} />
      </Popover>
    </>
  );
}
