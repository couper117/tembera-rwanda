"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/Icon";
import { directionsFor } from "@/lib/places/directions";
import { useSaved } from "@/lib/client/saved";
import type { Place } from "@/lib/places/types";

interface Props {
  place: Place;
  /** "bar" is the sticky mobile footer; "panel" is the desktop side column. */
  variant: "bar" | "panel";
}

export default function PlaceActions({ place, variant }: Props) {
  const { isSaved, toggle, ready } = useSaved();
  const [shareState, setShareState] = useState<"idle" | "copied" | "failed">("idle");

  const saved = isSaved(place.id);
  const directions = directionsFor(place);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const data = { title: place.name, text: `${place.name} on Tembera`, url };

    // Native share sheet where available, clipboard everywhere else.
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch (error) {
        // A user cancelling the sheet is not a failure — say nothing.
        if ((error as Error)?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareState("copied");
    } catch {
      setShareState("failed");
    }
    setTimeout(() => setShareState("idle"), 2200);
  }

  const shareLabel =
    shareState === "copied" ? "Link copied" : shareState === "failed" ? "Couldn't copy" : "Share";

  if (variant === "bar") {
    return (
      <div className="t-actionbar">
        {directions ? (
          <DirectionsLink
            to={directions}
            className="t-btn t-btn--primary"
            style={{ flex: 1 }}
          >
            <Icon name="navigate" size={18} />
            Directions
          </DirectionsLink>
        ) : (
          <span className="t-btn t-btn--secondary" style={{ flex: 1 }} aria-disabled="true">
            No location on file
          </span>
        )}

        <button
          type="button"
          className={`t-btn t-btn--secondary${saved ? " t-save--pop" : ""}`}
          onClick={() => toggle(place.id)}
          disabled={!ready}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Save this place"}
        >
          <Icon name="bookmark" size={18} filled={saved} />
        </button>

        <button
          type="button"
          className="t-btn t-btn--secondary"
          onClick={share}
          aria-label="Share this place"
        >
          <Icon name="share" size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="t-card t-stack-2" style={{ padding: "var(--t-4)" }}>
      {directions ? (
        <DirectionsLink to={directions} className="t-btn t-btn--primary t-btn--block">
          <Icon name="navigate" size={18} />
          Get directions
        </DirectionsLink>
      ) : (
        <p className="t-small t-muted">
          This listing has no coordinates, so we can&apos;t offer directions.
        </p>
      )}

      <button
        type="button"
        className="t-btn t-btn--secondary t-btn--block"
        onClick={() => toggle(place.id)}
        disabled={!ready}
        aria-pressed={saved}
      >
        <Icon name="bookmark" size={18} filled={saved} />
        {saved ? "Saved" : "Save"}
      </button>

      <button type="button" className="t-btn t-btn--secondary t-btn--block" onClick={share}>
        <Icon name="share" size={18} />
        {shareLabel}
      </button>

      {place.phone && (
        <a className="t-btn t-btn--secondary t-btn--block" href={`tel:${place.phone.replace(/\s/g, "")}`}>
          <Icon name="phone" size={18} />
          Call
        </a>
      )}
    </div>
  );
}

/**
 * Routes to our own map, or opens the source's map link in a new tab when a
 * listing has no coordinates of its own.
 */
function DirectionsLink({
  to,
  className,
  style,
  children,
}: {
  to: { href: string; external: boolean };
  className: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  if (to.external) {
    return (
      <a
        className={className}
        style={style}
        href={to.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }
  return (
    <Link className={className} style={style} href={to.href}>
      {children}
    </Link>
  );
}
