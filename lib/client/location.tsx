"use client";

// User location, shared across the app.
//
// Deliberately does NOT prompt on page load — browsers penalise that and users
// hate it. On mount we only check whether permission was *already* granted and,
// if so, read the position silently. Otherwise every "Near you" surface shows
// an explicit control, and the app falls back to a city the user can change.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DISTRICT_CENTRES, KIGALI } from "@/lib/places/geo";
import type { Coords } from "@/lib/places/types";

export type LocationStatus =
  /** Haven't asked, and permission wasn't already granted. */
  | "idle"
  /** Waiting on the browser/user. */
  | "locating"
  /** We have a real position. */
  | "granted"
  /** User said no, or a previous request was blocked. */
  | "denied"
  /** No geolocation API, or the lookup failed for another reason. */
  | "unavailable";

interface LocationValue {
  status: LocationStatus;
  /** Real device position, when we have one. */
  coords: Coords | null;
  /** City the user picked manually, if any. */
  chosenCity: string | null;
  /**
   * The position to measure distances from: device position, else the chosen
   * city's centre, else Kigali. Never null, so callers don't branch.
   */
  origin: Coords;
  /** What to show in the UI: "Near you", "Musanze", "Kigali". */
  originLabel: string;
  /** True when `origin` is a fallback rather than the device's real position. */
  isFallback: boolean;
  requestLocation: () => void;
  setCity: (city: string | null) => void;
}

const CITY_KEY = "tembera.city";

const LocationContext = createContext<LocationValue | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [coords, setCoords] = useState<Coords | null>(null);
  const [chosenCity, setChosenCity] = useState<string | null>(null);

  // Restore a previously chosen city.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CITY_KEY);
      if (stored && DISTRICT_CENTRES[stored]) setChosenCity(stored);
      else if (stored === "Kigali") setChosenCity("Kigali");
    } catch {
      // Private mode / storage disabled — fall back to the default city.
    }
  }, []);

  const read = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("granted");
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  // Silent read only when permission is already granted from a previous visit.
  useEffect(() => {
    let cancelled = false;
    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      return;
    }
    if (!navigator.permissions?.query) return;

    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((result) => {
        if (cancelled) return;
        if (result.state === "granted") read();
        else if (result.state === "denied") setStatus("denied");
      })
      .catch(() => {
        // Permissions API unsupported; leave status idle and wait for a tap.
      });

    return () => {
      cancelled = true;
    };
  }, [read]);

  const setCity = useCallback((city: string | null) => {
    setChosenCity(city);
    try {
      if (city) window.localStorage.setItem(CITY_KEY, city);
      else window.localStorage.removeItem(CITY_KEY);
    } catch {
      // Non-fatal: the choice just won't persist across reloads.
    }
  }, []);

  const value = useMemo<LocationValue>(() => {
    const cityCentre =
      chosenCity === "Kigali"
        ? KIGALI
        : chosenCity
          ? DISTRICT_CENTRES[chosenCity]
          : undefined;

    const origin = coords ?? cityCentre ?? KIGALI;
    const originLabel = coords ? "Near you" : (chosenCity ?? "Kigali");

    return {
      status,
      coords,
      chosenCity,
      origin,
      originLabel,
      isFallback: coords === null,
      requestLocation: read,
      setCity,
    };
  }, [status, coords, chosenCity, read, setCity]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation(): LocationValue {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used inside <LocationProvider>");
  return ctx;
}
