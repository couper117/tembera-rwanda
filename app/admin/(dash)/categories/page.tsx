import Link from "next/link";
import Icon from "@/components/Icon";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { PageHead, Panel } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import CategoryForm from "./CategoryForm";
import {
  deleteCategory,
  addSubcategory,
  renameSubcategory,
  deleteSubcategory,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; error?: string }>;
}) {
  const { edit, error } = await searchParams;

  const [categories, counts] = await Promise.all([
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { subcategories: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } },
    }),
    prisma.place.groupBy({ by: ["categoryId"], _count: { _all: true } }),
  ]);

  const placeCount = new Map(counts.map((c) => [c.categoryId, c._count._all]));
  const editing = edit ? categories.find((c) => c.id === edit) ?? null : null;

  return (
    <>
      <PageHead
        title="Categories"
        sub={`${categories.length} top-level categories and their subcategories.`}
      />

      {error && (
        <div className="t-notice t-notice--danger" style={{ marginBottom: "var(--t-4)" }}>
          <span className="t-notice__icon">
            <Icon name="alert" size={16} />
          </span>
          <div className="t-notice__body">{error}</div>
        </div>
      )}

      <Panel
        title={editing ? `Edit ${editing.label}` : "New category"}
        action={
          editing && (
            <Link href="/admin/categories" className="t-btn t-btn--ghost t-btn--sm">
              Done editing
            </Link>
          )
        }
      >
        {editing ? (
          <CategoryForm
            mode="edit"
            values={{
              id: editing.id,
              label: editing.label,
              title: editing.title,
              icon: editing.icon,
              primary: editing.primary,
              sensitive: editing.sensitive,
              sortOrder: editing.sortOrder,
            }}
          />
        ) : (
          <CategoryForm mode="create" />
        )}
      </Panel>

      {categories.map((c) => (
        <Panel
          key={c.id}
          title={`${c.label} · ${placeCount.get(c.id) ?? 0} places`}
          action={
            <div className="a-table__actions">
              {c.primary && <span className="a-badge a-badge--good">primary</span>}
              <Link
                href={`/admin/categories?edit=${c.id}`}
                className="t-btn t-btn--secondary t-btn--sm"
              >
                Edit
              </Link>
              <form action={deleteCategory}>
                <input type="hidden" name="id" value={c.id} />
                <ConfirmButton question={`Delete ${c.label}?`} />
              </form>
            </div>
          }
          flush
        >
          <div className="a-tablewrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Subcategory</th>
                  <th>Sort</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {c.subcategories.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <p className="a-empty">No subcategories yet.</p>
                    </td>
                  </tr>
                ) : (
                  c.subcategories.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <form action={renameSubcategory} className="a-table__actions">
                          <input type="hidden" name="subId" value={s.id} />
                          <input
                            name="name"
                            className="a-input"
                            defaultValue={s.name}
                            style={{ maxWidth: 220 }}
                            aria-label={`Rename ${s.name}`}
                          />
                          <input
                            name="sortOrder"
                            type="number"
                            className="a-input"
                            defaultValue={s.sortOrder}
                            style={{ maxWidth: 90 }}
                            aria-label={`Sort order for ${s.name}`}
                          />
                          <button type="submit" className="t-btn t-btn--secondary t-btn--sm">
                            Save
                          </button>
                        </form>
                      </td>
                      <td>{s.sortOrder}</td>
                      <td>
                        <div className="a-table__actions">
                          <form action={deleteSubcategory}>
                            <input type="hidden" name="subId" value={s.id} />
                            <ConfirmButton label="Remove" question={`Remove ${s.name}?`} />
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <form action={addSubcategory} className="a-toolbar" style={{ borderTop: "1px solid var(--t-border)", borderBottom: "none" }}>
            <input type="hidden" name="categoryId" value={c.id} />
            <input
              name="name"
              className="a-input"
              placeholder="New subcategory"
              aria-label={`New subcategory for ${c.label}`}
              required
            />
            <input
              name="sortOrder"
              type="number"
              className="a-input"
              defaultValue={0}
              style={{ maxWidth: 90 }}
              aria-label="Sort order"
            />
            <button type="submit" className="t-btn t-btn--primary t-btn--sm">
              <Icon name="plus" size={14} />
              Add
            </button>
          </form>
        </Panel>
      ))}
    </>
  );
}
