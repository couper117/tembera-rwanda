import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient, type Prisma } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// One-way migration of the original hardcoded catalog into Postgres.
//
// The legacy catalog was assembled in code from per-page datasets. That
// assembly is imported ONCE here to populate `places`, along with the taxonomy
// and the district directory. After this, application code reads everything
// from Postgres and the admin dashboard is the source of truth.
//
// Two safety properties matter more than anything else in this file:
//
//   1. Ids must never change. They are derived from source array order (see
//      lib/places/catalog.ts#assignIds), and they are also public URLs and
//      foreign keys. prisma/seed-ids.json freezes them; this seed refuses to
//      run if the catalog no longer matches it.
//   2. Re-running must never destroy data. The default path only inserts rows
//      that are missing. Wiping requires SEED_RESET=true and is refused
//      outright in production.
import { PLACES, inlineImage } from "../lib/places/catalog";
import { CATEGORY_GROUPS } from "../lib/places/taxonomy";
import { DISTRICT_CENTRES, KIGALI_DISTRICTS } from "../lib/places/geo";

// The seed talks to the direct endpoint, not the pooler: it is one long
// session doing bulk inserts, which is what a transaction-mode pooler handles
// worst.
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Set DIRECT_URL (or DATABASE_URL) before seeding.");
}
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

/** Province each district belongs to, for the admin city directory. */
const PROVINCE: Record<string, string> = {
  Gasabo: "Kigali City",
  Kicukiro: "Kigali City",
  Nyarugenge: "Kigali City",
  Burera: "Northern",
  Gakenke: "Northern",
  Gicumbi: "Northern",
  Musanze: "Northern",
  Rulindo: "Northern",
  Gisagara: "Southern",
  Huye: "Southern",
  Kamonyi: "Southern",
  Muhanga: "Southern",
  Nyamagabe: "Southern",
  Nyanza: "Southern",
  Nyaruguru: "Southern",
  Ruhango: "Southern",
  Bugesera: "Eastern",
  Gatsibo: "Eastern",
  Kayonza: "Eastern",
  Kirehe: "Eastern",
  Ngoma: "Eastern",
  Nyagatare: "Eastern",
  Rwamagana: "Eastern",
  Karongi: "Western",
  Ngororero: "Western",
  Nyabihu: "Western",
  Nyamasheke: "Western",
  Rubavu: "Western",
  Rusizi: "Western",
  Rutsiro: "Western",
};

interface ManifestEntry {
  id: string;
  name: string;
  categoryId: string;
  city: string;
}

/**
 * The gate that makes this seed safe to keep in the repo.
 *
 * If someone reorders a row in lib/places/sources/*, `assignIds` hands the bare
 * id to a different place and the "-2" suffix to another. Without this check
 * that lands in Postgres silently and breaks live URLs and foreign keys. With
 * it, the seed stops and prints exactly what moved.
 */
