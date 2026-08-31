import { notFound } from "next/navigation";
import { PageHead, Panel } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import PlaceForm, { type CategoryOption, type PlaceFormValues } from "../PlaceForm";

export const dynamic = "force-dynamic";

export default async function EditPlacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
    images: place.images.join(", "),
    description: place.description ?? "",
    hours: place.hours ?? "",
    phone: place.phone ?? "",
    mapLink: place.mapLink ?? "",
    website: place.website ?? "",
    highlights: place.highlights.join(", "),
    priceFrom: place.priceFrom?.toString() ?? "",
    keywords: place.keywords.join(", "),
    sensitive: place.sensitive,
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
