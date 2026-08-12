import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminShell from "../AdminShell";
import CategoryForm from "./CategoryForm";
import {
  deleteCategory,
  addSubcategory,
  renameSubcategory,
  deleteSubcategory,
} from "./actions";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; error?: string }>;
}) {
  const admin = await requireAdmin();
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
    <AdminShell email={admin.email}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Categories</h1>
          <p className={styles.pageSub}>Top-level taxonomy and their subcategories.</p>
        </div>
      </div>

      {error && <p className={styles.error} style={{ marginBottom: 18 }}>{error}</p>}

      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>
          {editing ? `Edit category: ${editing.id}` : "New category"}
        </h2>
        {editing ? (
          <>
            <CategoryForm
              mode="edit"
              values={{
                id: editing.id,
                label: editing.label,
                title: editing.title,
                icon: editing.icon,
                primary: editing.primary,
                sortOrder: editing.sortOrder,
              }}
            />
            <div className={styles.btnRow} style={{ marginTop: 12 }}>
              <Link
                href="/admin/categories"
                className={`${styles.btn} ${styles.btnSecondary}`}
              >
                Done editing
              </Link>
            </div>
          </>
        ) : (
          <CategoryForm mode="create" />
        )}
      </div>

      {categories.map((c) => (
        <div key={c.id} className={styles.panel}>
          <div className={styles.pageHead} style={{ marginBottom: 12 }}>
            <div>
              <h3 className={styles.panelTitle} style={{ marginBottom: 2 }}>
                {c.label} <span className={styles.muted}>({c.id})</span>
                {c.primary && (
                  <span className={`${styles.badge} ${styles.badgeAdmin}`} style={{ marginLeft: 8 }}>
                    primary
                  </span>
                )}
              </h3>
              <span className={styles.muted}>
                {c.title} · sort {c.sortOrder} · {placeCount.get(c.id) ?? 0} places
              </span>
            </div>
            <div className={styles.btnRow}>
              <Link
                href={`/admin/categories?edit=${c.id}`}
                className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
              >
                Edit
              </Link>
              <form action={deleteCategory} className={styles.inlineForm}>
                <input type="hidden" name="id" value={c.id} />
                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                >
                  Delete
                </button>
              </form>
            </div>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Subcategory</th>
                <th style={{ width: 110 }}>Sort</th>
                <th style={{ width: 220 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {c.subcategories.length === 0 ? (
                <tr>
                  <td colSpan={3} className={styles.muted}>
                    No subcategories yet.
                  </td>
                </tr>
              ) : (
                c.subcategories.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <form
                        action={renameSubcategory}
                        className={styles.btnRow}
                        style={{ gap: 8 }}
                      >
                        <input type="hidden" name="subId" value={s.id} />
                        <input
                          name="name"
                          className={styles.input}
                          defaultValue={s.name}
                          style={{ maxWidth: 200 }}
                        />
                        <input
                          name="sortOrder"
                          type="number"
                          className={styles.input}
                          defaultValue={s.sortOrder}
                          style={{ maxWidth: 80 }}
                        />
                        <button
                          type="submit"
                          className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                        >
                          Save
                        </button>
                      </form>
                    </td>
                    <td className={styles.muted}>{s.sortOrder}</td>
                    <td>
                      <form action={deleteSubcategory} className={styles.inlineForm}>
                        <input type="hidden" name="subId" value={s.id} />
                        <button
                          type="submit"
                          className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                        >
                          Remove
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <form action={addSubcategory} className={styles.btnRow} style={{ marginTop: 12 }}>
            <input type="hidden" name="categoryId" value={c.id} />
            <input
              name="name"
              className={styles.input}
              placeholder="New subcategory"
              style={{ maxWidth: 220 }}
              required
            />
            <input
              name="sortOrder"
              type="number"
              className={styles.input}
              placeholder="0"
              defaultValue={0}
              style={{ maxWidth: 90 }}
            />
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`}>
              Add
            </button>
          </form>
        </div>
      ))}
    </AdminShell>
  );
}
