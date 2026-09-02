"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon, { type IconName } from "@/components/Icon";
import { categoryColor, resolveIconName } from "@/components/ui/categoryIcon";
import EmptyState from "@/components/ui/EmptyState";
import PlaceImage from "@/components/ui/PlaceImage";
import PlaceRow from "@/components/ui/PlaceRow";
import SaveButton from "@/components/ui/SaveButton";
import Spinner from "@/components/ui/Spinner";
import { useCategories } from "@/lib/client/categories";
import { useLocation } from "@/lib/client/location";
import { isSensitivePlace } from "@/lib/places/engine";
import { distanceKm, formatDistanceFor } from "@/lib/places/geo";
import { externalRoute, fetchRoute, type Route } from "@/lib/places/routing";
import type { Place } from "@/lib/places/types";
import {
  MAX_ZOOM,
  MIN_ZOOM,
  PLACE_ZOOM,
  RWANDA_LATLNG_BOUNDS,
  TILE_ATTRIBUTION,
  TILE_URL,
  pinIcon,
} from "./rwandaMap";
import "leaflet/dist/leaflet.css";

interface Props {
  places: Place[];
}

type MapStatus =
  | "loading"
  | "ready"
  /** Leaflet's chunk never arrived — offline, or a blocked bundle. */
  | "failed";

/**
 * Places the map opens framed on. Every place is plotted, but fitting all of
 * them means opening on the whole country — and with most listings in Kigali
 * that is a wall of pins in one corner. Framing the nearest handful opens
 * somewhere useful; "show all results" and the category filter both refit.
 */
const INITIAL_FIT = 40;

