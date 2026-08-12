"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Icon from "@/components/Icon";
import EmptyState, { type StateAction } from "@/components/ui/EmptyState";
import PlaceCard from "@/components/ui/PlaceCard";
import PlaceRow from "@/components/ui/PlaceRow";
import { useLocation } from "@/lib/client/location";
import { distanceKm } from "@/lib/places/geo";
import type { Place } from "@/lib/places/types";

type SortKey = "distance" | "rating" | "name";
type ViewKey = "grid" | "list";

interface Props {
  places: Place[];
  /** Shown when the incoming list is empty. */
  emptyTitle: string;
  emptyText?: string;
  emptyActions?: StateAction[];
  /** Hides both filter rows (e.g. on Saved, where categories are mixed). */
  showFilters?: boolean;
  /**
   * Subcategories the parent category defines, in taxonomy order, so the chips
   * read consistently rather than in whatever order the data happens to be in.
   */
  subcategoryOrder?: string[];
  /** Subcategory selected on load, from the `?type=` query parameter. */
  initialSubcategory?: string | null;
  /**
   * When set, changing the subcategory chip rewrites `?type=` on this path so
   * the filtered view is linkable and survives a refresh.
   */
  syncPath?: string;
  initialView?: ViewKey;
}

const PAGE = 24;

/**
 * The shared listing surface behind category, city and saved screens.
 *
 * Two levels of filter: subcategory (taxonomy) then subtype (a finer label the
 * source data already carried, such as a denomination). The second row only
 * appears when it would actually narrow anything.
 */
