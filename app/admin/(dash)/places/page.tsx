import Link from "next/link";
import Icon from "@/components/Icon";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { PageHead, Panel, SampleNotice } from "@/components/admin/ui";
import { getCategories } from "@/lib/data/categories";
import { getAllPlaces } from "@/lib/data/places";
import { deletePlace } from "./actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function PlacesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const { q, category, page } = await searchParams;

  const search = (q ?? "").trim();
  const categoryFilter = (category ?? "").trim();
  const pageNum = Math.max(1, Number(page) || 1);

  // Filtering and paging happen in memory: the catalog is a static array of a
  // few thousand rows, so a query planner would be doing less work than the
  // round trip it replaces.
  const needle = search.toLowerCase();
  const matches = (await getAllPlaces()).filter((p) => {
    if (categoryFilter && p.categoryId !== categoryFilter) return false;
    if (!needle) return true;
    return (
      p.name.toLowerCase().includes(needle) ||
      p.subcategory.toLowerCase().includes(needle) ||
      p.city.toLowerCase().includes(needle)
    );
  });

  const total = matches.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const places = matches
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE);

  const categories = await getCategories();
  // The list showed the raw slug where the reader expects the label.
  const labels = new Map(categories.map((c) => [c.id, c.label]));

  const pageLink = (p: number) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (categoryFilter) params.set("category", categoryFilter);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/places?${qs}` : "/admin/places";
  };

  return (
    <>
      <SampleNotice what="Editing places" />

      <PageHead
        title="Places"
        sub={`${total.toLocaleString()} listing${total === 1 ? "" : "s"} in the catalogue.`}
        actions={
          <Link href="/admin/places/new" className="t-btn t-btn--primary t-btn--sm">
            <Icon name="plus" size={15} />
            New place
          </Link>
        }
      />

      <Panel title="Catalogue" flush>
        <form className="a-toolbar" method="get">
          <input
            name="q"
            className="a-input"
            defaultValue={search}
            placeholder="Search name, subcategory or city"
            aria-label="Search places"
          />
          <select
            name="category"
            className="a-select"
            defaultValue={categoryFilter}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <button type="submit" className="t-btn t-btn--secondary t-btn--sm">
            Filter
          </button>
          {(search || categoryFilter) && (
            <Link href="/admin/places" className="t-btn t-btn--ghost t-btn--sm">
              Clear
            </Link>
          )}
        </form>

        <div className="a-tablewrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Subcategory</th>
                <th>City</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {places.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <p className="a-empty">No places match that search.</p>
                  </td>
                </tr>
              ) : (
                places.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="a-table__strong">{p.name}</span>
                      <span className="a-table__sub">{p.id}</span>
                    </td>
                    <td>{labels.get(p.categoryId) ?? p.categoryId}</td>
                    <td>{p.subcategory}</td>
                    <td>{p.city}</td>
                    <td>
                      <div className="a-table__actions">
                        <Link
                          href={`/admin/places/${p.id}`}
                          className="t-btn t-btn--secondary t-btn--sm"
                        >
                          Edit
                        </Link>
                        <form action={deletePlace}>
                          <input type="hidden" name="id" value={p.id} />
                          <ConfirmButton question={`Delete ${p.name}?`} />
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="a-pagination">
            {pageNum > 1 && (
              <Link href={pageLink(pageNum - 1)} className="t-btn t-btn--secondary t-btn--sm">
                <Icon name="chevronLeft" size={14} />
                Prev
              </Link>
            )}
            <span>
              Page {pageNum} of {totalPages}
            </span>
            {pageNum < totalPages && (
              <Link href={pageLink(pageNum + 1)} className="t-btn t-btn--secondary t-btn--sm">
                Next
                <Icon name="chevronRight" size={14} />
              </Link>
            )}
          </div>
        )}
      </Panel>
    </>
  );
}
