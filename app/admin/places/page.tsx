import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import AdminShell from "../AdminShell";
import { deletePlace } from "./actions";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function PlacesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const admin = await requireAdmin();
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
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, label: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageLink = (p: number) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (categoryFilter) params.set("category", categoryFilter);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/places?${qs}` : "/admin/places";
  };

  return (
    <AdminShell email={admin.email}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Places</h1>
          <p className={styles.pageSub}>{total} listings in the catalog.</p>
        </div>
        <Link href="/admin/places/new" className={`${styles.btn} ${styles.btnPrimary}`}>
          + New place
        </Link>
      </div>

      <form className={styles.toolbar} method="get">
        <div className={styles.field}>
          <label className={styles.label} htmlFor="q">
            Search
          </label>
          <input
            id="q"
            name="q"
            className={styles.input}
            defaultValue={search}
            placeholder="Name, subcategory or city"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="category">
            Category
          </label>
          <select
            id="category"
            name="category"
            className={styles.select}
            defaultValue={categoryFilter}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={`${styles.btn} ${styles.btnSecondary}`}>
          Filter
        </button>
        {(search || categoryFilter) && (
          <Link href="/admin/places" className={`${styles.btn} ${styles.btnSecondary}`}>
            Clear
          </Link>
        )}
      </form>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Subcategory</th>
              <th>City</th>
              <th style={{ width: 150 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {places.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.muted}>
                  No places found.
                </td>
              </tr>
            ) : (
              places.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.categoryId}</td>
                  <td>{p.subcategory}</td>
                  <td>{p.city}</td>
                  <td>
                    <div className={styles.btnRow}>
                      <Link
                        href={`/admin/places/${p.id}`}
                        className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                      >
                        Edit
                      </Link>
                      <form action={deletePlace} className={styles.inlineForm}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        {pageNum > 1 ? (
          <Link
            href={pageLink(pageNum - 1)}
            className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
          >
            ← Prev
          </Link>
        ) : (
          <span />
        )}
        <span>
          Page {pageNum} of {totalPages}
        </span>
        {pageNum < totalPages ? (
          <Link
            href={pageLink(pageNum + 1)}
            className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
          >
            Next →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </AdminShell>
  );
}
