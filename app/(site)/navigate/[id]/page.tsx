import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NavigateScreen from "@/components/map/NavigateScreen";
import { getPlace } from "@/lib/data/places";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const place = await getPlace(id);
  return { title: place ? `Directions to ${place.name}` : "Directions" };
}

/**
 * Turn-by-turn guidance to a single place. A screen of its own rather than a
 * panel on the map: navigating is the whole task while you are doing it, and
 * it wants the room for a large current instruction and spoken prompts.
 */
export default async function NavigatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const place = await getPlace(id);
  if (!place) notFound();

  return <NavigateScreen place={place} />;
}
