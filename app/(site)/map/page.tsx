"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google: any;
    initMap?: () => void;
  }
}

interface MapLocation {
  id: number;
  name: string;
  lat: number;
  lng: number;
  type: string;
  rating: number;
  img: string;
}

const kigali = { lat: -1.9441, lng: 30.0619 };

const locations: MapLocation[] = [
  {
    id: 1,
    name: "Kigali Genocide Memorial",
    lat: -1.9324,
    lng: 30.0577,
    type: "History",
    rating: 4.9,
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Kigali_Genocide_Memorial_Centre.jpg/200px-Kigali_Genocide_Memorial_Centre.jpg",
  },
  {
    id: 2,
    name: "Park Inn by Radisson",
    lat: -1.9542,
    lng: 30.0606,
    type: "Hotel",
    rating: 4.5,
    img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200",
  },
  {
    id: 3,
    name: "Inzora Rooftop Cafe",
    lat: -1.9439,
    lng: 30.0675,
    type: "Food",
    rating: 4.8,
    img: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=200",
  },
  {
    id: 4,
    name: "Question Coffee",
    lat: -1.9482,
    lng: 30.0912,
    type: "Food",
    rating: 4.9,
    img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200",
  },
];

const silverStyle = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#e9e9e9" }] },
];

// The legacy page hard-coded a Google Maps API key in client source. Read it
// from an env var instead. Set NEXT_PUBLIC_GOOGLE_MAPS_KEY in .env.local to
// enable the live map (the old key should be rotated/revoked).
const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const initializedRef = useRef(false);

  const [locationText, setLocationText] = useState("Positioning...");
  const [mapReady, setMapReady] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [activeStyle, setActiveStyle] = useState<"silver" | "satellite">("silver");

  const visibleLocations = useMemo(() => {
    const term = search.toLowerCase();
    return locations.filter((loc) => {
      const matchesFilter = activeFilter === "all" || loc.type === activeFilter;
      const matchesSearch = loc.name.toLowerCase().includes(term);
      return matchesFilter && matchesSearch;
    });
  }, [search, activeFilter]);

  // Load Google Maps script and initialize the map (guard against double-init).
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initMap = () => {
      if (!mapContainerRef.current || !window.google) return;

      const map = new window.google.maps.Map(mapContainerRef.current, {
        zoom: 14,
        center: kigali,
        styles: silverStyle,
        disableDefaultUI: true,
        zoomControl: true,
      });
      mapRef.current = map;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          userMarkerRef.current = new window.google.maps.Marker({
            position: pos,
            map: map,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#00A859",
              fillOpacity: 1,
              strokeColor: "white",
              strokeWeight: 3,
            },
          });
          map.setCenter(pos);
          setLocationText("Live");
        });
      }

      setMapReady(true);
    };

    // If Google Maps is already present, just initialize.
    if (window.google && window.google.maps) {
      initMap();
      return;
    }

    window.initMap = initMap;

    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-google-maps]"
    );
    if (existing) {
      // Script already injected by a previous mount; wait for callback.
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&callback=initMap&libraries=places`;
    script.async = true;
    script.defer = true;
    script.setAttribute("data-google-maps", "true");
    document.head.appendChild(script);
  }, []);

  // Sync the map markers with the currently visible locations.
  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.google) return;
    const map = mapRef.current;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    visibleLocations.forEach((loc) => {
      const marker = new window.google.maps.Marker({
        position: { lat: loc.lat, lng: loc.lng },
        map: map,
        title: loc.name,
        animation: window.google.maps.Animation.DROP,
      });
      markersRef.current.push(marker);
    });
  }, [visibleLocations, mapReady]);

  const setMapStyle = (type: "silver" | "satellite") => {
    setActiveStyle(type);
    const map = mapRef.current;
    if (!map) return;
    if (type === "satellite") {
      map.setMapTypeId("hybrid");
      map.setOptions({ styles: [] });
    } else {
      map.setMapTypeId("roadmap");
      map.setOptions({ styles: silverStyle });
    }
  };

  const handleCardClick = (loc: MapLocation, index: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.panTo({ lat: loc.lat, lng: loc.lng });
    map.setZoom(17);
    const marker = markersRef.current[index];
    if (marker && window.google) {
      marker.setAnimation(window.google.maps.Animation.BOUNCE);
      setTimeout(() => marker.setAnimation(null), 1500);
    }
  };

  const reCenter = () => {
    const map = mapRef.current;
    if (!map) return;
    if (userMarkerRef.current) map.panTo(userMarkerRef.current.getPosition());
    else map.panTo(kigali);
  };

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/assets/css/map.css" />

      <div className="map-wrapper">
        <aside className="map-sidebar">
          <div className="sidebar-header">
            <span className="tag">Live Explorer</span>
            <h2>Kigali Navigator</h2>
            <div className="status-indicator">
              <div className="dot"></div> <span id="location-text">{locationText}</span>
            </div>
          </div>

          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              id="mapSearch"
              placeholder="Where to?"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="view-toggles">
            <button
              className={`view-btn${activeStyle === "silver" ? " active" : ""}`}
              onClick={() => setMapStyle("silver")}
            >
              Standard
            </button>
            <button
              className={`view-btn${activeStyle === "satellite" ? " active" : ""}`}
              onClick={() => setMapStyle("satellite")}
            >
              Satellite
            </button>
          </div>

          <div className="quick-filters">
            <button
              className={`filter-chip${activeFilter === "all" ? " active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              All
            </button>
            <button
              className={`filter-chip${activeFilter === "Hotel" ? " active" : ""}`}
              onClick={() => setActiveFilter("Hotel")}
            >
              Stays
            </button>
            <button
              className={`filter-chip${activeFilter === "History" ? " active" : ""}`}
              onClick={() => setActiveFilter("History")}
            >
              History
            </button>
            <button
              className={`filter-chip${activeFilter === "Food" ? " active" : ""}`}
              onClick={() => setActiveFilter("Food")}
            >
              Dining
            </button>
          </div>

          <div className="location-list" id="location-list">
            {visibleLocations.map((loc, index) => (
              <div
                key={loc.id}
                className="place-card"
                onClick={() => handleCardClick(loc, index)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={loc.img} className="place-thumb" alt={loc.name} />
                <div className="place-info">
                  <strong>{loc.name}</strong>
                  <small>
                    {loc.type} &bull; &#9733; {loc.rating}
                  </small>
                </div>
              </div>
            ))}
          </div>

          <div className="sidebar-footer">
            <button className="btn-primary" onClick={reCenter}>
              <i className="fas fa-location-arrow"></i> Re-center
            </button>
          </div>
        </aside>

        <div id="map" ref={mapContainerRef}></div>
      </div>
    </>
  );
}
