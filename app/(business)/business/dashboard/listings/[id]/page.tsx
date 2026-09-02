import { notFound } from "next/navigation";
import { PageHead, Panel } from "@/components/admin/ui";
import BusinessPlaceForm, {
  type BusinessPlaceValues,
} from "@/components/business/BusinessPlaceForm";
import { requireBusiness } from "@/lib/auth";
import { getMyBusiness, getMyPlace } from "@/lib/data/business";
import { getCategories } from "@/lib/data/categories";
import { getCities } from "@/lib/data/cities";
import { parseWeekHours } from "@/lib/places/hours";

export const dynamic = "force-dynamic";

export default async function EditMyListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireBusiness();
  const business = await getMyBusiness(user.id);
  if (!business) return null;

  const { id } = await params;

  // Scoped to this business, so a guessed id belonging to somebody else is a
  // 404 rather than a permission error — there is no reason to confirm that
  // another business's listing exists.
  const place = await getMyPlace(business.id, id);
  if (!place) notFound();

  const [groups, cityRows] = await Promise.all([getCategories(), getCities()]);

  const values: BusinessPlaceValues = {
    placeId: place.id,
    name: place.name,
    categoryId: place.categoryId,
    subcategory: place.subcategory,
    city: place.city,
    subtype: place.subtype ?? "",
    area: place.area ?? "",
    lat: place.lat?.toString() ?? "",
    lng: place.lng?.toString() ?? "",
    coordsPrecision: place.coordsPrecision,
    description: place.description ?? "",
    hours: place.hours ?? "",
    hoursJson: parseWeekHours(place.hoursJson),
    phone: place.phone ?? "",
    website: place.website ?? "",
    image: place.image ?? "",
    images: place.images.join(", "),
    highlights: place.highlights.join(", "),
    priceFrom: place.priceFrom?.toString() ?? "",
    keywords: place.keywords.join(", "),
    mapLink: place.mapLink ?? "",
  };

  return (
    <>
      <PageHead title={place.name} sub={`${place.subcategory} · ${place.city}`} />
      <Panel title="Your listing">
        <BusinessPlaceForm
          mode="edit"
          values={values}
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
