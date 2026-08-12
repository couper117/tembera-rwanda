import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/app/PageHeader";
import PlaceBrowser from "@/components/browse/PlaceBrowser";
import Icon from "@/components/Icon";
import { categoryColor, resolveIconName } from "@/components/ui/categoryIcon";
import { placesInCategory } from "@/lib/data/places";
import { getCategories, getGroup } from "@/lib/data/categories";

export async function generateStaticParams() {
  const groups = await getCategories();
  return groups.map((group) => ({ category: group.id }));
}

// Reject unknown categories with a real 404. generateStaticParams enumerates
// every valid category id; dynamicParams=false makes any other /c/… return a
// proper 404 status (not just the not-found screen with a 200). This validates
// the route param and is independent of the `?type=` searchParam, which still
// works for valid categories.
export const dynamicParams = false;

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
  // URL on mount). Keeping it out of this server component is what lets
  // dynamicParams=false return a real 404 for unknown categories.

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
