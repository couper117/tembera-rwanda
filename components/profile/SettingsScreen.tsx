"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PageHeader from "@/components/app/PageHeader";
import Icon from "@/components/Icon";
import Spinner from "@/components/ui/Spinner";
import { useAccount } from "@/lib/client/account";
import { useLocation } from "@/lib/client/location";
import { clearRecentSearches, readRecentSearches } from "@/lib/client/recentSearches";
import { useSaved } from "@/lib/client/saved";
import { useTheme } from "@/lib/client/theme";
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
  const { account, authed } = useAccount();
  const { theme, toggleTheme } = useTheme();
  const [recentCount, setRecentCount] = useState(0);
  const visitedCount = visits.length;

  useEffect(() => {
    setRecentCount(readRecentSearches().length);
  }, []);

  return (
    <>
      <PageHeader title="Settings" fallbackHref="/profile" />

      <main className="t-main">
        {/* Same rail-offset problem as Profile, smaller correction — Settings
            is rows and toggles, not cards, so it doesn't need Profile's full
            960px to avoid looking thin, just enough to close the worst of
            the gap next to the rail on a real desktop screen. */}
        <div className="t-page" style={{ maxWidth: 760 }}>
          <div className="t-section">
            <h1 className="t-display">Settings</h1>
          </div>

          {/* ------------------------------------------------- account -- */}
          <section className="t-section">
            <h2 className="t-label" style={{ marginBottom: "var(--t-2)" }}>
              Account
            </h2>
            <div className="t-card" style={{ padding: "var(--t-4)" }}>
              {authed ? (
                <>
                  <div className="t-fact" style={{ padding: 0, marginBottom: "var(--t-3)" }}>
                    <span className="t-fact__icon t-fact__icon--accent">
                      <Icon name="user" size={17} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="t-fact__value" style={{ display: "block" }}>
                        {account.name}
                      </span>
                      <span className="t-fact__label">{account.email}</span>
                    </span>
                  </div>
                  <form action="/logout" method="post">
                    <button
                      type="submit"
                      className="t-btn t-btn--secondary t-btn--sm t-btn--block"
                    >
                      <Icon name="external" size={16} />
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <p className="t-small t-muted" style={{ marginBottom: "var(--t-3)" }}>
                    You&apos;re browsing as a guest. Sign in to sync your saved places,
                    visits and reviews across devices.
                  </p>
                  <div className="t-inline t-wrap">
                    <Link href="/login" className="t-btn t-btn--primary t-btn--sm">
                      Sign in
                    </Link>
                    <Link href="/register" className="t-btn t-btn--secondary t-btn--sm">
                      Create account
                    </Link>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* --------------------------------------------------- theme -- */}
          <section className="t-section">
            <h2 className="t-label" style={{ marginBottom: "var(--t-2)" }}>
              Appearance
            </h2>
            <div className="t-card" style={{ padding: "var(--t-1) var(--t-4)" }}>
              <div className="t-fact" style={{ padding: "var(--t-3) 0" }}>
                <span className="t-fact__icon t-fact__icon--accent">
                  <Icon name={theme === "dark" ? "moon" : "sun"} size={17} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="t-fact__value" style={{ display: "block" }}>
                    Dark mode
                  </span>
                  <span className="t-small t-muted">{theme === "dark" ? "On" : "Off"}</span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={theme === "dark"}
                  aria-label="Dark mode"
                  className="t-toggle"
                  onClick={toggleTheme}
                >
                  <span className="t-toggle__knob" aria-hidden="true">
                    <Icon name={theme === "dark" ? "moon" : "sun"} size={13} />
                  </span>
                </button>
              </div>
            </div>
          </section>

          {/* ------------------------------------------------ location -- */}
          <section className="t-section">
            <h2 className="t-label" style={{ marginBottom: "var(--t-2)" }}>
              Location
            </h2>
            <div className="t-card">
              <div className="t-fact" style={{ padding: "var(--t-3) var(--t-4)" }}>
                <span className="t-fact__icon t-fact__icon--accent">
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
                {authed
                  ? `Your saved places (${ready ? ids.length : 0}) and visited places (${visitedCount}) are synced to your account. Recent searches (${recentCount}) stay in this browser.`
                  : `Your profile, saved places (${ready ? ids.length : 0}), visited places (${visitedCount}) and recent searches (${recentCount}) are stored in this browser. Sign in to sync them to an account.`}
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
