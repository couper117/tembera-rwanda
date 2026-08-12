"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { categoryIcon } from "@/components/ui/categoryIcon";
import EmptyState from "@/components/ui/EmptyState";
import PlaceRow from "@/components/ui/PlaceRow";
import { useLocation } from "@/lib/client/location";
import {
  clearRecentSearches,
  pushRecentSearch,
  readRecentSearches,
} from "@/lib/client/recentSearches";
import { distanceKm } from "@/lib/places/geo";
import { SUGGESTED_SEARCHES, searchPlaces } from "@/lib/places/search";
import { CATEGORY_GROUPS, getGroup } from "@/lib/places/taxonomy";
import type { Place } from "@/lib/places/types";

interface Props {
  /** Slim copy of the catalog — enough to search and render rows. */
  index: Place[];
  initialQuery: string;
}

/**
 * Search runs entirely on the device against a slim index handed down by the
 * server, so results update as you type with no network round-trip. The URL is
 * kept in sync (debounced) so a search can be shared or reloaded.
 */
export default function SearchScreen({ index, initialQuery }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { origin, coords } = useLocation();

  const [query, setQuery] = useState(initialQuery);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => setRecent(readRecentSearches()), []);

  // Focus straight into the field — the user tapped "search" to get here.
  useEffect(() => {
    if (!initialQuery) inputRef.current?.focus();
  }, [initialQuery]);

  // Keep the address bar in step without a navigation per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search";
      router.replace(next, { scroll: false });
    }, 400);
    return () => clearTimeout(timer);
  }, [query, router]);

  const trimmed = query.trim();

  const result = useMemo(
    () => (trimmed ? searchPlaces(index, trimmed, { origin, limit: 60 }) : null),
    [index, trimmed, origin],
  );

  // Shown on the empty state: the closest handful of places to the user.
  const nearby = useMemo(() => {
    return index
      .filter((p) => p.lat !== undefined && p.lng !== undefined)
      .map((p) => ({
        place: p,
        km: distanceKm(origin, { lat: p.lat!, lng: p.lng! }),
      }))
      .sort((a, b) => a.km - b.km)
      .slice(0, 5)
      .map((x) => x.place);
  }, [index, origin]);

  function commit(value: string) {
    const next = value.trim();
    setQuery(next);
    if (next) setRecent(pushRecentSearch(next));
  }

  return (
    <>
      {/* ------------------------------------------------ search bar ---- */}
      <header className="t-header t-header--bordered">
        <button
          type="button"
          className="t-iconbtn"
          aria-label="Go back"
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
        >
          <Icon name="arrowLeft" size={21} />
        </button>

        <form
          role="search"
          style={{ flex: 1, minWidth: 0 }}
          onSubmit={(event) => {
            event.preventDefault();
            commit(query);
            inputRef.current?.blur();
          }}
        >
          <label className="t-field" style={{ height: 42 }}>
            <span className="t-sr">Search places in Rwanda</span>
            <Icon name="search" size={18} />
            <input
              ref={inputRef}
              className="t-field__input"
              type="search"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              placeholder="Search places, restaurants, hotels…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <button
                type="button"
                className="t-iconbtn"
                style={{ width: 28, height: 28 }}
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
              >
                <Icon name="close" size={16} />
              </button>
            )}
          </label>
        </form>
      </header>

      <main className="t-main">
        <div className="t-page">
          {/* ------------------------------------------- idle state ---- */}
          {!trimmed && (
            <div className="t-stack-6" style={{ paddingTop: "var(--t-4)" }}>
              {recent.length > 0 && (
                <section>
                  <div className="t-sectionhead">
                    <h2 className="t-heading">Recent</h2>
                    <button
                      type="button"
                      className="t-sectionhead__link"
                      onClick={() => {
                        clearRecentSearches();
                        setRecent([]);
                      }}
                    >
                      Clear
                    </button>
                  </div>
                  <div className="t-list">
                    {recent.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className="t-row"
                        style={{ textAlign: "left" }}
                        onClick={() => commit(item)}
                      >
                        <span className="t-row__chev">
                          <Icon name="clock" size={18} />
                        </span>
                        <span className="t-row__body t-row__name">{item}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h2 className="t-heading" style={{ marginBottom: "var(--t-3)" }}>
                  Try searching
                </h2>
                <div className="t-inline t-wrap">
                  {SUGGESTED_SEARCHES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="t-chip"
                      onClick={() => commit(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="t-heading" style={{ marginBottom: "var(--t-3)" }}>
                  Browse categories
                </h2>
                <div className="t-inline t-wrap">
                  {CATEGORY_GROUPS.map((group) => (
                    <Link key={group.id} href={`/c/${group.id}`} className="t-chip">
                      <Icon name={categoryIcon(group.id)} size={15} />
                      {group.label}
                    </Link>
                  ))}
                </div>
              </section>

              {nearby.length > 0 && (
                <section>
                  <h2 className="t-heading" style={{ marginBottom: "var(--t-2)" }}>
                    {coords ? "Closest to you" : "Around Kigali"}
                  </h2>
                  <div className="t-list">
                    {nearby.map((place) => (
                      <PlaceRow key={place.id} place={place} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ---------------------------------------------- results ---- */}
          {result && result.total > 0 && (
            <div style={{ paddingTop: "var(--t-4)" }}>
              <ResultSummary
                total={result.total}
                categoryId={result.parsed.categoryId}
                subcategory={result.parsed.subcategory}
                city={result.parsed.city}
              />
              <div className="t-list t-fadein">
                {result.places.map((place) => (
                  <PlaceRow key={place.id} place={place} />
                ))}
              </div>
              {result.total > result.places.length && (
                <p className="t-small t-muted" style={{ textAlign: "center", padding: "var(--t-5) 0" }}>
                  Showing the first {result.places.length} of {result.total}. Add a
                  city or category to narrow it down.
                </p>
              )}
            </div>
          )}

          {/* ------------------------------------------------ empty ---- */}
          {result && result.total === 0 && (
            <NoResults
              query={trimmed}
              parsedCity={result.parsed.city}
              parsedCategoryId={result.parsed.categoryId}
              parsedSubcategory={result.parsed.subcategory}
              onClear={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
            />
          )}
        </div>
      </main>
    </>
  );
}

/** "7 results · ATMs in Kigali" */
function ResultSummary({
  total,
  categoryId,
  subcategory,
  city,
}: {
  total: number;
  categoryId?: string;
  subcategory?: string;
  city?: string;
}) {
  const group = categoryId ? getGroup(categoryId) : undefined;
  // The subcategory is the more specific of the two, so prefer it.
  const parts = [subcategory ?? group?.title, city && `in ${city}`].filter(Boolean);

  return (
    <p className="t-small t-muted" style={{ marginBottom: "var(--t-2)" }}>
      {total} {total === 1 ? "result" : "results"}
      {parts.length > 0 && ` · ${parts.join(" ")}`}
    </p>
  );
}

/**
 * Empty results are a product surface, not a dead end: say what happened, and
 * always offer the next-widest search that will actually return something.
 */
function NoResults({
  query,
  parsedCity,
  parsedCategoryId,
  parsedSubcategory,
  onClear,
}: {
  query: string;
  parsedCity?: string;
  parsedCategoryId?: string;
  parsedSubcategory?: string;
  onClear: () => void;
}) {
  const group = parsedCategoryId ? getGroup(parsedCategoryId) : undefined;
  const what = parsedSubcategory?.toLowerCase() ?? group?.label.toLowerCase();

  // The commonest miss is a category that exists but not in the city asked for.
  if (group && what && parsedCity) {
    return (
      <EmptyState
        icon="search"
        title={`No ${what} listed in ${parsedCity}`}
        text="Tembera doesn't have anything in that category there yet. Try the whole country, or a different category in that city."
        actions={[
          {
            label: `All ${what}`,
            href: parsedSubcategory
              ? `/c/${group.id}?type=${encodeURIComponent(parsedSubcategory)}`
              : `/c/${group.id}`,
            variant: "primary",
          },
          { label: `Everything in ${parsedCity}`, href: `/city/${encodeURIComponent(parsedCity)}` },
        ]}
      />
    );
  }

  // A subcategory the taxonomy defines but the data doesn't fill yet.
  if (group && parsedSubcategory) {
    return (
      <EmptyState
        icon="sparkle"
        title={`No ${what} listed yet`}
        text={`Tembera doesn't have any ${what} in the guide so far. The rest of ${group.title.toLowerCase()} is still browsable.`}
        actions={[
          { label: `Browse ${group.title}`, href: `/c/${group.id}`, variant: "primary" },
          { label: "Clear search", onClick: onClear },
        ]}
      />
    );
  }

  return (
    <EmptyState
      icon="search"
      title="We couldn't find anything matching that"
      text={`Nothing in the guide matches “${query}”. Check the spelling, or explore a category instead.`}
      actions={[
        { label: "Browse categories", href: "/explore", variant: "primary" },
        { label: "Clear search", onClick: onClear },
      ]}
    />
  );
}
