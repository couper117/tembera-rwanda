"use client";

import { useEffect } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";

/**
 * Catches render/data failures anywhere in the app shell. Users see a plain
 * explanation and a retry; the technical detail goes to the console, never to
 * the screen.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Tembera app error:", error);
  }, [error]);

  return (
    <main className="t-main">
      <div className="t-page">
        <div className="t-state">
          <span
            className="t-state__icon"
            style={{ background: "var(--t-danger-soft)", color: "var(--t-danger)" }}
          >
            <Icon name="alert" size={26} />
          </span>
          <h1 className="t-title">Something went wrong</h1>
          <p className="t-state__text">
            We couldn&apos;t load this screen. It&apos;s usually temporary — try
            again, or head back and pick a different place.
          </p>
          <div className="t-state__actions">
            <button type="button" className="t-btn t-btn--primary t-btn--sm" onClick={reset}>
              <Icon name="refresh" size={16} />
              Try again
            </button>
            <Link href="/" className="t-btn t-btn--secondary t-btn--sm">
              Go home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
