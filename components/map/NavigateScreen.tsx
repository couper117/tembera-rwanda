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
import { MAP_STYLE, MIN_ZOOM } from "./rwandaMap";

interface Props {
  place: Place;
  apiKey: string;
}

/**
 * How close counts as having completed a manoeuvre. GPS in a city is good to
 * roughly this, so a tighter figure would leave the guidance stuck at a turn
 * the driver has already taken.
 */
const ARRIVED_AT_STEP_M = 40;

/** Announce the upcoming turn once inside this range, the way a satnav does. */
const ANNOUNCE_AHEAD_M = 200;

export default function NavigateScreen({ place, apiKey }: Props) {
  const { origin, coords, requestLocation } = useLocation();

  const canvasRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const meRef = useRef<any>(null);
  const lineRef = useRef<any>(null);

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
    if (!apiKey) return;

    const init = () => {
      if (!canvasRef.current || !window.google?.maps) return;
      const google = window.google;
      mapRef.current = new google.maps.Map(canvasRef.current, {
        zoom: 15,
        center: origin,
        styles: MAP_STYLE,
        minZoom: MIN_ZOOM,
        disableDefaultUI: true,
        clickableIcons: false,
        gestureHandling: "greedy",
      });
      setMapReady(true);
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
    document.head.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Draw the line once both the map and the route exist.
  useEffect(() => {
    const google = window.google;
    if (!mapReady || !route || !google?.maps || !mapRef.current) return;

    lineRef.current?.setMap(null);
    lineRef.current = new google.maps.Polyline({
      map: mapRef.current,
      path: route.path,
      strokeColor: "#11694a",
      strokeWeight: 6,
      strokeOpacity: 0.9,
    });

    new google.maps.Marker({
      position: route.path[route.path.length - 1],
      map: mapRef.current,
      title: place.name,
    });

    const bounds = new google.maps.LatLngBounds();
    for (const point of route.path) bounds.extend(point);
    if (!bounds.isEmpty()) mapRef.current.fitBounds(bounds, 56);
  }, [mapReady, route, place.name]);

  // Keep a dot on the driver, and follow it while guiding.
  useEffect(() => {
    const google = window.google;
    if (!mapReady || !coords || !google?.maps || !mapRef.current) return;
    meRef.current?.setMap(null);
    meRef.current = new google.maps.Marker({
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
  }, [coords, mapReady]);

  /** Centre on the current manoeuvre, so the map matches the instruction. */
  const showStep = useCallback((at: LatLng) => {
    const map = mapRef.current;
    if (!map) return;
    map.panTo(at);
    if (map.getZoom() < 16) map.setZoom(16);
  }, []);

  /* ----------------------------------------------------------------- UI */

  const fallback = externalRoute(origin, place);

  return (
    <div className="t-nav">
      <div className="t-nav__map">
        <div className="t-nav__canvas" ref={canvasRef} />
        {!apiKey && (
          <div className="t-nav__nomap">
            <Icon name="map" size={26} />
            <p className="t-small t-muted">The map isn&apos;t switched on, but the directions below still work.</p>
          </div>
        )}
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
