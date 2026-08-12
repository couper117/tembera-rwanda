"use client";

import { useMemo } from "react";
import AppHeader from "@/components/app/AppHeader";
import PlaceBrowser from "@/components/browse/PlaceBrowser";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import { useSaved } from "@/lib/client/saved";
import type { Place } from "@/lib/places/types";

export default function SavedScreen({ index }: { index: Place[] }) {
  const { ids, ready, clear } = useSaved();

  const places = useMemo(() => {
    const byId = new Map(index.map((p) => [p.id, p]));
    // Keep the user's ordering (most recently saved first) and drop any ids
    // that no longer resolve, e.g. after a catalog change.
    return ids.map((id) => byId.get(id)).filter((p): p is Place => Boolean(p));
  }, [ids, index]);

  return (
    <>
      <AppHeader />

      <main className="t-main">
        <div className="t-page">
          <div className="t-section">
            <h1 className="t-display">Saved</h1>
            <p className="t-small t-muted" style={{ marginTop: 4 }}>
              {ready && places.length > 0
                ? `${places.length} ${places.length === 1 ? "place" : "places"} · stored on this device`
                : "Stored on this device"}
            </p>
          </div>

          <div style={{ marginTop: "var(--t-5)" }}>
            {!ready ? (
              <SkeletonGrid count={4} />
            ) : places.length === 0 ? (
              <EmptyState
                icon="bookmark"
                title="Nothing saved yet"
                text="Tap the bookmark on any place to keep it here. Saves live in this browser — they aren't tied to an account."
                actions={[
                  { label: "Explore places", href: "/explore", variant: "primary" },
                  { label: "Search", href: "/search" },
                ]}
              />
            ) : (
              <>
                <PlaceBrowser
                  places={places}
                  showFilters={false}
                  emptyTitle="Nothing saved yet"
                />
                <div style={{ display: "flex", justifyContent: "center", paddingTop: "var(--t-6)" }}>
                  <button type="button" className="t-btn t-btn--ghost t-btn--sm" onClick={clear}>
                    Clear all saved places
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
