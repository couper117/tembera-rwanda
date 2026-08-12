import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminShell from "../../AdminShell";
import PlaceForm, { type CategoryOption, type PlaceFormValues } from "../PlaceForm";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function EditPlacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;

  const [place, cats] = await Promise.all([
    prisma.place.findUnique({ where: { id } }),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { subcategories: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } },
    }),
  ]);

  if (!place) notFound();

  const categories: CategoryOption[] = cats.map((c) => ({
    id: c.id,
    label: c.label,
    subcategories: c.subcategories.map((s) => s.name),
  }));

  const values: PlaceFormValues = {
    id: place.id,
    name: place.name,
    categoryId: place.categoryId,
    subcategory: place.subcategory,
    subtype: place.subtype ?? "",
    city: place.city,
    area: place.area ?? "",
    lat: place.lat?.toString() ?? "",
    lng: place.lng?.toString() ?? "",
    coordsPrecision: place.coordsPrecision,
    rating: place.rating?.toString() ?? "",
    image: place.image ?? "",
    description: place.description ?? "",
    hours: place.hours ?? "",
    phone: place.phone ?? "",
    mapLink: place.mapLink ?? "",
    highlights: place.highlights.join(", "),
    priceFrom: place.priceFrom?.toString() ?? "",
    keywords: place.keywords.join(", "),
  };

  return (
    <AdminShell email={admin.email}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Edit place</h1>
          <p className={styles.pageSub}>
            id: <code>{place.id}</code> (immutable)
          </p>
        </div>
      </div>
      <div className={styles.panel}>
        <PlaceForm mode="edit" values={values} categories={categories} />
      </div>
    </AdminShell>
  );
}
