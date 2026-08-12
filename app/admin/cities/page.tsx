import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminShell from "../AdminShell";
import CityForm from "./CityForm";
import { deleteCity } from "./actions";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default async function CitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const admin = await requireAdmin();
  const { edit } = await searchParams;
  const editId = edit ? Number(edit) : NaN;

  const cities = await prisma.city.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const editing = Number.isInteger(editId)
    ? cities.find((c) => c.id === editId) ?? null
    : null;

  return (
    <AdminShell email={admin.email}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Cities</h1>
          <p className={styles.pageSub}>The district / city directory.</p>
        </div>
      </div>

      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>
          {editing ? `Edit city: ${editing.name}` : "New city"}
        </h2>
        {editing ? (
          <CityForm
            mode="edit"
            values={{
              id: editing.id,
              name: editing.name,
              group: editing.group ?? "",
              province: editing.province ?? "",
              lat: editing.lat?.toString() ?? "",
              lng: editing.lng?.toString() ?? "",
              image: editing.image ?? "",
              sortOrder: editing.sortOrder,
            }}
          />
        ) : (
          <CityForm mode="create" />
        )}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Group</th>
              <th>Province</th>
              <th>Lat</th>
              <th>Lng</th>
              <th>Sort</th>
              <th style={{ width: 150 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cities.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.muted}>
                  No cities yet.
                </td>
              </tr>
            ) : (
              cities.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.group ?? <span className={styles.muted}>—</span>}</td>
                  <td>{c.province ?? <span className={styles.muted}>—</span>}</td>
                  <td>{c.lat ?? <span className={styles.muted}>—</span>}</td>
                  <td>{c.lng ?? <span className={styles.muted}>—</span>}</td>
                  <td>{c.sortOrder}</td>
                  <td>
                    <div className={styles.btnRow}>
                      <Link
                        href={`/admin/cities?edit=${c.id}`}
                        className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                      >
                        Edit
                      </Link>
                      <form action={deleteCity} className={styles.inlineForm}>
                        <input type="hidden" name="id" value={c.id} />
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
    </AdminShell>
  );
}
