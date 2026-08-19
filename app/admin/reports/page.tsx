import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminShell from "../AdminShell";
import { deleteReportAction, setReportStatusAction } from "./actions";
import { REPORT_KIND_LABEL } from "@/lib/reports/kinds";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

function badgeClass(status: "open" | "resolved" | "dismissed") {
  return status === "resolved"
    ? styles.badgeConfirmed
    : status === "dismissed"
      ? styles.badgeCancelled
      : styles.badgePending;
}

export default async function ReportsPage() {
  const admin = await requireAdmin();

  const reports = await prisma.report.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { place: { select: { id: true, name: true, city: true } } },
  });

  const open = reports.filter((r) => r.status === "open").length;

  return (
    <AdminShell email={admin.email}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Reports</h1>
          <p className={styles.pageSub}>
            {reports.length === 0
              ? "Nobody has reported a problem yet."
              : `${open} open of ${reports.length} total. Corrections from visitors and businesses.`}
          </p>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Place</th>
              <th>Problem</th>
              <th>What they said</th>
              <th>Contact</th>
              <th>Received</th>
              <th>Status</th>
              <th style={{ width: 230 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.muted}>
                  No reports. The button lives at the bottom of every place page.
                </td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>
                    <Link href={`/admin/places/${r.place.id}`}>{r.place.name}</Link>
                    <br />
                    <span className={styles.muted}>{r.place.city}</span>
                  </td>
                  <td>{REPORT_KIND_LABEL[r.kind] ?? r.kind}</td>
                  <td style={{ maxWidth: 320, whiteSpace: "pre-wrap" }}>{r.body}</td>
                  <td>
                    {r.contact ? (
                      r.contact
                    ) : (
                      <span className={styles.muted}>Not given</span>
                    )}
                  </td>
                  <td>{r.createdAt.toLocaleDateString()}</td>
                  <td>
                    <span className={`${styles.badge} ${badgeClass(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.btnRow} style={{ gap: 8, flexWrap: "wrap" }}>
                      <form action={setReportStatusAction} className={styles.btnRow} style={{ gap: 8 }}>
                        <input type="hidden" name="id" value={r.id} />
                        <select name="status" defaultValue={r.status} className={styles.select}>
                          <option value="open">open</option>
                          <option value="resolved">resolved</option>
                          <option value="dismissed">dismissed</option>
                        </select>
                        <button
                          type="submit"
                          className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                        >
                          Save
                        </button>
                      </form>
                      <form action={deleteReportAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <button
                          type="submit"
                          className={`${styles.btn} ${styles.btnSmall}`}
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
