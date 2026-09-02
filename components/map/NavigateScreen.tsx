"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import Spinner from "@/components/ui/Spinner";
import { useLocation } from "@/lib/client/location";
import {
  externalRoute,
  fetchRoute,
  formatRouteDistance,
  metresBetween,
  type LatLng,
  type Route,
} from "@/lib/places/routing";
import type { Place } from "@/lib/places/types";
import { MAX_ZOOM, MIN_ZOOM, TILE_ATTRIBUTION, TILE_URL } from "./rwandaMap";
import "leaflet/dist/leaflet.css";

interface Props {
  place: Place;
}

/**
 * How close counts as having completed a manoeuvre. GPS in a city is good to
 * roughly this, so a tighter figure would leave the guidance stuck at a turn
 * the driver has already taken.
 */
const ARRIVED_AT_STEP_M = 40;

/** Announce the upcoming turn once inside this range, the way a satnav does. */
const ANNOUNCE_AHEAD_M = 200;

export default function NavigateScreen({ place }: Props) {
  const { origin, coords, requestLocation } = useLocation();

  const canvasRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const meRef = useRef<any>(null);
  const lineRef = useRef<any>(null);
  /** The Leaflet module, once its chunk has arrived. */
  const LRef = useRef<any>(null);

  const [route, setRoute] = useState<Route | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [voice, setVoice] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const step = route?.steps[stepIndex] ?? null;
  const nextStep = route?.steps[stepIndex + 1] ?? null;

  /* ------------------------------------------------------------ the route */

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await fetchRoute(origin, place);
      if (cancelled) return;
      if (result.ok) setRoute(result.route);
      else setError(result.error);
    })();
    return () => {
      cancelled = true;
    };
    // Recomputing on every origin nudge would restart the journey mid-turn;
    // the route is fetched once, and live position advances it instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place.id]);

  /* --------------------------------------------------------------- voice */

  /**
   * The browser's own speech synthesiser — no key, no network, and it is the
   * one part of this that makes it a guide rather than a list. Browsers only
   * allow it after a gesture, which the "Voice on" button provides.
   */
  const say = useCallback(
    (text: string) => {
      if (!voice || typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.lang = "en-GB";
      window.speechSynthesis.speak(utterance);
    },
    [voice],
  );

  // Read each manoeuvre as it becomes current.
  useEffect(() => {
    if (!step) return;
    say(step.distance ? `${step.text}, then continue for ${step.distance}` : step.text);
    // `say` changes with the voice toggle; announcing again then is intended,
    // so switching voice on reads the step you are actually on.
  }, [step, say]);

  // Leaving the screen should not leave a voice talking to an empty room.
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  /* ------------------------------------------------------ live position */

  const announcedRef = useRef<number>(-1);

  useEffect(() => {
    if (!route || !coords) return;
    const target = route.steps[stepIndex];
    if (!target) return;

    const away = metresBetween(coords, target.at);

    // Close enough to call it done — move on to the next instruction.
    if (away < ARRIVED_AT_STEP_M && stepIndex < route.steps.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }

    // Otherwise give the driver warning, once per step.
    if (away < ANNOUNCE_AHEAD_M && announcedRef.current !== stepIndex) {
      announcedRef.current = stepIndex;
      say(`In ${formatRouteDistance(away)}, ${target.text}`);
    }
  }, [coords, route, stepIndex, say]);

  /* ---------------------------------------------------------------- map */

  useEffect(() => {
    let cancelled = false;

    // Leaflet reads `window` at module scope, so it can only be imported here.
    void import("leaflet").then((mod) => {
      const L = mod.default ?? mod;
      if (cancelled || !canvasRef.current || mapRef.current) return;
      LRef.current = L;

      mapRef.current = L.map(canvasRef.current, {
        center: [origin.lat, origin.lng],
        zoom: 15,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        zoomControl: false,
        attributionControl: true,
      });

      L.tileLayer(TILE_URL, {
        attribution: TILE_ATTRIBUTION,
        maxZoom: MAX_ZOOM,
      }).addTo(mapRef.current);

      setMapReady(true);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // Mount only: re-creating the map whenever the origin drifts would fight
    // the driver, and the follow effects below already track them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draw the line once both the map and the route exist.
  useEffect(() => {
    const L = LRef.current;
    if (!mapReady || !route || !L || !mapRef.current) return;

    const path = route.path.map((point) => [point.lat, point.lng] as [number, number]);

    lineRef.current?.remove();
    lineRef.current = L.polyline(path, {
      color: "#11694a",
      weight: 6,
      opacity: 0.9,
    }).addTo(mapRef.current);

    // The destination. A plain circle rather than Leaflet's default marker,
    // whose icon is a bundled PNG that resolves against the page URL and 404s
    // under Next's asset pipeline.
    L.circleMarker(path[path.length - 1], {
      radius: 7,
      fillColor: "#11694a",
      fillOpacity: 1,
      color: "#ffffff",
      weight: 3,
    })
      .bindTooltip(place.name)
      .addTo(mapRef.current);

    if (path.length) mapRef.current.fitBounds(L.latLngBounds(path), { padding: [56, 56] });
  }, [mapReady, route, place.name]);

  // Keep a dot on the driver, and follow it while guiding.
  useEffect(() => {
    const L = LRef.current;
    if (!mapReady || !coords || !L || !mapRef.current) return;
    meRef.current?.remove();
    meRef.current = L.circleMarker([coords.lat, coords.lng], {
      radius: 8,
      fillColor: "#1a73e8",
      fillOpacity: 1,
      color: "#ffffff",
      weight: 3,
      interactive: false,
    }).addTo(mapRef.current);
  }, [coords, mapReady]);

  /** Centre on the current manoeuvre, so the map matches the instruction. */
  const showStep = useCallback((at: LatLng) => {
    const map = mapRef.current;
    if (!map) return;
    map.panTo([at.lat, at.lng]);
    if (map.getZoom() < 16) map.setZoom(16);
  }, []);

  /* ----------------------------------------------------------------- UI */

  const fallback = externalRoute(origin, place);

  return (
    <div className="t-nav">
      <div className="t-nav__map">
        <div className="t-nav__canvas" ref={canvasRef} />
      </div>

      <div className="t-nav__panel">
        <div className="t-nav__head">
          <Link href={`/place/${place.id}`} className="t-iconbtn" aria-label="End journey">
            <Icon name="close" size={20} />
          </Link>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="t-nav__dest t-truncate">{place.name}</span>
            {route && (
              <span className="t-nav__trip">
                {route.duration} · {route.distance} · arrive {route.arriveAt}
              </span>
            )}
          </span>
          <button
            type="button"
            className={`t-iconbtn${voice ? " t-iconbtn--active" : ""}`}
            aria-pressed={voice}
            aria-label={voice ? "Turn voice guidance off" : "Turn voice guidance on"}
            onClick={() => setVoice((on) => !on)}
          >
            <Icon name={voice ? "bell" : "bellOff"} size={20} />
          </button>
        </div>

        {error && (
          <div className="t-notice t-notice--danger">
            <span className="t-notice__icon">
              <Icon name="alert" size={16} />
            </span>
            <div className="t-notice__body">
              {error}
              {fallback && (
                <a
                  href={fallback}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="t-mapsheet__falllink"
                >
                  Open the route in Google Maps
                  <Icon name="external" size={14} />
                </a>
              )}
            </div>
          </div>
        )}

        {!route && !error && (
          <div className="t-nav__loading">
            <Spinner size={26} label="Working out the route" />
            <p className="t-small t-muted">Working out the route…</p>
          </div>
        )}

        {route && step && (
          <>
            {/* The instruction you are on, sized to be read at a glance. */}
            <div className="t-nav__now">
              <span className="t-nav__nowicon">
                <Icon name={step.icon} size={34} />
              </span>
              <span style={{ minWidth: 0 }}>
                <span className="t-nav__nowtext">{step.text}</span>
                {step.distance && <span className="t-nav__nowdist">{step.distance}</span>}
              </span>
            </div>

            {nextStep && (
              <p className="t-nav__then">
                <Icon name={nextStep.icon} size={15} />
                Then {nextStep.text.charAt(0).toLowerCase() + nextStep.text.slice(1)}
              </p>
            )}

            <div className="t-nav__controls">
              <button
                type="button"
                className="t-btn t-btn--secondary"
                onClick={() => {
                  const i = Math.max(0, stepIndex - 1);
                  setStepIndex(i);
                  showStep(route.steps[i].at);
                }}
                disabled={stepIndex === 0}
              >
                <Icon name="chevronLeft" size={16} />
                Back
              </button>
              <span className="t-nav__count">
                {stepIndex + 1} of {route.steps.length}
              </span>
              <button
                type="button"
                className="t-btn t-btn--primary"
                onClick={() => {
                  const i = Math.min(route.steps.length - 1, stepIndex + 1);
                  setStepIndex(i);
                  showStep(route.steps[i].at);
                }}
                disabled={stepIndex >= route.steps.length - 1}
              >
                Next
                <Icon name="chevronRight" size={16} />
              </button>
            </div>

            {!coords && (
              <button
                type="button"
                className="t-btn t-btn--ghost t-btn--sm t-btn--block"
                onClick={requestLocation}
              >
                <Icon name="navigate" size={15} />
                Follow my location
              </button>
            )}

            <ol className="t-route t-nav__all">
              {route.steps.map((s, i) => (
                <li
                  key={i}
                  className="t-route__step"
                  aria-current={i === stepIndex || undefined}
                >
                  <span className="t-route__icon">
                    <Icon name={s.icon} size={17} />
                  </span>
                  <span className="t-route__text">{s.text}</span>
                  {s.distance && <span className="t-route__dist">{s.distance}</span>}
                </li>
              ))}
            </ol>

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
          </>
        )}
      </div>
    </div>
  );
}
