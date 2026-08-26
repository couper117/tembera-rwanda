import Link from "next/link";
import type { Prisma } from "@prisma/client";
import Icon from "@/components/Icon";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { PageHead, Panel } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
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

  const where: Prisma.PlaceWhereInput = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { subcategory: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
    ];
  }
  if (categoryFilter) where.categoryId = categoryFilter;

  const [total, places, categories] = await Promise.all([
    prisma.place.count({ where }),
    prisma.place.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, label: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
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
