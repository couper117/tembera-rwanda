import { PageHead, Panel } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { getCategories } from "@/lib/data/categories";
import { getCities } from "@/lib/data/cities";
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
  hoursJson: {},
  phone: "",
  mapLink: "",
  website: "",
  highlights: "",
  priceFrom: "",
  keywords: "",
  sensitive: false,
  status: "published",
};

export default async function NewPlacePage() {
  await requireStaff();

  const [groups, cityRows] = await Promise.all([getCategories(), getCities()]);

  const categories: CategoryOption[] = groups.map((c) => ({
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
        <PlaceForm
          mode="create"
          values={EMPTY}
          categories={categories}
          cities={cityRows.map((c) => c.name)}
        />
      </Panel>
    </>
  );
}
