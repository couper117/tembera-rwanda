import type { Metadata } from "next";
import AppHeader from "@/components/app/AppHeader";
import MapScreen from "@/components/map/MapScreen";
import { buildSearchIndex } from "@/lib/data/places";

export const metadata: Metadata = {
  title: "Map",
  description: "Explore Rwanda geographically — places, filters and directions.",
};

export default async function MapPage() {
  // Only places with coordinates can be plotted; the index carries them all.
  const places = (await buildSearchIndex()).filter(
    (place) => place.lat !== undefined && place.lng !== undefined,
  );

  // No key of any kind: the map draws itself from OpenStreetMap tiles and
  // routes on OSRM, so there is nothing to configure and nothing to leak.
  return (
    <>
      <AppHeader />
      <MapScreen places={places} />
    </>
  );
}
