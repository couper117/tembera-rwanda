import type { Metadata } from "next";
import SearchScreen from "@/components/search/SearchScreen";
import { buildSearchIndex } from "@/lib/places/catalog";

export const metadata: Metadata = {
  title: "Search",
  description: "Search places, restaurants, hotels and services across Rwanda.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  // Built on the server so the browser gets names and metadata, not the raw
  // datasets (which carry inline images and descriptions it doesn't need).
  const index = buildSearchIndex();

  return <SearchScreen index={index} initialQuery={q ?? ""} />;
}
