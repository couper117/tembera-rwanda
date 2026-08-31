/**
 * Freeze the catalog's place ids into a manifest, once.
 *
 * Place ids are derived, not stored: lib/places/catalog.ts#assignIds builds
 * `${categoryId}-${slugify(name)}` and disambiguates collisions with -2, -3 …
 * in the order the merged source arrays happen to be in. Reordering a row in
 * lib/places/sources/*, or dedupeByName dropping a different duplicate, would
 * silently hand the bare id to a different place.
 *
 * That was harmless while the catalog was rebuilt on every boot. It stops
 * being harmless the moment these ids are primary keys in Postgres, public
 * URLs at /place/[id], and foreign keys from saved_places, visited_places,
 * reviews and reports.
 *
 * So: run this once, commit prisma/seed-ids.json, and treat it as the
 * contract. prisma/seed.ts checks every id it is about to insert against the
 * manifest and refuses to run on a mismatch, which turns "somebody edited a
 * source file" from silent data corruption into a failed seed.
 *
 *   npm run freeze-ids
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { PLACES } from "../lib/places/catalog";

interface ManifestEntry {
  id: string;
  name: string;
  categoryId: string;
  city: string;
}

const entries: ManifestEntry[] = PLACES.map((place) => ({
  id: place.id,
  name: place.name,
  categoryId: place.categoryId,
  city: place.city,
})).sort((a, b) => a.id.localeCompare(b.id));

const duplicates = entries
  .map((e) => e.id)
  .filter((id, i, all) => all.indexOf(id) !== i);
if (duplicates.length) {
  throw new Error(
    `The catalog produced duplicate ids, which assignIds should make impossible: ${duplicates.join(", ")}`,
  );
}

const target = join(__dirname, "..", "prisma", "seed-ids.json");
writeFileSync(target, `${JSON.stringify(entries, null, 2)}\n`, "utf8");

console.log(`Froze ${entries.length} place ids to prisma/seed-ids.json`);
