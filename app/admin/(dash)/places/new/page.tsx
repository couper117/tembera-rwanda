import { PageHead, Panel } from "@/components/admin/ui";
import { getCategories } from "@/lib/data/categories";
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

  const categories: CategoryOption[] = (await getCategories()).map((c) => ({
    id: c.id,
    label: c.label,
    subcategories: c.subcategories,
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
