import { notFound } from "next/navigation";
import { PageHead, Panel } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { getCategories } from "@/lib/data/categories";
import { getCities } from "@/lib/data/cities";
import { getAnyPlace } from "@/lib/data/places";
import { recentAudit } from "@/lib/audit";
import { weekHoursOf } from "@/lib/places/hours";
import PlaceForm, { type CategoryOption, type PlaceFormValues } from "../PlaceForm";

export const dynamic = "force-dynamic";

export default async function EditPlacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;

  const place = await getAnyPlace(id);
  if (!place) notFound();

  const [groups, cityRows, history] = await Promise.all([
    getCategories(),
    getCities(),
    recentAudit({ entity: "place", entityId: id, take: 5 }),
  ]);

  const categories: CategoryOption[] = groups.map((c) => ({
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
    hoursJson: weekHoursOf(place),
    phone: place.phone ?? "",
    mapLink: place.mapLink ?? "",
    website: place.website ?? "",
    highlights: place.highlights?.join(", ") ?? "",
    priceFrom: place.priceFrom?.toString() ?? "",
    keywords: place.keywords?.join(", ") ?? "",
    sensitive: place.sensitive ?? false,
    status: place.status ?? "published",
  };

  return (
    <>
      <PageHead
        title={place.name}
        sub={`id: ${place.id} — permanent, because it is also the public URL`}
      />
      <Panel title="Details">
        <PlaceForm
          mode="edit"
          values={values}
          categories={categories}
          cities={cityRows.map((c) => c.name)}
        />
      </Panel>

      {/* Who last touched this listing, next to the listing itself — more use
          than the same rows buried in a global feed. */}
      {history.length > 0 && (
        <Panel title="Recent changes" flush>
          <div className="a-queue">
            {history.map((event) => (
              <div key={event.id} className="a-queue__item">
                <span className="a-queue__body">
                  <span className="a-queue__name">
                    {event.actor?.name ?? "A removed account"} · <code>{event.action}</code>
                  </span>
                  <span className="a-queue__meta">
                    {event.createdAt.toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}
