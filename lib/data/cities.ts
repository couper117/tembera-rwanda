import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CITY_IMAGES } from "@/lib/places/engine";

export const CITIES_TAG = "cities";

export interface CityRecord {
  id: number;
  name: string;
  group: string | null;
  province: string | null;
  lat: number | null;
  lng: number | null;
  image: string | null;
  sortOrder: number;
}

/**
 * The admin-managed city/district directory.
 *
 * `image` falls back to the curated table in lib/places/engine.ts, which is
 * what the public city cards actually render. Without this the admin screen
 * would report a district as having no photo while the site was displaying
 * one — the editor needs to see what the visitor sees.
 */
export const getCities = unstable_cache(
  async (): Promise<CityRecord[]> => {
    const rows = await prisma.city.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return rows.map((row) => ({
      ...row,
      image: row.image ?? CITY_IMAGES[row.name] ?? null,
    }));
  },
  ["cities-list"],
  { tags: [CITIES_TAG] },
);
