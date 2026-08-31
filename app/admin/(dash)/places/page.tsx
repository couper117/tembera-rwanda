import Link from "next/link";
import Icon from "@/components/Icon";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { EmptyRow, PageHead, Panel, StatusBadge } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { getCategories } from "@/lib/data/categories";
import { getCities } from "@/lib/data/cities";
import { getAllPlaces } from "@/lib/data/places";
import { isRenderableImage } from "@/lib/places/engine";
import type { Place } from "@/lib/places/types";
import { archivePlace, restorePlace } from "./actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

/**
 * The gaps worth filtering for. Each is a real editorial job — "show me
 * everything with no photo" is how a catalogue gets finished — and each is
 * computed from data already loaded, so none of them costs a query.
 */
const GAPS = {
  "no-photo": {
    label: "Missing a photo",
    match: (p: Place) => !isRenderableImage(p.image),
  },
  "no-coords": {
    label: "Missing coordinates",
    match: (p: Place) => p.lat === undefined || p.lng === undefined,
  },
  "vague-coords": {
    label: "Only a district guess",
    match: (p: Place) => p.coordsPrecision !== "exact",
  },
  "no-description": {
    label: "Missing a description",
    match: (p: Place) => !p.description?.trim(),
  },
  "no-contact": {
    label: "No phone or website",
    match: (p: Place) => !p.phone && !p.website,
  },
} as const;

type GapKey = keyof typeof GAPS;

export default async function PlacesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    city?: string;
    status?: string;
    gap?: string;
    page?: string;
  }>;
}) {
  await requireStaff();
  const params = await searchParams;

  const search = (params.q ?? "").trim();
  const categoryFilter = (params.category ?? "").trim();
  const cityFilter = (params.city ?? "").trim();
  const statusFilter = (params.status ?? "").trim();
  const gapFilter = (params.gap ?? "").trim() as GapKey | "";
  const pageNum = Math.max(1, Number(params.page) || 1);

  const [all, categories, cities] = await Promise.all([
    getAllPlaces(),
    getCategories(),
    getCities(),
  ]);

  // Filtered in memory. getAllPlaces() is one query for the whole catalogue,
  // and at 495 rows the filtering costs less than the round trips that
  // per-filter SQL would add.
  const needle = search.toLowerCase();
  const matches = all.filter((p) => {
    if (categoryFilter && p.categoryId !== categoryFilter) return false;
    if (cityFilter && p.city !== cityFilter) return false;
    if (statusFilter && (p.status ?? "published") !== statusFilter) return false;
    if (gapFilter && GAPS[gapFilter] && !GAPS[gapFilter].match(p)) return false;
    if (!needle) return true;
    return (
      p.name.toLowerCase().includes(needle) ||
      p.subcategory.toLowerCase().includes(needle) ||
      p.city.toLowerCase().includes(needle) ||
      p.id.toLowerCase().includes(needle)
    );
  });

  const total = matches.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const clamped = Math.min(pageNum, totalPages);
  const places = matches
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice((clamped - 1) * PAGE_SIZE, clamped * PAGE_SIZE);

  const labels = new Map(categories.map((c) => [c.id, c.label]));
  const filtered = Boolean(search || categoryFilter || cityFilter || statusFilter || gapFilter);

  const pageLink = (p: number) => {
    const qs = new URLSearchParams();
    if (search) qs.set("q", search);
    if (categoryFilter) qs.set("category", categoryFilter);
    if (cityFilter) qs.set("city", cityFilter);
    if (statusFilter) qs.set("status", statusFilter);
    if (gapFilter) qs.set("gap", gapFilter);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `/admin/places?${s}` : "/admin/places";
  };

  return (
    <>
      <PageHead
        title="Places"
        sub={
          filtered
            ? `${total.toLocaleString()} of ${all.length.toLocaleString()} listings match.`
            : `${all.length.toLocaleString()} listings in the catalogue.`
        }
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
            placeholder="Search name, subcategory, city or id"
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
          <select
            name="city"
            className="a-select"
            defaultValue={cityFilter}
            aria-label="Filter by district"
          >
            <option value="">All districts</option>
            {cities.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            name="status"
            className="a-select"
            defaultValue={statusFilter}
            aria-label="Filter by status"
          >
            <option value="">Any status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select
            name="gap"
            className="a-select"
            defaultValue={gapFilter}
            aria-label="Filter by missing information"
          >
            <option value="">Complete or not</option>
            {Object.entries(GAPS).map(([key, gap]) => (
              <option key={key} value={key}>
                {gap.label}
              </option>
            ))}
          </select>
          <button type="submit" className="t-btn t-btn--secondary t-btn--sm">
            Filter
          </button>
          {filtered && (
            <Link href="/admin/places" className="t-btn t-btn--ghost t-btn--sm">
              Clear
            </Link>
          )}
        </form>

        <div className="a-tablewrap">
          <table className="a-table">
            <thead>
              <tr>
                <th style={{ width: 52 }}>
                  <span className="a-visually-hidden">Photo</span>
                </th>
                <th>Name</th>
                <th>Category</th>
                <th>District</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {places.length === 0 ? (
                <EmptyRow colSpan={6}>Nothing matches those filters.</EmptyRow>
              ) : (
                places.map((p) => {
                  const archived = p.status === "archived";
                  return (
                    <tr key={p.id} className={archived ? "a-row--muted" : undefined}>
                      <td>
                        {isRenderableImage(p.image) ? (
                          /* eslint-disable-next-line @next/next/no-img-element --
                             the catalogue points at a dozen different hosts; the
                             public PlaceImage does the same for the same reason. */
                          <img src={p.image} alt="" className="a-thumb" loading="lazy" />
                        ) : (
                          <span className="a-thumb a-thumb--empty" title="No photo">
                            <Icon name="image" size={14} />
                          </span>
                        )}
                      </td>
                      <td>
                        <Link href={`/admin/places/${p.id}`} className="a-table__strong">
                          {p.name}
                        </Link>
                        <span className="a-table__sub">{p.subcategory}</span>
                      </td>
                      <td>{labels.get(p.categoryId) ?? p.categoryId}</td>
                      <td>
                        {p.city}
                        {p.coordsPrecision !== "exact" && (
                          <span className="a-table__sub" title="Coordinates are a district centre">
                            approximate
                          </span>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={p.status ?? "published"} />
                      </td>
                      <td>
                        <div className="a-table__actions" style={{ justifyContent: "flex-end" }}>
                          <Link
                            href={`/admin/places/${p.id}`}
                            className="t-btn t-btn--secondary t-btn--sm"
                          >
                            Edit
                          </Link>
                          {archived ? (
                            <form action={restorePlace}>
                              <input type="hidden" name="id" value={p.id} />
                              <button type="submit" className="t-btn t-btn--ghost t-btn--sm">
                                Restore
                              </button>
                            </form>
                          ) : (
                            <form action={archivePlace}>
                              <input type="hidden" name="id" value={p.id} />
                              <ConfirmButton
                                label="Archive"
                                question={`Archive ${p.name}?`}
                              />
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="a-pagination">
            {clamped > 1 && (
              <Link href={pageLink(clamped - 1)} className="t-btn t-btn--secondary t-btn--sm">
                <Icon name="chevronLeft" size={14} />
                Prev
              </Link>
            )}
            <span>
              Page {clamped} of {totalPages}
            </span>
            {clamped < totalPages && (
              <Link href={pageLink(clamped + 1)} className="t-btn t-btn--secondary t-btn--sm">
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
