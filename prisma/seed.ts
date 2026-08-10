import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// The five categories the legacy homepage hard-coded in pages/index.php.
const categories = [
  {
    title: "History & Museums",
    description:
      "Explore the Kings' Palaces, Genocide Memorials, and Art Museums.",
    imageUrl:
      "https://images.unsplash.com/photo-1728288578026-6ef60d0fb202?q=80&w=1198&auto=format&fit=crop",
    pageLink: "historics",
    iconClass: "fas fa-landmark",
    ctaText: "View 9 Sites",
  },
  {
    title: "Stays & Homes",
    description:
      "From luxury hotels in Kigali to eco-lodges in the volcanoes.",
    imageUrl:
      "https://images.unsplash.com/photo-1667504320745-eade6c25e053?q=80&w=1170&auto=format&fit=crop",
    pageLink: "homes",
    iconClass: "fas fa-bed",
    ctaText: "Find Accommodation",
  },
  {
    title: "Nature & Activities",
    description: "Gorilla trekking, canopy walks, and Lake Kivu boat rides.",
    imageUrl:
      "https://images.unsplash.com/photo-1676102818778-7dedb5cdad46?q=80&w=987&auto=format&fit=crop",
    pageLink: "wonders",
    iconClass: "fas fa-hiking",
    ctaText: "See Activities",
  },
  {
    title: "Transport & Safety",
    description: "Hospitals, emergency contacts, and how to get around.",
    imageUrl:
      "https://images.unsplash.com/photo-1641295437743-2ea0b8453392?q=80&w=1170&auto=format&fit=crop",
    pageLink: "map",
    iconClass: "fas fa-bus",
    ctaText: "Travel Guide",
  },
  {
    title: "Churches",
    description: "Find a church to go to on your stay.",
    imageUrl:
      "https://images.unsplash.com/photo-1620763935115-3e08804489ca?q=80&w=687&auto=format&fit=crop",
    pageLink: "churches",
    iconClass: "fas fa-church",
    ctaText: "Churches",
  },
];

async function main() {
  for (const c of categories) {
    // Idempotent-ish seed keyed on the page link.
    const existing = await prisma.travelCategory.findFirst({
      where: { pageLink: c.pageLink },
    });
    if (existing) {
      await prisma.travelCategory.update({ where: { id: existing.id }, data: c });
    } else {
      await prisma.travelCategory.create({ data: c });
    }
  }

  // Default admin account. CHANGE THE PASSWORD after first login.
  const email = "admin@visitrwanda.local";
  const passwordHash = await bcrypt.hash("changeme123", 10);
  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash },
  });

  console.log("Seed complete. Admin login:", email, "/ changeme123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
