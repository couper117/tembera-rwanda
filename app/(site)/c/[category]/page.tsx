import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/app/PageHeader";
import PlaceBrowser from "@/components/browse/PlaceBrowser";
import Icon from "@/components/Icon";
import { categoryColor, resolveIconName } from "@/components/ui/categoryIcon";
import { placesInCategory } from "@/lib/data/places";
import { getGroup } from "@/lib/data/categories";

// Fully dynamic, like /place/[id]. The taxonomy is admin-editable, so
// prerendering the category list would both open a DB connection at build time
// and serve a stale set of categories until the next deploy. An unknown id
// falls through to getGroup() -> notFound(), which returns a real 404.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: id } = await params;
  const group = await getGroup(id);
  if (!group) return { title: "Not found" };

  const count = (await placesInCategory(id)).length;
  return {
    title: group.title,
    description: `${count} ${group.title.toLowerCase()} listed across Rwanda on Tembera.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: id } = await params;

  const group = await getGroup(id);
  if (!group) notFound();

  const places = await placesInCategory(id);

  // The `?type=` filter is applied client-side by PlaceBrowser (it reads the
  // URL on mount).

  return (
    <>
      <PageHeader title={group.title} fallbackHref="/explore" revealTitleOnScroll />

      <main className="t-main">
        <div className="t-page">
          <div className="t-section">
            <div className="t-inline" style={{ gap: "var(--t-3)" }}>
              <span
                className="t-cattile__icon"
                style={{
                  width: 44,
                  height: 44,
                  background: categoryColor(group.id).bg,
                  color: categoryColor(group.id).fg,
                }}
              >
                <Icon name={resolveIconName(group.icon)} size={22} />
              </span>
              <div>
                <h1 className="t-display">{group.title}</h1>
                <p className="t-small t-muted" style={{ marginTop: 2 }}>
                  {places.length} {places.length === 1 ? "place" : "places"} in Rwanda
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "var(--t-5)" }}>
            <PlaceBrowser
              places={places}
              subcategoryOrder={group.subcategories}
              syncPath={`/c/${group.id}`}
              emptyTitle={`No ${group.label.toLowerCase()} listed yet`}
              emptyText="Nothing in this category has been added to the guide."
              emptyActions={[
                { label: "Browse all categories", href: "/explore", variant: "primary" },
              ]}
            />
          </div>
        </div>
      </main>
    </>
  );
}
