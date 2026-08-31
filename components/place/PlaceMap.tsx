"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Where the place is, on its own.
 *
 * Read-only, and deliberately not the interactive picker from the admin: a
 * visitor is orienting themselves, not editing a record. OpenStreetMap tiles,
 * so this needs no key and no billing account — the same basis as the routing
 * this app already does.
 *
 * Coordinates that are only a district centre get a wider zoom and say so,
 * rather than dropping a confident pin in the middle of a district. 478 of the
 * 495 listings are in exactly that position.
 */
export default function PlaceMap({
  lat,
  lng,
  name,
  approximate,
}: {
  lat: number;
  lng: number;
  name: string;
  approximate: boolean;
}) {
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!container.current || map.current) return;
    let cancelled = false;

    // Leaflet touches `window` at module scope, so it cannot be imported on
    // the server.
    void import("leaflet").then((L) => {
      if (cancelled || !container.current || map.current) return;

      const instance = L.map(container.current, {
        center: [lat, lng],
        zoom: approximate ? 12 : 16,
        scrollWheelZoom: false,
        dragging: true,
        zoomControl: true,
      });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(instance);

      if (approximate) {
        // A circle, not a pin: the honest shape for "somewhere in this
        // district". A pin here would be a precise claim we cannot make.
        L.circle([lat, lng], {
          radius: 2500,
          color: "var(--t-accent)",
          fillColor: "var(--t-accent)",
          fillOpacity: 0.12,
          weight: 2,
        }).addTo(instance);
      } else {
        L.marker([lat, lng], {
          icon: L.divIcon({
            className: "t-mappin",
            html: '<span class="t-mappin__dot"></span>',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
          title: name,
        }).addTo(instance);
      }

      map.current = instance;
    });

    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, [lat, lng, name, approximate]);

  return <div ref={container} className="t-placemap" role="img" aria-label={`Map showing ${name}`} />;
}
