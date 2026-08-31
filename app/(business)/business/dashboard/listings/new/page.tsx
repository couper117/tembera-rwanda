import { PageHead, Panel } from "@/components/admin/ui";
import BusinessPlaceForm, {
  type BusinessPlaceValues,
} from "@/components/business/BusinessPlaceForm";
import { requireBusiness } from "@/lib/auth";
import { getMyBusiness } from "@/lib/data/business";
import { getCategories } from "@/lib/data/categories";
import { getCities } from "@/lib/data/cities";

export const dynamic = "force-dynamic";

const EMPTY: BusinessPlaceValues = {
  name: "",
  categoryId: "",
  subcategory: "",
  city: "",
  subtype: "",
  area: "",
  lat: "",
  lng: "",
  coordsPrecision: "unknown",
  description: "",
  hours: "",
  hoursJson: {},
  phone: "",
  website: "",
  image: "",
  images: "",
  highlights: "",
  priceFrom: "",
  keywords: "",
  mapLink: "",
};

export default async function ProposeListingPage() {
  const user = await requireBusiness();
  const business = await getMyBusiness(user.id);
  if (!business) return null;

  const [groups, cityRows] = await Promise.all([getCategories(), getCities()]);

  return (
    <>
      <PageHead
        title="Propose a listing"
        sub="Tembera reviews every new listing before it appears. Check first whether we already list you — claiming is quicker."
      />
      <Panel title="The listing">
        <BusinessPlaceForm
          mode="create"
          values={EMPTY}
          categories={groups.map((c) => ({
            id: c.id,
            label: c.label,
            subcategories: c.subcategories,
          }))}
          cities={cityRows.map((c) => c.name)}
          verified={business.status === "verified"}
        />
      </Panel>
    </>
  );
}
