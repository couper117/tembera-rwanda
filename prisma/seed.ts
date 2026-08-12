import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

// One-time migration of the original hardcoded app into the database.
//
// The legacy catalog was assembled in code from per-page datasets. We import
// that assembly ONCE here to populate the `places` table, along with the
// taxonomy (categories/subcategories) and the district directory. After this,
// application code reads everything from Postgres and the admin dashboard is
// the source of truth — these source files are no longer used at runtime.
import { PLACES, inlineImage } from "../lib/places/catalog";
import { CATEGORY_GROUPS } from "../lib/places/taxonomy";
import { DISTRICT_CENTRES, KIGALI_DISTRICTS } from "../lib/places/geo";

const prisma = new PrismaClient();

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

async function wipe() {
  // Child rows first, then parents.
  await prisma.review.deleteMany();
  await prisma.savedPlace.deleteMany();
  await prisma.visitedPlace.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.place.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.city.deleteMany();
  await prisma.user.deleteMany();
}

async function seedTaxonomy() {
  for (let i = 0; i < CATEGORY_GROUPS.length; i++) {
    const g = CATEGORY_GROUPS[i];
    await prisma.category.create({
      data: {
        id: g.id,
        label: g.label,
        title: g.title,
        icon: g.icon,
        primary: g.primary ?? false,
        sortOrder: i,
        subcategories: {
          create: g.subcategories.map((name, j) => ({ name, sortOrder: j })),
        },
      },
    });
  }
  return new Set(CATEGORY_GROUPS.map((g) => g.id));
}

async function seedCities() {
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
  await prisma.city.createMany({ data: rows });
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
      description: p.description ?? null,
      hours: p.hours ?? null,
      phone: p.phone ?? null,
      mapLink: p.mapLink ?? null,
      highlights: p.highlights ?? [],
      priceFrom: p.priceFrom ?? null,
      keywords: p.keywords ?? [],
    });
  }

  await prisma.place.createMany({ data: rows, skipDuplicates: true });
  return { inserted: rows.length, skipped };
}

async function seedUsers() {
  const adminEmail = "admin@tembera.rw";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";
  await prisma.user.create({
    data: {
      email: adminEmail,
      handle: "admin",
      name: "Administrator",
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
      homeCity: "Kigali",
      bio: "Tembera administrator.",
    },
  });

  await prisma.user.create({
    data: {
      email: "demo@tembera.rw",
      handle: "demo",
      name: "Demo User",
      passwordHash: await bcrypt.hash("demo12345", 10),
      role: "USER",
      homeCity: "Kigali",
      bio: "Exploring Rwanda one place at a time.",
    },
  });

  return { adminEmail, adminPassword };
}

async function main() {
  console.log("Seeding Tembera…");
  await wipe();
  const validCategories = await seedTaxonomy();
  await seedCities();
  const { inserted, skipped } = await seedPlaces(validCategories);
  const { adminEmail, adminPassword } = await seedUsers();

  console.log(`  categories: ${CATEGORY_GROUPS.length}`);
  console.log(`  cities:     ${Object.keys(DISTRICT_CENTRES).length}`);
  console.log(`  places:     ${inserted} inserted${skipped ? `, ${skipped} skipped` : ""}`);
  console.log(`  admin:      ${adminEmail} / ${adminPassword}  (change after first login)`);
  console.log(`  demo user:  demo@tembera.rw / demo12345`);
  console.log("Done.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
