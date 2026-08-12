import { prisma } from "@/lib/prisma";
import type { TravelCategory } from "@prisma/client";

export type Collection = Pick<
  TravelCategory,
  "title" | "description" | "imageUrl" | "pageLink" | "ctaText"
>;

/**
 * Editor-curated collections, managed at /admin (the `travel_categories`
 * table). The legacy homepage rendered these as its main grid; they are now a
 * curated row alongside the generated discovery sections, so the admin CRUD
 * still drives something real.
 *
 * Falls back to the original hard-coded set if the database is unreachable, so
 * the home screen never breaks on a DB hiccup.
 */
const FALLBACK: Collection[] = [
  {
    title: "History & Museums",
    description: "Kings' palaces, genocide memorials and art museums.",
    imageUrl:
      "https://images.unsplash.com/photo-1728288578026-6ef60d0fb202?q=80&w=1198&auto=format&fit=crop",
    pageLink: "historics",
    ctaText: "View sites",
  },
  {
    title: "Stays & Homes",
    description: "Luxury hotels in Kigali to eco-lodges in the volcanoes.",
    imageUrl:
      "https://images.unsplash.com/photo-1667504320745-eade6c25e053?q=80&w=1170&auto=format&fit=crop",
    pageLink: "homes",
    ctaText: "Find accommodation",
  },
  {
    title: "Nature & Activities",
    description: "Gorilla trekking, canopy walks and Lake Kivu boat rides.",
    imageUrl:
      "https://images.unsplash.com/photo-1676102818778-7dedb5cdad46?q=80&w=987&auto=format&fit=crop",
    pageLink: "wonders",
    ctaText: "See activities",
  },
  {
    title: "Churches",
    description: "Find somewhere to worship during your stay.",
    imageUrl:
      "https://images.unsplash.com/photo-1620763935115-3e08804489ca?q=80&w=687&auto=format&fit=crop",
    pageLink: "churches",
    ctaText: "Browse",
  },
];

export async function getCollections(): Promise<Collection[]> {
  try {
    const rows = await prisma.travelCategory.findMany({ orderBy: { id: "asc" } });
    return rows.length ? rows : FALLBACK;
  } catch {
    return FALLBACK;
  }
}
