import type { Metadata } from "next";
import AppHeader from "@/components/app/AppHeader";
import MapScreen from "@/components/map/MapScreen";
import { buildSearchIndex } from "@/lib/places/catalog";

export const metadata: Metadata = {
  title: "Map",
  description: "Explore Rwanda geographically — places, filters and directions.",
};

export default function MapPage() {
  // Only places with coordinates can be plotted; the index carries them all.
  const places = buildSearchIndex().filter(
    (place) => place.lat !== undefined && place.lng !== undefined,
  );

  // The legacy page hard-coded a Maps key in client source. It comes from the
  // environment now, and an empty value is handled as a real product state
  // rather than a silently grey box.
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";

  return (
    <>
      <AppHeader />
      <MapScreen places={places} apiKey={apiKey} />
    </>
  );
}
