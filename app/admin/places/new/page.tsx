import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminShell from "../../AdminShell";
import PlaceForm, { type CategoryOption, type PlaceFormValues } from "../PlaceForm";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

const EMPTY: PlaceFormValues = {
  name: "",
  categoryId: "",
  subcategory: "",
  subtype: "",
  city: "",
  area: "",
  lat: "",
  lng: "",
  coordsPrecision: "unknown",
  rating: "",
  image: "",
  description: "",
  hours: "",
  phone: "",
  mapLink: "",
  highlights: "",
  priceFrom: "",
  keywords: "",
};

export default async function NewPlacePage() {
  const admin = await requireAdmin();

  const cats = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { subcategories: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } },
  });
  const categories: CategoryOption[] = cats.map((c) => ({
    id: c.id,
    label: c.label,
    subcategories: c.subcategories.map((s) => s.name),
  }));

  return (
    <AdminShell email={admin.email}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>New place</h1>
          <p className={styles.pageSub}>The id is generated from the category and name.</p>
        </div>
      </div>
      <div className={styles.panel}>
        <PlaceForm mode="create" values={EMPTY} categories={categories} />
      </div>
    </AdminShell>
  );
}
