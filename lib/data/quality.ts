import "server-only";
import { prisma } from "@/lib/prisma";
import { assessQuality, type CatalogQuality } from "@/lib/places/quality";

export type {
  CatalogQuality,
  DuplicatePhoto,
  QualityGap,
  QualityPlace,
} from "@/lib/places/quality";

/**
 * The read side of /admin/quality. The judgement lives in
 * lib/places/quality.ts, which is pure and tested without a database; this
 * file only fetches.
 *
 * Scoped to **published** rows. A draft is unfinished by definition and an
 * archived one is gone; counting either would inflate the numbers with rows
 * nobody can see, and an editor cannot act on that.
 *
 * One query, filtered in memory. At ~500 places the whole table costs less
 * than the round trips eight separate aggregates would, and the
 * duplicate-photo check cannot be expressed as a count anyway — it has to
 * group by image across the entire set.
 */
export async function catalogQuality(): Promise<CatalogQuality> {
  const rows = await prisma.place.findMany({
    where: { status: "published" },
    select: {
      id: true,
      name: true,
      city: true,
      categoryId: true,
      description: true,
      image: true,
      imageData: true,
      website: true,
      phone: true,
      lat: true,
      lng: true,
      coordsPrecision: true,
      rating: true,
      hours: true,
      hoursJson: true,
    },
    orderBy: [{ categoryId: "asc" }, { name: "asc" }],
  });

  return assessQuality(rows);
}
