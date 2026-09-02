// Prove the seeded database matches the frozen manifest, in both directions.
//
// The seed already asserts this on the way in. This checks it from the other
// side — against what actually landed in Postgres — because the whole point of
// freezing ids is that a silent drift here would break public URLs and orphan
// saves, visits and reviews.
//
//   npm run verify-seed
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("Set DIRECT_URL (or DATABASE_URL).");

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

interface ManifestEntry {
  id: string;
  name: string;
  categoryId: string;
  city: string;
}

async function main() {
  const manifest: ManifestEntry[] = JSON.parse(
    readFileSync(join(__dirname, "..", "prisma", "seed-ids.json"), "utf8"),
  );

  const rows = await prisma.place.findMany({
    select: { id: true, name: true, categoryId: true },
    orderBy: { id: "asc" },
  });

  const inDb = new Set(rows.map((r) => r.id));
  const inManifest = new Set(manifest.map((e) => e.id));

  const missing = manifest.filter((e) => !inDb.has(e.id));
  const extra = rows.filter((r) => !inManifest.has(r.id));

  // A matching id with a different name means the collision suffixes shifted:
  // the row exists, but it is a different place than the manifest recorded.
  const byId = new Map(manifest.map((e) => [e.id, e]));
  const renamed = rows.filter((r) => {
    const entry = byId.get(r.id);
    return entry && (entry.name !== r.name || entry.categoryId !== r.categoryId);
  });

  const [categories, subcategories, cities, citiesComplete] = await Promise.all([
    prisma.category.count(),
    prisma.subcategory.count(),
    prisma.city.count(),
    prisma.city.count({
      where: { province: { not: null }, lat: { not: null }, lng: { not: null } },
    }),
  ]);

  const sensitive = await prisma.place.count({ where: { categoryId: "memorials" } });
  const published = await prisma.place.count({ where: { status: "published" } });
  const withInlineImage = await prisma.place.count({ where: { imageData: { not: null } } });
  const withExtraPhotos = await prisma.place.count({ where: { NOT: { images: { isEmpty: true } } } });
  const withWebsite = await prisma.place.count({ where: { website: { not: null } } });

  const checks: [string, boolean, string][] = [
    ["places match manifest count", rows.length === manifest.length, `${rows.length} vs ${manifest.length}`],
    ["no manifest ids missing from the database", missing.length === 0, `${missing.length} missing`],
    ["no database ids absent from the manifest", extra.length === 0, `${extra.length} extra`],
    ["no id points at a different place", renamed.length === 0, `${renamed.length} mismatched`],
    ["16 categories", categories === 16, String(categories)],
    ["30 cities", cities === 30, String(cities)],
    ["every city has province and coordinates", citiesComplete === cities, `${citiesComplete}/${cities}`],
    ["subcategories seeded", subcategories > 0, String(subcategories)],
    ["every place published", published === rows.length, `${published}/${rows.length}`],
  ];

  let failed = 0;
  for (const [label, ok, detail] of checks) {
    console.log(`${ok ? "PASS" : "FAIL"}  ${label}  (${detail})`);
    if (!ok) failed++;
  }

  console.log(
    `\nfields the old seed dropped — images: ${withExtraPhotos}, website: ${withWebsite}` +
      `\nmemorials: ${sensitive}   inline images carried over: ${withInlineImage}`,
  );

  for (const row of [...missing.slice(0, 10)]) console.log(`  missing: ${row.id}`);
  for (const row of [...extra.slice(0, 10)]) console.log(`  extra:   ${row.id}`);
  for (const row of [...renamed.slice(0, 10)]) {
    console.log(`  mismatch: ${row.id} is now "${row.name}"`);
  }

  if (failed) {
    console.error(`\n${failed} check(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log("\nAll checks passed.");
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
