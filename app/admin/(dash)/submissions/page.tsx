import Link from "next/link";
import Icon from "@/components/Icon";
import { PageHead, Panel, SampleNotice, StatusBadge } from "@/components/admin/ui";
import { SUBMISSIONS, adminDate, type SubmissionStatus } from "@/lib/admin/placeholder";

export const dynamic = "force-dynamic";

const TABS: { key: SubmissionStatus | "all"; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = (TABS.find((t) => t.key === status)?.key ?? "pending") as
    | SubmissionStatus
    | "all";

  const rows =
    active === "all" ? SUBMISSIONS : SUBMISSIONS.filter((s) => s.status === active);

  const count = (key: SubmissionStatus) =>
    SUBMISSIONS.filter((s) => s.status === key).length;

  return (
    <>
      <PageHead
        title="Submissions"
        sub="Listings sent in by businesses, waiting on a decision before they go live."
      />

      <SampleNotice what="Business submissions" />

      <Panel
        title={`${rows.length} ${active === "all" ? "total" : active}`}
        action={
          <div className="t-inline t-wrap">
            {TABS.map((tab) => (
              <Link
                key={tab.key}
                href={`/admin/submissions?status=${tab.key}`}
                className="t-chip t-chip--sm"
                aria-pressed={active === tab.key}
              >
                {tab.label}
                {tab.key !== "all" && ` (${count(tab.key as SubmissionStatus)})`}
              </Link>
            ))}
          </div>
        }
        flush
      >
        {rows.length === 0 ? (
          <p className="a-empty">Nothing here. The queue is clear.</p>
        ) : (
          <div className="a-tablewrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Listing</th>
                  <th>Business</th>
                  <th>Category</th>
                  <th>City</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Review</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span className="a-table__strong">{s.placeName}</span>
                      <span className="a-table__sub">{s.id}</span>
                    </td>
                    <td>
                      {s.businessName}
                      <span className="a-table__sub">{s.submittedBy}</span>
                    </td>
                    <td>{s.subcategory}</td>
                    <td>{s.city}</td>
                    <td>{adminDate(s.submittedAt)}</td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                    <td>
                      <div className="a-table__actions">
                        <Link
                          href={`/admin/submissions/${s.id}`}
                          className="t-btn t-btn--secondary t-btn--sm"
                        >
                          Open
                          <Icon name="chevronRight" size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