function assertMatchesManifest(): number {
  const manifest: ManifestEntry[] = JSON.parse(
    readFileSync(join(__dirname, "seed-ids.json"), "utf8"),
  );

  const frozen = new Set(manifest.map((e) => e.id));
  const current = new Set(PLACES.map((p) => p.id));

  const added = [...current].filter((id) => !frozen.has(id));
  const removed = [...frozen].filter((id) => !current.has(id));

  if (added.length || removed.length) {
    const detail = [
      added.length ? `  new ids not in the manifest:\n    ${added.join("\n    ")}` : "",
      removed.length
        ? `  manifest ids the catalog no longer produces:\n    ${removed.join("\n    ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    throw new Error(
      `The catalog no longer matches prisma/seed-ids.json.\n\n${detail}\n\n` +
        "Place ids are public URLs and foreign keys, so this is never a safe\n" +
        "difference to ignore. If the change is deliberate AND the database is\n" +
        "empty, re-run `npm run freeze-ids` and commit the new manifest. If the\n" +
        "database already holds data, migrate the affected rows by hand instead.",
    );
  }

  if (manifest.length !== PLACES.length) {
    throw new Error(
      `Manifest has ${manifest.length} places but the catalog produced ${PLACES.length}.`,
    );
  }

  return manifest.length;
}

/**
 * Destructive, and therefore hedged twice.
 *
 * The original version of this seed ran unconditionally and deleted users
 * along with everything else. That is right for a local bootstrap and
 * catastrophic anywhere real.
 */
async function wipe(): Promise<boolean> {
  if (process.env.SEED_RESET !== "true") return false;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SEED_RESET is refused when NODE_ENV=production.");
  }

  // Child rows first, then parents.
  await prisma.review.deleteMany();
  await prisma.savedPlace.deleteMany();
  await prisma.visitedPlace.deleteMany();
  await prisma.report.deleteMany();
  await prisma.place.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.city.deleteMany();
  return true;
}

/**
 * Upserted rather than created, so re-running picks up an edit to the taxonomy
 * without touching the places that point at it.
 */
async function seedTaxonomy(): Promise<Set<string>> {
  for (let i = 0; i < CATEGORY_GROUPS.length; i++) {
    const g = CATEGORY_GROUPS[i];
    const data = {
      label: g.label,
      title: g.title,
      icon: g.icon,
      primary: g.primary ?? false,
      sensitive: g.sensitive ?? false,
      sortOrder: i,
    };
    await prisma.category.upsert({
      where: { id: g.id },
      create: { id: g.id, ...data },
      update: data,
    });

    for (let j = 0; j < g.subcategories.length; j++) {
      const name = g.subcategories[j];
      await prisma.subcategory.upsert({
        where: { categoryId_name: { categoryId: g.id, name } },
        create: { categoryId: g.id, name, sortOrder: j },
        update: { sortOrder: j },
      });
    }
  }
  return new Set(CATEGORY_GROUPS.map((g) => g.id));
}

async function seedCities(): Promise<number> {
  const rows: Prisma.CityCreateManyInput[] = Object.entries(DISTRICT_CENTRES).map(
    ([name, c], i) => ({
      name,
      group: KIGALI_DISTRICTS.includes(name) ? "Kigali" : null,
      province: PROVINCE[name] ?? null,
      lat: c.lat,
      lng: c.lng,
      sortOrder: i,
    }),
  );
  const { count } = await prisma.city.createMany({ data: rows, skipDuplicates: true });
  return count;
}

async function seedPlaces(validCategories: Set<string>) {
  const rows: Prisma.PlaceCreateManyInput[] = [];
  let skipped = 0;

  for (const p of PLACES) {
    if (!validCategories.has(p.categoryId)) {
      skipped++;
      continue;
    }
    // Recover the original inline data: URI so it lives in the DB, served by
    // /api/place-image/[id]. `image` keeps the short /api URL in that case.
    // These move to Cloudinary later via scripts/migrate-inline-images.ts —
    // deliberately not here, so this one-way seed makes no network calls.
    const imageData = p.image?.startsWith("/api/place-image/")
      ? inlineImage(p.id) ?? null
      : null;

    rows.push({
      id: p.id,
      name: p.name,
      categoryId: p.categoryId,
      subcategory: p.subcategory,
      subtype: p.subtype ?? null,
      city: p.city,
      area: p.area ?? null,
      lat: p.lat ?? null,
      lng: p.lng ?? null,
      coordsPrecision: p.coordsPrecision,
      rating: p.rating ?? null,
      image: p.image ?? null,
      imageData,
      // The original seed silently dropped these three, so a place with extra
      // photos, a website or a sensitivity flag lost them on the way in.
      images: p.images ?? [],
      website: p.website ?? null,
      sensitive: p.sensitive ?? false,
      description: p.description ?? null,
      hours: p.hours ?? null,
      phone: p.phone ?? null,
      mapLink: p.mapLink ?? null,
      highlights: p.highlights ?? [],
      priceFrom: p.priceFrom ?? null,
      keywords: p.keywords ?? [],
    });
  }

  const { count } = await prisma.place.createMany({ data: rows, skipDuplicates: true });
  return { inserted: count, candidates: rows.length, skipped };
}

async function main() {
  const expected = assertMatchesManifest();
  console.log(`Manifest matches the catalog: ${expected} places.`);

  const didWipe = await wipe();
  if (didWipe) console.log("SEED_RESET=true - catalog tables cleared.");

  const categories = await seedTaxonomy();
  const cities = await seedCities();
  const places = await seedPlaces(categories);

  console.log(
    [
      `categories : ${categories.size}`,
      `cities     : +${cities} inserted`,
      `places     : +${places.inserted} inserted of ${places.candidates} candidates` +
        (places.skipped ? ` (${places.skipped} skipped: unknown category)` : ""),
    ].join("\n"),
  );

  const total = await prisma.place.count();
  if (total !== expected) {
    throw new Error(
      `places table holds ${total} rows but the manifest expects ${expected}.`,
    );
  }
  console.log(`\nDone. places table holds ${total} rows, matching the manifest.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
