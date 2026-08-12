import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminShell from "./AdminShell";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: "pending" | "confirmed" | "cancelled" }) {
  const cls =
    status === "confirmed"
      ? styles.badgeConfirmed
      : status === "cancelled"
        ? styles.badgeCancelled
        : styles.badgePending;
  return <span className={`${styles.badge} ${cls}`}>{status}</span>;
}

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  const [places, categories, cities, users, bookings, pending, recent] =
    await Promise.all([
      prisma.place.count(),
      prisma.category.count(),
      prisma.city.count(),
      prisma.user.count(),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "pending" } }),
      prisma.booking.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

  const stats = [
    { label: "Places", value: places },
    { label: "Categories", value: categories },
    { label: "Cities", value: cities },
    { label: "Users", value: users },
    { label: "Bookings", value: bookings },
    { label: "Pending Bookings", value: pending },
  ];

  return (
    <AdminShell email={admin.email}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSub}>Overview of the Tembera catalog and activity.</p>
        </div>
      </div>

      <div className={styles.cards}>
        {stats.map((s) => (
          <div key={s.label} className={styles.card}>
            <p className={styles.statLabel}>{s.label}</p>
            <p className={styles.statValue}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Recent bookings</h2>
        {recent.length === 0 ? (
          <p className={styles.muted}>No bookings yet.</p>
        ) : (
          <div className={styles.tableWrap} style={{ border: "none" }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Experience</th>
                  <th>Guest</th>
                  <th>Preferred</th>
                  <th>Guests</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Placed</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((b) => (
                  <tr key={b.id}>
                    <td>{b.experience}</td>
                    <td>
                      {b.fullName}
                      <br />
                      <span className={styles.muted}>{b.email}</span>
                    </td>
                    <td>{b.preferredAt.toLocaleDateString()}</td>
                    <td>{b.guests}</td>
                    <td>${b.totalPrice.toLocaleString()}</td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td>{b.createdAt.toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
