import { notFound } from "next/navigation";
import { PageHead, Panel } from "@/components/admin/ui";
import { getCategories } from "@/lib/data/categories";
import { getPlace } from "@/lib/data/places";
import PlaceForm, { type CategoryOption, type PlaceFormValues } from "../PlaceForm";

export const dynamic = "force-dynamic";

export default async function EditPlacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const place = await getPlace(id);
  if (!place) notFound();

  const categories: CategoryOption[] = (await getCategories()).map((c) => ({
    id: c.id,
    label: c.label,
    subcategories: c.subcategories,
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
    images: place.images?.join(", ") ?? "",
    description: place.description ?? "",
    hours: place.hours ?? "",
    phone: place.phone ?? "",
    mapLink: place.mapLink ?? "",
    website: place.website ?? "",
    highlights: place.highlights?.join(", ") ?? "",
    priceFrom: place.priceFrom?.toString() ?? "",
    keywords: place.keywords?.join(", ") ?? "",
    sensitive: place.sensitive ?? false,
  };

  return (
    <>
      <PageHead title={place.name} sub={`id: ${place.id} — immutable`} />
      <Panel title="Details">
        <PlaceForm mode="edit" values={values} categories={categories} />
      </Panel>
    </>
  );
}