export default function PlaceBrowser({
  places,
  emptyTitle,
  emptyText,
  emptyActions,
  showFilters = true,
  subcategoryOrder,
  initialSubcategory = null,
  syncPath,
  initialView = "grid",
}: Props) {
  const router = useRouter();
  const { origin, originLabel, coords } = useLocation();

  const [subcategory, setSubcategory] = useState<string | null>(initialSubcategory);
  const [subtype, setSubtype] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("distance");
  const [view, setView] = useState<ViewKey>(initialView);
  const [shown, setShown] = useState(PAGE);

  /* --------------------------------------------------------- filter sets */

  const subcategories = useMemo(() => {
    if (!showFilters) return [];
    const counts = new Map<string, number>();
    for (const place of places) {
      counts.set(place.subcategory, (counts.get(place.subcategory) ?? 0) + 1);
    }
    const entries = [...counts.entries()].map(([name, count]) => ({ name, count }));

    if (subcategoryOrder) {
      const rank = new Map(subcategoryOrder.map((name, i) => [name, i]));
      entries.sort((a, b) => (rank.get(a.name) ?? 99) - (rank.get(b.name) ?? 99));
    } else {
      entries.sort((a, b) => b.count - a.count);
    }
    return entries;
  }, [places, showFilters, subcategoryOrder]);

  // Subtypes within the current subcategory, and only when they add signal.
  const subtypes = useMemo(() => {
    if (!showFilters) return [];
    const scope = subcategory
      ? places.filter((p) => p.subcategory === subcategory)
      : places;

    const counts = new Map<string, number>();
    for (const place of scope) {
      if (!place.subtype || place.subtype === place.subcategory) continue;
      counts.set(place.subtype, (counts.get(place.subtype) ?? 0) + 1);
    }
    if (counts.size < 2) return [];
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [places, subcategory, showFilters]);

  /* ------------------------------------------------------------- results */

  const visible = useMemo(() => {
    let filtered = places;
    if (subcategory) filtered = filtered.filter((p) => p.subcategory === subcategory);
    if (subtype) filtered = filtered.filter((p) => p.subtype === subtype);

    const sorted = [...filtered];
    if (sort === "distance") {
      sorted.sort((a, b) => distanceOf(a, origin) - distanceOf(b, origin));
    } else if (sort === "rating") {
      // Unrated places sink rather than randomly interleaving.
      sorted.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [places, subcategory, subtype, sort, origin]);

  function chooseSubcategory(next: string | null) {
    setSubcategory(next);
    setSubtype(null);
    setShown(PAGE);
    if (syncPath) {
      router.replace(next ? `${syncPath}?type=${encodeURIComponent(next)}` : syncPath, {
        scroll: false,
      });
    }
  }

  if (places.length === 0) {
    return <EmptyState icon="pin" title={emptyTitle} text={emptyText} actions={emptyActions} />;
  }

  const page = visible.slice(0, shown);

  return (
    <>
      {/* --------------------------------------------------- controls -- */}
      <div className="t-stack-3" style={{ marginBottom: "var(--t-4)" }}>
        {subcategories.length > 1 && (
          <div className="t-chiprow">
            <button
              type="button"
              className="t-chip"
              aria-pressed={subcategory === null}
              onClick={() => chooseSubcategory(null)}
            >
              All
              <span className="t-chip__count">{places.length}</span>
            </button>
            {subcategories.map((item) => (
              <button
                key={item.name}
                type="button"
                className="t-chip"
                aria-pressed={subcategory === item.name}
                onClick={() => chooseSubcategory(item.name === subcategory ? null : item.name)}
              >
                {item.name}
                <span className="t-chip__count">{item.count}</span>
              </button>
            ))}
          </div>
        )}

        {subtypes.length > 0 && (
          <div className="t-chiprow">
            <button
              type="button"
              className="t-chip t-chip--sm"
              aria-pressed={subtype === null}
              onClick={() => {
                setSubtype(null);
                setShown(PAGE);
              }}
            >
              Any type
            </button>
            {subtypes.map((item) => (
              <button
                key={item.name}
                type="button"
                className="t-chip t-chip--sm"
                aria-pressed={subtype === item.name}
                onClick={() => {
                  setSubtype(item.name === subtype ? null : item.name);
                  setShown(PAGE);
                }}
              >
                {item.name}
                <span className="t-chip__count">{item.count}</span>
              </button>
            ))}
          </div>
        )}

        <div className="t-inline">
          <label className="t-inline" style={{ gap: 6 }}>
            <span className="t-sr">Sort by</span>
            <Icon name="sliders" size={16} style={{ color: "var(--t-ink-3)" }} />
            <select
              className="t-select"
              style={{ height: 38, fontSize: "var(--t-text-small)" }}
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
            >
              <option value="distance">
                {coords ? "Nearest to you" : `Nearest to ${originLabel}`}
              </option>
              <option value="rating">Top rated</option>
              <option value="name">A–Z</option>
            </select>
          </label>

          <span className="t-spacer" />

          <span className="t-small t-muted t-show-desktop" style={{ marginRight: "var(--t-2)" }}>
            {visible.length} {visible.length === 1 ? "place" : "places"}
          </span>

          <div className="t-inline" style={{ gap: 2 }} role="group" aria-label="View">
            <button
              type="button"
              className={`t-iconbtn${view === "grid" ? " t-iconbtn--active" : ""}`}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
            >
              <Icon name="grid" size={18} />
            </button>
            <button
              type="button"
              className={`t-iconbtn${view === "list" ? " t-iconbtn--active" : ""}`}
              aria-label="List view"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              <Icon name="list" size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- results -- */}
      {visible.length === 0 ? (
        <EmptyState
          icon="search"
          title={`Nothing under ${subtype ?? subcategory}`}
          text="No listing in this category matches that filter yet."
          actions={[
            {
              label: "Clear filters",
              onClick: () => {
                chooseSubcategory(null);
              },
              variant: "primary",
            },
          ]}
        />
      ) : view === "grid" ? (
        <div className="t-grid">
          {page.map((place) => (
            <PlaceCard key={place.id} place={place} variant="grid" />
          ))}
        </div>
      ) : (
        <div className="t-list">
          {page.map((place) => (
            <PlaceRow key={place.id} place={place} />
          ))}
        </div>
      )}

      {shown < visible.length && (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--t-6) 0" }}>
          <button
            type="button"
            className="t-btn t-btn--secondary"
            onClick={() => setShown((n) => n + PAGE)}
          >
            Show more ({visible.length - shown} left)
          </button>
        </div>
      )}
    </>
  );
}

function distanceOf(place: Place, origin: { lat: number; lng: number }): number {
  if (place.lat === undefined || place.lng === undefined) return Infinity;
  return distanceKm(origin, { lat: place.lat, lng: place.lng });
}
