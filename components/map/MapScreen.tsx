"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { resolveIconName } from "@/components/ui/categoryIcon";
import EmptyState from "@/components/ui/EmptyState";
import PlaceImage from "@/components/ui/PlaceImage";
import PlaceRow from "@/components/ui/PlaceRow";
import Spinner from "@/components/ui/Spinner";
import { useCategories } from "@/lib/client/categories";
import { useLocation } from "@/lib/client/location";
import { distanceKm, formatDistanceFor } from "@/lib/places/geo";
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
type TravelMode = "DRIVING" | "WALKING";

interface RouteSummary {
  distance: string;
  duration: string;
  steps: string[];
  destination: string;
}

/** Markers rendered at once. Beyond this the map turns into a pin cushion. */
const MAX_MARKERS = 80;

export default function MapScreen({ places, apiKey }: Props) {
  const { origin, coords, requestLocation, originLabel } = useLocation();
  const categories = useCategories();

  const canvasRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const dirServiceRef = useRef<any>(null);
  const dirRendererRef = useRef<any>(null);

  const [status, setStatus] = useState<MapStatus>(apiKey ? "loading" : "nokey");
  const [category, setCategory] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteSummary | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routing, setRouting] = useState(false);
  const [travelMode, setTravelMode] = useState<TravelMode>("DRIVING");

  /** Nearest first, so the cap keeps the most relevant pins. */
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
      .slice(0, MAX_MARKERS)
      .map((x) => x.place);
  }, [places, category, origin]);

  const selected = visible.find((p) => p.id === selectedId) ?? null;

  // Read inside map callbacks that are registered once and must not go stale.
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  /**
   * Frame the current results. Opening on the whole country looks tidy and is
   * useless — nearly every listing is in Kigali, so it renders as one pin in an
   * empty map. Fitting the pins is what a map beside a list is for.
   */
  const fitPlaces = useCallback(() => {
    const google = window.google;
    const map = mapRef.current;
    if (!map || !google?.maps) return;

    const bounds = new google.maps.LatLngBounds();
    for (const place of visibleRef.current) bounds.extend({ lat: place.lat!, lng: place.lng! });

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
        zoomControl: wide,
        zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_TOP },
        clickableIcons: false,
        gestureHandling: "greedy",
      });

      // Frame the results rather than opening on an arbitrary centre+zoom.
      // This waits for the first idle: called any earlier the map hasn't
      // measured its container yet and fits against a default size, landing on
      // the same zoom on a phone as on a desktop.
      google.maps.event.addListenerOnce(mapRef.current, "idle", () => fitPlaces());

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

  useEffect(() => {
    if (status !== "ready" || !mapRef.current || !window.google?.maps) return;
    const google = window.google;
    const map = mapRef.current;

    for (const marker of markersRef.current) marker.setMap(null);
    markersRef.current = visible.map((place) => {
      const marker = new google.maps.Marker({
        position: { lat: place.lat!, lng: place.lng! },
        map,
        title: place.name,
        icon: pinIcon(google, place.id === selectedId),
        zIndex: place.id === selectedId ? 10 : 5,
      });
      marker.addListener("click", () => setSelectedId(place.id));
      return marker;
    });
  }, [visible, status, selectedId]);

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
    dirRendererRef.current?.setMap(null);
    dirRendererRef.current = null;
    setRoute(null);
    setRouteError(null);
  }, []);

  /** Draws the route on our own map — no hand-off to an external app. */
  const showDirections = useCallback(
    (place: Place, mode: TravelMode) => {
      const google = window.google;
      const map = mapRef.current;
      if (!google?.maps || !map || place.lat === undefined || place.lng === undefined) return;

      setRouting(true);
      setRouteError(null);
      setTravelMode(mode);

      dirServiceRef.current ??= new google.maps.DirectionsService();
      dirRendererRef.current ??= new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        polylineOptions: { strokeColor: "#11694a", strokeWeight: 5, strokeOpacity: 0.9 },
      });

      dirServiceRef.current.route(
        {
          origin,
          destination: { lat: place.lat, lng: place.lng },
          travelMode: google.maps.TravelMode[mode],
        },
        (result: any, requestStatus: string) => {
          setRouting(false);
          if (requestStatus !== "OK" || !result?.routes?.length) {
            setRouteError(
              requestStatus === "ZERO_RESULTS"
                ? "No route found between those two points."
                : "Directions aren't available right now.",
            );
            return;
          }
          dirRendererRef.current.setDirections(result);
          const leg = result.routes[0].legs[0];
          setRoute({
            destination: place.name,
            distance: leg.distance?.text ?? "",
            duration: leg.duration?.text ?? "",
            // Instructions arrive as HTML; render them as plain text.
            steps: leg.steps.map((s: any) =>
              String(s.instructions ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
            ),
          });
        },
      );
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
      {/* --------------------------------------------- desktop panel -- */}
      <aside className="t-map__panel">
        <div className="t-map__panelhead">
          <Link href="/search" className="t-searchlink" style={{ height: 42 }}>
            <Icon name="search" size={18} />
            <span>Search places…</span>
          </Link>
          {filters}
        </div>

        <div className="t-map__panelbody">
          <p className="t-small t-muted" style={{ padding: "0 var(--t-2) var(--t-2)" }}>
            {visible.length} {visible.length === 1 ? "place" : "places"} on the map · nearest to{" "}
            {originLabel}
          </p>
          <div className="t-list">
            {visible.map((place) => (
              <PanelRow
                key={place.id}
                place={place}
                active={place.id === selectedId}
                distance={formatDistanceFor(
                  distanceKm(origin, { lat: place.lat!, lng: place.lng! }),
                  place.coordsPrecision,
                )}
                onSelect={() => focus(place)}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* ---------------------------------------------------- canvas -- */}
      <div className="t-map__stage">
        <div className="t-map__canvas" ref={canvasRef} />

        {status === "loading" && (
          <div className="t-map__canvas" style={{ display: "grid", placeItems: "center" }}>
            <Spinner size={30} label="Loading the map" />
          </div>
        )}

        <div className="t-map__overlay">
          <div
            className="t-hide-desktop"
            style={{ background: "linear-gradient(rgba(250,249,247,.96), rgba(250,249,247,0))" }}
          >
            {filters}
          </div>

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
                onClick={fitPlaces}
                aria-label="Show all results on the map"
              >
                <Icon name="map" size={19} />
              </button>
            </div>
          )}

          {/* Selected place card + in-app directions. */}
          {status === "ready" && selected && !route && (
            <div className="t-map__sheet">
              <div className="t-inline">
                <span className="t-mapcard__media">
                  <PlaceImage
                    src={selected.image}
                    alt=""
                    categoryId={selected.categoryId}
                    sizes="60px"
                  />
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span className="t-row__name t-truncate" style={{ display: "block" }}>
                    {selected.name}
                  </span>
                  <span className="t-place__meta">
                    <span className="t-truncate">{selected.subcategory}</span>
                    <span className="t-place__sep" aria-hidden="true" />
                    <span>
                      {formatDistanceFor(
                        distanceKm(origin, { lat: selected.lat!, lng: selected.lng! }),
                        selected.coordsPrecision,
                      )}
                    </span>
                  </span>
                </span>
                <button
                  type="button"
                  className="t-iconbtn"
                  aria-label="Close"
                  onClick={() => setSelectedId(null)}
                >
                  <Icon name="close" size={18} />
                </button>
              </div>

              <div className="t-inline" style={{ marginTop: "var(--t-3)" }}>
                <button
                  type="button"
                  className="t-btn t-btn--primary t-btn--sm"
                  style={{ flex: 1 }}
                  onClick={() => showDirections(selected, "DRIVING")}
                  disabled={routing}
                >
                  {routing ? (
                    <Spinner size={16} tone="current" label="Finding a route" />
                  ) : (
                    <Icon name="navigate" size={16} />
                  )}
                  Directions
                </button>
                <Link
                  href={`/place/${selected.id}`}
                  className="t-btn t-btn--secondary t-btn--sm"
                  style={{ flex: 1 }}
                >
                  Details
                </Link>
              </div>

              {routeError && (
                <div className="t-notice t-notice--danger" style={{ marginTop: "var(--t-2)" }}>
                  <span className="t-notice__icon">
                    <Icon name="alert" size={16} />
                  </span>
                  <div className="t-notice__body">{routeError}</div>
                </div>
              )}
            </div>
          )}

          {/* Route summary, rendered on our own map. */}
          {status === "ready" && route && (
            <div className="t-map__sheet">
              <div className="t-inline">
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="t-row__name t-truncate" style={{ display: "block" }}>
                    To {route.destination}
                  </span>
                  <span className="t-small t-muted">
                    {route.duration} · {route.distance}
                  </span>
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

              <div
                className="t-inline"
                style={{ marginTop: "var(--t-2)" }}
                role="group"
                aria-label="Travel mode"
              >
                {(["DRIVING", "WALKING"] as TravelMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className="t-chip t-chip--sm"
                    aria-pressed={travelMode === mode}
                    onClick={() => selected && showDirections(selected, mode)}
                  >
                    {mode === "DRIVING" ? "Drive" : "Walk"}
                  </button>
                ))}
              </div>

              <ol className="t-route">
                {route.steps.slice(0, 12).map((step, i) => (
                  <li key={i} className="t-route__step">
                    <span className="t-route__n">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Peeking card rail on mobile when nothing is selected. */}
          {status === "ready" && !selected && !route && (
            <div className="t-map__rail t-hide-desktop">
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

/**
 * A panel row drives the map rather than navigating away — clicking pans to the
 * pin and opens its card, which is what a list beside a map is for. The place
 * page is one tap further, from that card.
 */
function PanelRow({
  place,
  active,
  distance,
  onSelect,
}: {
  place: Place;
  active: boolean;
  distance?: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className="t-row t-maprow"
      aria-current={active || undefined}
      onClick={onSelect}
    >
      <span className="t-row__media">
        <PlaceImage
          src={place.image}
          alt=""
          className="t-row__img"
          categoryId={place.categoryId}
          sizes="68px"
        />
      </span>
      <span className="t-row__body">
        <span className="t-row__name t-truncate" style={{ display: "block" }}>
          {place.name}
        </span>
        <span className="t-place__meta">
          <span className="t-truncate">{place.subcategory}</span>
          <span className="t-place__sep" aria-hidden="true" />
          <span>{place.area ?? place.city}</span>
        </span>
        {distance && (
          <span className="t-place__meta">
            <span>{distance} away</span>
          </span>
        )}
      </span>
    </button>
  );
}