export default function MapScreen({ places }: Props) {
  const { origin, coords, requestLocation, originLabel } = useLocation();
  const categories = useCategories();

  const canvasRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  /** The Leaflet module, once its chunk has arrived. */
  const LRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  /** The drawn route. Ours to draw now that OSRM only returns the geometry. */
  const routeLineRef = useRef<any>(null);
  /** Which pin is currently drawn in its active state, if any. */
  const litRef = useRef<string | null>(null);

  const [status, setStatus] = useState<MapStatus>("loading");
  const [category, setCategory] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routing, setRouting] = useState(false);

  /** Every matching place, nearest first — the rail and the initial framing
   *  both read off the top of this, so the order carries the relevance. */
  const visible = useMemo(() => {
    return places
      .filter(
        (p) =>
          p.lat !== undefined &&
          p.lng !== undefined &&
          (!category || p.categoryId === category),
      )
      .map((p) => ({ place: p, km: distanceKm(origin, { lat: p.lat!, lng: p.lng! }) }))
      .sort((a, b) => a.km - b.km)
      .map((x) => x.place);
  }, [places, category, origin]);

  /** Colour and glyph per category, straight off the live taxonomy so an admin
   *  swapping a category's icon moves its pins with it. The pale `bg` tints the
   *  chip on the place card, so the card echoes the pin you just tapped. */
  const pinStyle = useMemo(() => {
    const styles = new Map<string, { icon: IconName; fg: string; bg: string }>();
    for (const group of categories) {
      const color = categoryColor(group.id);
      styles.set(group.id, {
        icon: resolveIconName(group.icon),
        fg: color.fg,
        bg: color.bg,
      });
    }
    return styles;
  }, [categories]);

  const selected = visible.find((p) => p.id === selectedId) ?? null;

  // Read inside map callbacks that are registered once and must not go stale.
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  /**
   * Frame the current results. Opening on the whole country looks tidy and is
   * useless — nearly every listing is in Kigali, so it renders as one pin in an
   * empty map. Fitting the pins is what a map beside a list is for.
   */
  const fitPlaces = useCallback((limit?: number) => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!map || !L) return;

    // `visible` is nearest-first, so a limit frames the closest results.
    const list = limit ? visibleRef.current.slice(0, limit) : visibleRef.current;
    const points = list.map((place) => [place.lat!, place.lng!] as [number, number]);

    // `maxZoom` is what stops a single result fitting all the way in and
    // dropping the reader into a street with no context around it.
    map.fitBounds(points.length ? L.latLngBounds(points) : RWANDA_LATLNG_BOUNDS, {
      padding: [48, 48],
      maxZoom: PLACE_ZOOM,
    });
  }, []);

  /* ---------------------------------------------------------- map setup */

  useEffect(() => {
    let cancelled = false;

    // Leaflet touches `window` at module scope, so it cannot be imported at
    // the top of a file that Next also renders on the server.
    void import("leaflet")
      .then((mod) => {
        const L = mod.default ?? mod;
        if (cancelled || !canvasRef.current || mapRef.current) return;
        LRef.current = L;

        mapRef.current = L.map(canvasRef.current, {
          center: [-1.94, 29.87],
          zoom: 8,
          minZoom: MIN_ZOOM,
          maxZoom: MAX_ZOOM,
          // Pinch handles zoom on a phone; on a desktop people expect buttons.
          zoomControl: window.matchMedia("(min-width: 1024px)").matches,
          attributionControl: true,
        });

        L.tileLayer(TILE_URL, {
          attribution: TILE_ATTRIBUTION,
          maxZoom: MAX_ZOOM,
        }).addTo(mapRef.current);

        // Frame the results rather than opening on an arbitrary centre+zoom.
        fitPlaces(INITIAL_FIT);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("failed");
      });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // Mount only: fitPlaces reads its list through a ref precisely so this
    // does not have to re-run and rebuild the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------------------------------------------------- place pins */

  // Pins are rebuilt only when the result set itself changes. Selecting or
  // pointing at a place repaints the existing pins in the effect below
  // instead — tearing down and recreating every marker on the map for each
  // click would stutter badly now that the whole catalogue is plotted.
  useEffect(() => {
    const L = LRef.current;
    if (status !== "ready" || !mapRef.current || !L) return;
    const map = mapRef.current;

    for (const marker of markersRef.current) marker.remove();
    markersRef.current = visible.map((place) => {
      const style = pinStyle.get(place.categoryId);
      const marker = L.marker([place.lat!, place.lng!], {
        title: place.name,
        alt: place.name,
        icon: pinIcon(L, { icon: style?.icon, color: style?.fg }),
      }).addTo(map);
      marker.on("click", () => setSelectedId(place.id));
      return marker;
    });
    // Fresh pins are all drawn unlit; the effect below re-lights the current
    // one rather than this pass having to know about selection.
    litRef.current = null;
  }, [visible, status, pinStyle]);

  /**
   * Light the pin for whichever place is selected, or the card currently under
   * the pointer — hovering a card and watching its pin answer is what ties the
   * rail to the map. Only the two pins whose state actually changed are
   * repainted: sweeping all ~500 on every pointer move visibly stutters.
   */
  useEffect(() => {
    const L = LRef.current;
    if (status !== "ready" || !L) return;

    // Selection wins over hover. The rail is the only thing that sets a hover
    // id and it unmounts once a place is selected, so that id can go stale.
    const lit = selectedId ?? hoveredId;
    if (lit === litRef.current) return;

    const paint = (id: string | null, active: boolean) => {
      if (!id) return;
      const i = visible.findIndex((p) => p.id === id);
      const marker = markersRef.current[i];
      if (!marker) return;
      const style = pinStyle.get(visible[i].categoryId);
      marker.setIcon(pinIcon(L, { icon: style?.icon, color: style?.fg, active }));
      marker.setZIndexOffset(active ? 1000 : 0);
    };

    paint(litRef.current, false);
    paint(lit, true);
    litRef.current = lit;
  }, [visible, status, selectedId, hoveredId, pinStyle]);

  /**
   * Changing the filter changes the answer, so the map reframes onto it — a
   * filter that leaves you looking at the wrong part of the country reads as
   * broken. Skipped on the first pass, which the initial fit already covers.
   */
  const didInitialFit = useRef(false);
  useEffect(() => {
    if (status !== "ready") return;
    if (!didInitialFit.current) {
      didInitialFit.current = true;
      return;
    }
    setSelectedId(null);
    fitPlaces();
  }, [category, status, fitPlaces]);

  /** Blue dot for the device position. */
  useEffect(() => {
    const L = LRef.current;
    if (status !== "ready" || !mapRef.current || !L || !coords) return;
    userMarkerRef.current?.remove();
    userMarkerRef.current = L.circleMarker([coords.lat, coords.lng], {
      radius: 8,
      fillColor: "#1a73e8",
      fillOpacity: 1,
      color: "#ffffff",
      weight: 3,
      interactive: false,
    }).addTo(mapRef.current);
  }, [coords, status]);

  /* ------------------------------------------------------------ actions */

  const focus = useCallback((place: Place) => {
    setSelectedId(place.id);
    const map = mapRef.current;
    if (!map || place.lat === undefined || place.lng === undefined) return;
    map.panTo([place.lat, place.lng]);
    if (map.getZoom() < PLACE_ZOOM) map.setZoom(PLACE_ZOOM);
  }, []);

  const recenter = useCallback(() => {
    if (coords) {
      mapRef.current?.panTo([coords.lat, coords.lng]);
      if (mapRef.current?.getZoom() < 13) mapRef.current.setZoom(13);
    } else {
      requestLocation();
    }
  }, [coords, requestLocation]);

  const clearRoute = useCallback(() => {
    routeLineRef.current?.remove();
    routeLineRef.current = null;
    setRoute(null);
    setRouteError(null);
  }, []);

  /** Draws the route on our own map — no hand-off to an external app. */
  const showDirections = useCallback(
    async (place: Place) => {
      const L = LRef.current;
      const map = mapRef.current;
      if (!L || !map || place.lat === undefined || place.lng === undefined) return;

      setRouting(true);
      setRouteError(null);

      const result = await fetchRoute(origin, place);
      setRouting(false);

      if (!result.ok) {
        setRouteError(result.error);
        return;
      }

      routeLineRef.current?.remove();
      const path = result.route.path.map(
        (point: { lat: number; lng: number }) => [point.lat, point.lng] as [number, number],
      );
      routeLineRef.current = L.polyline(path, {
        color: "#11694a",
        weight: 5,
        opacity: 0.9,
      }).addTo(map);

      // Frame the whole trip, not just its end points.
      if (path.length) map.fitBounds(L.latLngBounds(path), { padding: [64, 64] });

      setRoute(result.route);
    },
    [origin],
  );

  /* ---------------------------------------------------------------- UI */

  const filters = (
    <div className="t-chiprow" style={{ padding: "var(--t-3) var(--t-gutter)" }}>
      <button
        type="button"
        className="t-chip"
        aria-pressed={category === null}
        onClick={() => setCategory(null)}
      >
        All
      </button>
      {categories.map((group) => (
        <button
          key={group.id}
          type="button"
          className="t-chip"
          aria-pressed={category === group.id}
          onClick={() => setCategory(group.id === category ? null : group.id)}
        >
          <Icon name={resolveIconName(group.icon)} size={15} />
          {group.label}
        </button>
      ))}
    </div>
  );

  // With no drawable map there is nothing to overlay, so fall back to an
  // ordinary browse page rather than a dead grey rectangle. There is no
  // "no key" case any more — the map needs no account to draw — so the only
  // way here is the bundle genuinely failing to arrive.
  if (status === "failed") {
    return (
      <main className="t-main">
        <div className="t-page">
          <EmptyState
            icon="alert"
            title="The map couldn't load"
            text="Most likely a network problem or a blocker. Everything is still browsable below."
            actions={[
              { label: "Try again", onClick: () => window.location.reload(), variant: "primary" },
            ]}
          />

          {filters}

          <h2 className="t-heading" style={{ margin: "var(--t-4) 0 var(--t-2)" }}>
            Nearest to {originLabel}
          </h2>
          <div className="t-list">
            {visible.slice(0, 40).map((place) => (
              <PlaceRow key={place.id} place={place} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="t-map">
      {/* ---------------------------------------------------- canvas -- */}
      <div className="t-map__stage">
        <div className="t-map__canvas" ref={canvasRef} />

        {status === "loading" && (
          <div className="t-map__canvas" style={{ display: "grid", placeItems: "center" }}>
            <Spinner size={30} label="Loading the map" />
          </div>
        )}

        <div className="t-map__overlay">
          <div className="t-map__filters">{filters}</div>

          {status === "ready" && (
            <div className="t-map__controls">
              <button
                type="button"
                className="t-iconbtn t-iconbtn--solid"
                onClick={recenter}
                aria-label={coords ? "Recentre on my location" : "Use my location"}
              >
                <Icon name="navigate" size={19} />
              </button>
              <button
                type="button"
                className="t-iconbtn t-iconbtn--solid"
                onClick={() => fitPlaces()}
                aria-label="Show all results on the map"
              >
                <Icon name="map" size={19} />
              </button>
            </div>
          )}

          {/* Selected place card + in-app directions. */}
          {status === "ready" && selected && !route && (
            <div className="t-map__sheet">
              <div className="t-mapsheet__hero">
                <PlaceImage
                  src={selected.image}
                  alt=""
                  categoryId={selected.categoryId}
                  sizes="(min-width: 1024px) 420px, 100vw"
                />
                <SaveButton placeId={selected.id} placeName={selected.name} />
                <button
                  type="button"
                  className="t-iconbtn t-iconbtn--solid t-mapsheet__close"
                  aria-label="Close"
                  onClick={() => setSelectedId(null)}
                >
                  <Icon name="close" size={18} />
                </button>
              </div>

              <div className="t-mapsheet__body">
                <div className="t-mapsheet__topline">
                  {(() => {
                    const style = pinStyle.get(selected.categoryId);
                    return (
                      <span
                        className="t-mapsheet__cat"
                        style={
                          style ? { background: style.bg, color: style.fg } : undefined
                        }
                      >
                        {style && <Icon name={style.icon} size={13} />}
                        {selected.subcategory}
                      </span>
                    );
                  })()}

                  {/* Memorials and anything flagged sensitive carry no rating. */}
                  {!isSensitivePlace(selected) && selected.rating !== undefined && (
                    <span className="t-rating">
                      <Icon name="star" size={14} filled />
                      {selected.rating.toFixed(1)}
                    </span>
                  )}
                </div>

                <h2 className="t-mapsheet__title t-truncate">{selected.name}</h2>

                <p className="t-mapsheet__sub t-truncate">
                  {selected.area ?? selected.city}
                  {(() => {
                    const away = formatDistanceFor(
                      distanceKm(origin, { lat: selected.lat!, lng: selected.lng! }),
                      selected.coordsPrecision,
                    );
                    return away ? ` · ${away} away` : "";
                  })()}
                </p>

                <div className="t-mapsheet__actions">
                  <button
                    type="button"
                    className="t-btn t-btn--primary"
                    onClick={() => showDirections(selected)}
                    disabled={routing}
                  >
                    {routing ? (
                      <Spinner size={16} tone="current" label="Finding a route" />
                    ) : (
                      <Icon name="navigate" size={16} />
                    )}
                    Directions
                  </button>
                  <Link href={`/place/${selected.id}`} className="t-btn t-btn--secondary">
                    Details
                    <Icon name="chevronRight" size={16} />
                  </Link>
                </div>

                {routeError && (
                  <div className="t-notice t-notice--danger" style={{ marginTop: "var(--t-3)" }}>
                    <span className="t-notice__icon">
                      <Icon name="alert" size={16} />
                    </span>
                    <div className="t-notice__body">
                      {routeError}
                      {(() => {
                        const href = externalRoute(origin, selected);
                        return href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="t-mapsheet__falllink"
                          >
                            Open the route in Google Maps
                            <Icon name="external" size={14} />
                          </a>
                        ) : null;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Route summary, rendered on our own map. */}
          {status === "ready" && route && (
            <div className="t-map__sheet">
              <div className="t-mapsheet__body">
                <div className="t-inline" style={{ alignItems: "flex-start" }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="t-route__eta">{route.duration}</span>
                    <span className="t-route__summary">
                      {route.distance} · arrive {route.arriveAt}
                    </span>
                    <span className="t-route__dest t-truncate">to {route.destination}</span>
                  </span>
                  <button
                    type="button"
                    className="t-iconbtn"
                    aria-label="Clear route"
                    onClick={clearRoute}
                  >
                    <Icon name="close" size={18} />
                  </button>
                </div>

                {selected && (
                  <Link
                    href={`/navigate/${selected.id}`}
                    className="t-btn t-btn--primary t-btn--block"
                    style={{ marginTop: "var(--t-3)" }}
                  >
                    <Icon name="navigate" size={16} />
                    Start journey
                  </Link>
                )}

                {/* A preview, not the whole route — the full guided list lives
                    on the navigation screen, where there is room to read it. */}
                <ol className="t-route">
                  {route.steps.slice(0, 3).map((step, i) => (
                    <li key={i} className="t-route__step">
                      <span className="t-route__icon">
                        <Icon name={step.icon} size={17} />
                      </span>
                      <span className="t-route__text">{step.text}</span>
                      {step.distance && (
                        <span className="t-route__dist">{step.distance}</span>
                      )}
                    </li>
                  ))}
                </ol>

                {route.steps.length > 3 && (
                  <p className="t-small t-muted" style={{ marginTop: "var(--t-2)" }}>
                    and {route.steps.length - 3} more steps
                  </p>
                )}

                {/* OpenStreetMap's licence asks for the credit, and it is also
                    the honest label for whose roads these directions describe. */}
                <p className="t-small t-muted" style={{ marginTop: "var(--t-3)" }}>
                  Driving route via OSRM · ©{" "}
                  <a
                    href="https://www.openstreetmap.org/copyright"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    OpenStreetMap
                  </a>{" "}
                  contributors
                </p>
              </div>
            </div>
          )}

          {/* Peeking card rail on mobile when nothing is selected. */}
          {status === "ready" && !selected && !route && (
            <div className="t-map__rail">
              <div
                className="t-scroller"
                style={{ marginInline: 0, paddingInline: "var(--t-gutter)" }}
              >
                {visible.slice(0, 30).map((place) => (
                  <button
                    key={place.id}
                    type="button"
                    className="t-mapcard"
                    onClick={() => focus(place)}
                    onMouseEnter={() => setHoveredId(place.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onFocus={() => setHoveredId(place.id)}
                    onBlur={() => setHoveredId(null)}
                  >
                    <span className="t-mapcard__media">
                      <PlaceImage
                        src={place.image}
                        alt=""
                        categoryId={place.categoryId}
                        sizes="60px"
                      />
                    </span>
                    <span style={{ minWidth: 0, textAlign: "left" }}>
                      <span className="t-row__name t-truncate" style={{ display: "block" }}>
                        {place.name}
                      </span>
                      <span className="t-place__meta">
                        <span className="t-truncate">{place.subcategory}</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
