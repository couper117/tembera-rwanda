import { PageHead, Panel } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import PlaceForm, { type CategoryOption, type PlaceFormValues } from "../PlaceForm";

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
  images: "",
  description: "",
  hours: "",
  phone: "",
  mapLink: "",
  website: "",
  highlights: "",
  priceFrom: "",
  keywords: "",
  sensitive: false,
};

export default async function NewPlacePage() {

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
    <>
      <PageHead
        title="New place"
        sub="The id is generated from the category and the name."
      />
      <Panel title="Details">
        <PlaceForm mode="create" values={EMPTY} categories={categories} />
      </Panel>
    </>
  );
}
