"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Click a map to set a listing's coordinates.
 *
 * 478 of the 495 imported listings carry only their district's centre, which
 * is why "Near you" and the distance on a card are approximate for almost
 * everything. Typing latitude and longitude by hand is how that stays true:
 * nobody knows a decimal degree off the top of their head, and a transposed
 * pair looks identical to a correct one. Clicking a map is the only way an
 * editor can actually fix this at the rate it needs fixing.
 *
 * OpenStreetMap tiles, not Google: this is an internal tool, it needs no API
 * key, no billing account and no referrer allow-list, and the app already
 * takes the same approach for routing.
 *
 * Setting a point also sets coordsPrecision to "exact" — a coordinate someone
 * placed deliberately is not a district guess, and leaving the flag behind
 * would keep the public page apologising for a location that is now right.
 */

/** Rwanda, framed so the whole country is visible on first open. */
const RWANDA_CENTRE: [number, number] = [-1.94, 29.87];
const RWANDA_BOUNDS: [[number, number], [number, number]] = [
  [-2.95, 28.8],
  [-0.95, 31.0],
];

interface Props {
  lat: string;
  lng: string;
  onChange: (lat: string, lng: string) => void;
}

export default function MapPicker({ lat, lng, onChange }: Props) {
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const [ready, setReady] = useState(false);

  // Kept in a ref so the map is built once; putting onChange in the effect's
  // dependencies would tear down and rebuild the map on every parent render.
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!container.current || map.current) return;
    let cancelled = false;

    // Imported dynamically because Leaflet touches `window` at module scope
    // and would break the server render otherwise.
    void import("leaflet").then((L) => {
      if (cancelled || !container.current || map.current) return;

      const initial: [number, number] =
        lat && lng && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
          ? [Number(lat), Number(lng)]
          : RWANDA_CENTRE;

      const instance = L.map(container.current, {
        center: initial,
        zoom: lat && lng ? 16 : 8,
        maxBounds: RWANDA_BOUNDS,
        maxBoundsViscosity: 0.7,
        scrollWheelZoom: false, // a stray scroll should not zoom the page away
      });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(instance);

      // Leaflet's default marker icon is loaded by a relative URL that does not
      // survive bundling, so it is drawn here instead of shipping image assets.
      const icon = L.divIcon({
        className: "a-mappin",
        html: '<span class="a-mappin__dot"></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      if (lat && lng) {
        marker.current = L.marker(initial, { icon, draggable: true }).addTo(instance);
        marker.current.on("dragend", () => {
          const p = marker.current?.getLatLng();
          if (p) onChangeRef.current(p.lat.toFixed(6), p.lng.toFixed(6));
        });
      }

      instance.on("click", (event) => {
        const { lat: newLat, lng: newLng } = event.latlng;
        if (marker.current) {
          marker.current.setLatLng(event.latlng);
        } else {
          marker.current = L.marker(event.latlng, { icon, draggable: true }).addTo(
            instance,
          );
          marker.current.on("dragend", () => {
            const p = marker.current?.getLatLng();
            if (p) onChangeRef.current(p.lat.toFixed(6), p.lng.toFixed(6));
          });
        }
        onChangeRef.current(newLat.toFixed(6), newLng.toFixed(6));
      });

      map.current = instance;
      setReady(true);
    });

    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
    // Built once. Later coordinate changes are pushed in by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow the number inputs when they are edited by hand, so the two controls
  // never disagree about where the place is.
  useEffect(() => {
    if (!map.current || !ready) return;
    const a = Number(lat);
    const b = Number(lng);
    if (!Number.isFinite(a) || !Number.isFinite(b) || !lat || !lng) return;

    const current = marker.current?.getLatLng();
    if (current && Math.abs(current.lat - a) < 1e-6 && Math.abs(current.lng - b) < 1e-6) {
      return; // already there — avoids fighting the click that set it
    }

    void import("leaflet").then((L) => {
      if (!map.current) return;
      if (marker.current) {
        marker.current.setLatLng([a, b]);
      } else {
        const icon = L.divIcon({
          className: "a-mappin",
          html: '<span class="a-mappin__dot"></span>',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        marker.current = L.marker([a, b], { icon, draggable: true }).addTo(map.current);
      }
      map.current.setView([a, b], Math.max(map.current.getZoom(), 15));
    });
  }, [lat, lng, ready]);

  return (
    <div className="a-mapwrap">
      <div ref={container} className="a-map" role="application" aria-label="Pick the location on a map" />
      <p className="a-hint">
        {lat && lng
          ? "Click the map or drag the pin to move it."
          : "Click the map to place this listing. Zoom in first for a precise point."}
      </p>
    </div>
  );
}
