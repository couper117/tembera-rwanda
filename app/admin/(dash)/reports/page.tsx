import Link from "next/link";
import { PageHead, Panel, StatusBadge, EmptyRow } from "@/components/admin/ui";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { adminDate } from "@/lib/admin/placeholder";
import { requireStaff } from "@/lib/auth";
import { adminReports } from "@/lib/data/moderation";
import { REPORT_KIND_LABEL } from "@/lib/reports/kinds";
import { deleteReportAction, setReportStatusAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await requireStaff();
  const reports = await adminReports();

  const open = reports.filter((r) => r.status === "open").length;

  return (
    <>
      <PageHead
        title="Reports"
        sub={
          reports.length === 0
            ? "Nobody has reported a problem yet."
            : `${open} open of ${reports.length} total. Corrections from visitors and businesses.`
        }
      />

      <Panel title="Reported problems" flush>
        <div className="a-tablewrap">
          <table className="a-table">
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
                <EmptyRow colSpan={8}>
                  No reports. The button lives at the bottom of every place page.
                </EmptyRow>
              ) : (
                reports.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>
                      <Link href={`/admin/places/${r.place.id}`} className="a-table__strong">
                        {r.place.name}
                      </Link>
                      <span className="a-table__sub">{r.place.city}</span>
                    </td>
                    <td>{REPORT_KIND_LABEL[r.kind] ?? r.kind}</td>
                    <td style={{ maxWidth: 320, whiteSpace: "pre-wrap" }}>{r.body}</td>
                    <td>
                      {r.contact ? (
                        <a href={`mailto:${r.contact}`}>{r.contact}</a>
                      ) : (
                        <span className="a-table__sub">Not given</span>
                      )}
                    </td>
                    <td>{adminDate(r.createdAt)}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>
                      <div className="a-table__actions" style={{ flexWrap: "wrap" }}>
                        <form action={setReportStatusAction} className="a-table__actions">
                          <input type="hidden" name="id" value={r.id} />
                          <select
                            name="status"
                            defaultValue={r.status}
                            className="a-select"
                            style={{ width: "auto" }}
                            aria-label={`Status for report ${r.id}`}
                          >
                            <option value="open">open</option>
                            <option value="resolved">resolved</option>
                            <option value="dismissed">dismissed</option>
                          </select>
                          <button type="submit" className="t-btn t-btn--secondary t-btn--sm">
                            Save
                          </button>
                        </form>
                        <form action={deleteReportAction}>
                          <input type="hidden" name="id" value={r.id} />
                          <ConfirmButton question={`Delete report ${r.id}?`} />
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
