// Bring the Subcategory table up to lib/places/subcategories.ts.
//
// Additive and idempotent: it upserts every name in that file and removes
// nothing. `Place.subcategory` stores the string rather than a foreign key, so
// deleting a row here would orphan every listing carrying that name — the
// table is a picker, not the source of truth.
//
//   npm run sync-subcategories
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { SUBCATEGORIES } from "../lib/places/subcategories";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set.");

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

async function main() {
  const categories = await prisma.category.findMany({ select: { id: true } });
  const known = new Set(categories.map((c) => c.id));

  let added = 0;
  let seen = 0;

  for (const [categoryId, names] of Object.entries(SUBCATEGORIES)) {
    if (!known.has(categoryId)) {
      console.warn(`  skipping unknown category "${categoryId}"`);
      continue;
    }
    for (const [index, name] of names.entries()) {
      seen++;
      const existing = await prisma.subcategory.findUnique({
        where: { categoryId_name: { categoryId, name } },
        select: { id: true },
      });
      if (existing) {
        // Keep the order in step with the file without touching the name.
        await prisma.subcategory.update({
          where: { id: existing.id },
          data: { sortOrder: index },
        });
        continue;
      }
      await prisma.subcategory.create({ data: { categoryId, name, sortOrder: index } });
      added++;
      console.log(`  + ${categoryId}: ${name}`);
    }
  }

  const total = await prisma.subcategory.count();
  console.log(`\n${added} added, ${seen} in the file, ${total} in the table.`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
