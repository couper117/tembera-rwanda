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

// KNOWN ISSUE: an unknown category (/c/nope) serves the correct not-found
// screen but with a 200 rather than a 404. `dynamicParams = false` fixes this
// on /place/[id] and /city/[city], but not here: this page reads searchParams
// for `?type=`, so it can render on demand and the guard never applies. The
// real fix is to move `?type=` handling into PlaceBrowser (a client
// component) so the page can be fully static — at the cost of server-rendered
// filtering for linked, filtered URLs. Left alone deliberately.

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
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { category: id } = await params;
  const { type } = await searchParams;

  const group = await getGroup(id);
  if (!group) notFound();

  const places = await placesInCategory(id);

  // Only honour a `?type=` that this group actually defines, so a stale or
  // hand-edited link can't leave the page filtered to nothing with no
  // matching chip to clear.
  const selected =
    type && group.subcategories.includes(type) ? type : null;

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
              initialSubcategory={selected}
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
