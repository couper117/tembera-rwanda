import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminShell from "../AdminShell";
import { setUserRole, deleteUser } from "./actions";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const admin = await requireAdmin();
  const { error } = await searchParams;

  // Never select passwordHash.
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      handle: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { saves: true, visits: true } },
    },
  });

  return (
    <AdminShell email={admin.email}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Users</h1>
          <p className={styles.pageSub}>{users.length} accounts.</p>
        </div>
      </div>

      {error && <p className={styles.error} style={{ marginBottom: 18 }}>{error}</p>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Handle</th>
              <th>Role</th>
              <th>Saves</th>
              <th>Visits</th>
              <th>Joined</th>
              <th style={{ width: 220 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.muted}>
                  No users yet.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSelf = u.id === admin.id;
                const nextRole = u.role === "ADMIN" ? "USER" : "ADMIN";
                return (
                  <tr key={u.id}>
                    <td>
                      {u.name}
                      {isSelf && <span className={styles.muted}> (you)</span>}
                    </td>
                    <td>{u.email}</td>
                    <td>@{u.handle}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          u.role === "ADMIN" ? styles.badgeAdmin : styles.badgeUser
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>{u._count.saves}</td>
                    <td>{u._count.visits}</td>
                    <td>{u.createdAt.toLocaleDateString()}</td>
                    <td>
                      <div className={styles.btnRow}>
                        <form action={setUserRole} className={styles.inlineForm}>
                          <input type="hidden" name="id" value={u.id} />
                          <input type="hidden" name="role" value={nextRole} />
                          <button
                            type="submit"
                            className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                            disabled={isSelf && nextRole === "USER"}
                          >
                            {u.role === "ADMIN" ? "Demote" : "Promote"}
                          </button>
                        </form>
                        <form action={deleteUser} className={styles.inlineForm}>
                          <input type="hidden" name="id" value={u.id} />
                          <button
                            type="submit"
                            className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                            disabled={isSelf}
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
