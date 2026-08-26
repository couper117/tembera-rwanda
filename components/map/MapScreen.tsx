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
import { MAP_STYLE, MIN_ZOOM, PLACE_ZOOM, RWANDA_BOUNDS, pinIcon } from "./rwandaMap";

declare global {
  interface Window {
    google: any;
    __temberaInitMap?: () => void;
    gm_authFailure?: () => void;
  }
}

interface Props {
  places: Place[];
  apiKey: string;
}

type MapStatus =
  | "loading"
  | "ready"
  /** No key configured at all. */
  | "nokey"
  /** Google rejected the key: unauthorised referrer, disabled API, or quota. */
  | "keyrejected"
  /** Script never loaded — network, blocker, offline. */
  | "failed";

/**
 * Places the map opens framed on. Every place is plotted, but fitting all of
 * them means opening on the whole country — and with most listings in Kigali
 * that is a wall of pins in one corner. Framing the nearest handful opens
 * somewhere useful; "show all results" and the category filter both refit.
 */
const INITIAL_FIT = 40;

export default function MapScreen({ places, apiKey }: Props) {
  const { origin, coords, requestLocation, originLabel } = useLocation();
  const categories = useCategories();

  const canvasRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  /** The drawn route. Ours to draw now that OSRM only returns the geometry. */
  const routeLineRef = useRef<any>(null);
  /** Which pin is currently drawn in its active state, if any. */
  const litRef = useRef<string | null>(null);

  const [status, setStatus] = useState<MapStatus>(apiKey ? "loading" : "nokey");
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
    const google = window.google;
    const map = mapRef.current;
    if (!map || !google?.maps) return;

    // `visible` is nearest-first, so a limit frames the closest results.
    const list = limit ? visibleRef.current.slice(0, limit) : visibleRef.current;
    const bounds = new google.maps.LatLngBounds();
    for (const place of list) bounds.extend({ lat: place.lat!, lng: place.lng! });

    if (bounds.isEmpty()) {
      bounds.extend({ lat: RWANDA_BOUNDS.south, lng: RWANDA_BOUNDS.west });
      bounds.extend({ lat: RWANDA_BOUNDS.north, lng: RWANDA_BOUNDS.east });
    }
    map.fitBounds(bounds, 48);
    // A single result fits to maximum zoom, which drops you into a street with
    // no context. Pull back to something recognisable.
    google.maps.event.addListenerOnce(map, "idle", () => {
      if (map.getZoom() > PLACE_ZOOM) map.setZoom(PLACE_ZOOM);
    });
  }, []);

  /* ----------------------------------------------------- script loading */

  useEffect(() => {
    if (!apiKey) return;
    // Google calls this for anything key-related: unauthorised referrer, an
    // API that isn't enabled, billing off, or quota spent. Worth separating
    // from a plain network failure — the fixes are completely different.
    window.gm_authFailure = () => setStatus("keyrejected");

    const init = () => {
      if (!canvasRef.current || !window.google?.maps) return;
      const google = window.google;
      const wide = window.matchMedia("(min-width: 1024px)").matches;

      mapRef.current = new google.maps.Map(canvasRef.current, {
        zoom: 8,
        center: { lat: -1.94, lng: 29.87 },
        styles: MAP_STYLE,
        minZoom: MIN_ZOOM,
        disableDefaultUI: true,
        // Pinch handles zoom on a phone; on a desktop people expect buttons.
        // Centre-right keeps them clear of both the filter row along the top
        // and our own recentre/fit cluster above the card rail.
        zoomControl: wide,
        zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
        clickableIcons: false,
        gestureHandling: "greedy",
      });

      // Frame the results rather than opening on an arbitrary centre+zoom.
      // This waits for the first idle: called any earlier the map hasn't
      // measured its container yet and fits against a default size, landing on
      // the same zoom on a phone as on a desktop.
      google.maps.event.addListenerOnce(mapRef.current, "idle", () => fitPlaces(INITIAL_FIT));

      setStatus("ready");
    };

    if (window.google?.maps) {
      init();
      return;
    }

    if (document.querySelector("script[data-tembera-maps]")) {
      window.__temberaInitMap = init;
      return;
    }

    window.__temberaInitMap = init;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey,
    )}&callback=__temberaInitMap&libraries=places&loading=async`;
    script.async = true;
    script.dataset.temberaMaps = "true";
    script.onerror = () => setStatus("failed");
    document.head.appendChild(script);
    // The tag is left in place across mounts so a remount reuses the SDK.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  /* --------------------------------------------------------- place pins */

  // Pins are rebuilt only when the result set itself changes. Selecting or
  // pointing at a place repaints the existing pins in the effect below
  // instead — tearing down and recreating every marker on the map for each
  // click would stutter badly now that the whole catalogue is plotted.
  useEffect(() => {
    if (status !== "ready" || !mapRef.current || !window.google?.maps) return;
    const google = window.google;
    const map = mapRef.current;

    for (const marker of markersRef.current) marker.setMap(null);
    markersRef.current = visible.map((place) => {
      const style = pinStyle.get(place.categoryId);
      const marker = new google.maps.Marker({
        position: { lat: place.lat!, lng: place.lng! },
        map,
        title: place.name,
        icon: pinIcon(google, { icon: style?.icon, color: style?.fg }),
        zIndex: 5,
      });
      marker.addListener("click", () => setSelectedId(place.id));
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
    const google = window.google;
    if (status !== "ready" || !google?.maps) return;

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
      marker.setIcon(pinIcon(google, { icon: style?.icon, color: style?.fg, active }));
      marker.setZIndex(active ? 10 : 5);
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
    if (status !== "ready" || !mapRef.current || !window.google?.maps || !coords) return;
    const google = window.google;
    userMarkerRef.current?.setMap(null);
    userMarkerRef.current = new google.maps.Marker({
      position: coords,
      map: mapRef.current,
      zIndex: 999,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#1a73e8",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
      },
    });
  }, [coords, status]);

  /* ------------------------------------------------------------ actions */

  const focus = useCallback((place: Place) => {
    setSelectedId(place.id);
    const map = mapRef.current;
    if (!map || place.lat === undefined || place.lng === undefined) return;
    map.panTo({ lat: place.lat, lng: place.lng });
    if (map.getZoom() < PLACE_ZOOM) map.setZoom(PLACE_ZOOM);
  }, []);

  const recenter = useCallback(() => {
    if (coords) {
      mapRef.current?.panTo(coords);
      if (mapRef.current?.getZoom() < 13) mapRef.current.setZoom(13);
    } else {
      requestLocation();
    }
  }, [coords, requestLocation]);

  const clearRoute = useCallback(() => {
    routeLineRef.current?.setMap(null);
    routeLineRef.current = null;
    setRoute(null);
    setRouteError(null);
  }, []);

  /** Draws the route on our own map — no hand-off to an external app. */
  const showDirections = useCallback(
    async (place: Place) => {
      const google = window.google;
      const map = mapRef.current;
      if (!google?.maps || !map || place.lat === undefined || place.lng === undefined) return;

      setRouting(true);
      setRouteError(null);

      const result = await fetchRoute(origin, place);
      setRouting(false);

      if (!result.ok) {
        setRouteError(result.error);
        return;
      }

      routeLineRef.current?.setMap(null);
      routeLineRef.current = new google.maps.Polyline({
        map,
        path: result.route.path,
        strokeColor: "#11694a",
        strokeWeight: 5,
        strokeOpacity: 0.9,
      });

      // Frame the whole trip, not just its end points.
      const bounds = new google.maps.LatLngBounds();
      for (const point of result.route.path) bounds.extend(point);
      if (!bounds.isEmpty()) map.fitBounds(bounds, 64);

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
  // ordinary browse page rather than a dead grey rectangle.
  if (status === "nokey" || status === "failed" || status === "keyrejected") {
    return (
      <main className="t-main">
        <div className="t-page">
          {status === "nokey" && (
            <EmptyState
              icon="map"
              title="Map view isn't switched on"
              text="Tembera needs a Google Maps key to draw the map. Everything is still browsable below, and directions open in your maps app."
            />
          )}
          {status === "keyrejected" && (
            <EmptyState
              icon="lock"
              title="The map key was rejected"
              text="Google turned this key down — usually an unauthorised site, an API that isn't enabled, billing switched off, or a spent quota. Reloading won't help until the key is fixed. Everything below still works."
            />
          )}
          {status === "failed" && (
            <EmptyState
              icon="alert"
              title="The map couldn't load"
              text="Google Maps didn't load — most likely a network problem or a blocker. Everything is still browsable below."
              actions={[
                { label: "Try again", onClick: () => window.location.reload(), variant: "primary" },
              ]}
            />
          )}

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
