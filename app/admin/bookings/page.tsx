import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminShell from "../AdminShell";
import { updateBookingStatus } from "./actions";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

function badgeClass(status: "pending" | "confirmed" | "cancelled") {
  return status === "confirmed"
    ? styles.badgeConfirmed
    : status === "cancelled"
      ? styles.badgeCancelled
      : styles.badgePending;
}

export default async function BookingsPage() {
  const admin = await requireAdmin();

  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminShell email={admin.email}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Bookings</h1>
          <p className={styles.pageSub}>{bookings.length} booking requests, newest first.</p>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Experience</th>
              <th>Guest</th>
              <th>Preferred</th>
              <th>Guests</th>
              <th>Total</th>
              <th>Placed</th>
              <th>Status</th>
              <th style={{ width: 210 }}>Change status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.muted}>
                  No bookings yet.
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.id}</td>
                  <td>{b.experience}</td>
                  <td>
                    {b.fullName}
                    <br />
                    <span className={styles.muted}>{b.email}</span>
                  </td>
                  <td>{b.preferredAt.toLocaleString()}</td>
                  <td>{b.guests}</td>
                  <td>${b.totalPrice.toLocaleString()}</td>
                  <td>{b.createdAt.toLocaleDateString()}</td>
                  <td>
                    <span className={`${styles.badge} ${badgeClass(b.status)}`}>
                      {b.status}
                    </span>
                  </td>
                  <td>
                    <form action={updateBookingStatus} className={styles.btnRow} style={{ gap: 8 }}>
                      <input type="hidden" name="id" value={b.id} />
                      <select name="status" defaultValue={b.status} className={styles.select}>
                        <option value="pending">pending</option>
                        <option value="confirmed">confirmed</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                      <button
                        type="submit"
                        className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                      >
                        Save
                      </button>
                    </form>
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
