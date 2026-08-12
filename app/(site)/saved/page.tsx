import type { Metadata } from "next";
import SavedScreen from "@/components/saved/SavedScreen";
import { buildSearchIndex } from "@/lib/data/places";

export const metadata: Metadata = {
  title: "Saved",
  description: "Places you've saved on this device.",
};

export default async function SavedPage() {
  // Saves are stored as ids in the browser, so the screen needs the index to
  // resolve them to places.
  const index = await buildSearchIndex();
  return <SavedScreen index={index} />;
}
