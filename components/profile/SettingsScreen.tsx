"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/app/PageHeader";
import Icon from "@/components/Icon";
import Spinner from "@/components/ui/Spinner";
import { useLocation } from "@/lib/client/location";
import { clearRecentSearches, readRecentSearches } from "@/lib/client/recentSearches";
import { useSaved } from "@/lib/client/saved";
import { useVisited } from "@/lib/client/visited";

/**
 * Everything that actually changes how the app behaves: where distances are
 * measured from, and the data held in this browser. Profile keeps the things
 * you *look at*; this screen holds the switches.
 */
export default function SettingsScreen() {
  const { originLabel, status, requestLocation, coords, chosenCity, setCity } =
    useLocation();
  const { ids, clear, ready } = useSaved();
  const { visits, clear: clearVisited } = useVisited();
  const [recentCount, setRecentCount] = useState(0);
  const visitedCount = visits.length;

  useEffect(() => {
    setRecentCount(readRecentSearches().length);
  }, []);

  return (
    <>
      <PageHeader title="Settings" fallbackHref="/profile" />

      <main className="t-main">
        <div className="t-page" style={{ maxWidth: 620 }}>
          <div className="t-section">
            <h1 className="t-display">Settings</h1>
          </div>

          {/* ------------------------------------------------ location -- */}
          <section className="t-section">
            <h2 className="t-label" style={{ marginBottom: "var(--t-2)" }}>
              Location
            </h2>
            <div className="t-card">
              <div className="t-fact" style={{ padding: "var(--t-3) var(--t-4)" }}>
                <span className="t-fact__icon">
                  <Icon name="pin" size={17} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="t-fact__label">Distances measured from</span>
                  <span className="t-fact__value" style={{ display: "block" }}>
                    {originLabel}
                  </span>
                </span>
              </div>

              <div style={{ padding: "0 var(--t-4) var(--t-4)" }} className="t-stack-2">
                {!coords && (
                  <button
                    type="button"
                    className="t-btn t-btn--secondary t-btn--sm t-btn--block"
                    onClick={requestLocation}
                    disabled={status === "locating" || status === "denied"}
                  >
                    {status === "locating" ? (
                      <>
                        <Spinner size={16} tone="current" label="Finding your location" />
                        Finding you…
                      </>
                    ) : (
                      <>
                        <Icon name="navigate" size={16} />
                        {status === "denied"
                          ? "Location is blocked in your browser"
                          : "Use my current location"}
                      </>
                    )}
                  </button>
                )}

                {(coords || chosenCity) && (
                  <button
                    type="button"
                    className="t-btn t-btn--ghost t-btn--sm t-btn--block"
                    onClick={() => setCity(null)}
                  >
                    Reset to Kigali
                  </button>
                )}
              </div>
            </div>
            <p className="t-small t-muted" style={{ marginTop: "var(--t-2)" }}>
              You can also change the city from the pin in the header. Tembera
              never asks for your location on its own — only when you tap.
            </p>
          </section>

          {/* ---------------------------------------------------- data -- */}
          <section className="t-section">
            <h2 className="t-label" style={{ marginBottom: "var(--t-2)" }}>
              Data on this device
            </h2>
            <div className="t-card" style={{ padding: "var(--t-4)" }}>
              <p className="t-small t-muted" style={{ marginBottom: "var(--t-3)" }}>
                Your profile, saved places ({ready ? ids.length : 0}), visited
                places ({visitedCount}) and recent searches ({recentCount}) are
                stored in this browser. Nothing is sent to a server, and there
                is no account to sync them to.
              </p>
              <div className="t-inline t-wrap">
                <button
                  type="button"
                  className="t-btn t-btn--secondary t-btn--sm"
                  onClick={clear}
                  disabled={!ready || ids.length === 0}
                >
                  Clear saved places
                </button>
                <button
                  type="button"
                  className="t-btn t-btn--secondary t-btn--sm"
                  onClick={() => {
                    clearRecentSearches();
                    setRecentCount(0);
                  }}
                  disabled={recentCount === 0}
                >
                  Clear recent searches
                </button>
                <button
                  type="button"
                  className="t-btn t-btn--secondary t-btn--sm"
                  onClick={clearVisited}
                  disabled={visitedCount === 0}
                >
                  Clear visit history
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
