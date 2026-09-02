import Link from "next/link";
import { EmptyRow, PageHead, Panel, StatusBadge } from "@/components/admin/ui";
import { adminDate } from "@/lib/admin/format";
import { requireStaff } from "@/lib/auth";
import { adminSubmissions } from "@/lib/data/business";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireStaff();
  const { status } = await searchParams;

  const active = (TABS.find((t) => t.key === status)?.key ?? "pending") as TabKey;
  const rows = await adminSubmissions(active === "all" ? undefined : active);
  const all = await adminSubmissions();

  const count = (key: TabKey) =>
    key === "all" ? all.length : all.filter((s) => s.status === key).length;

  return (
    <>
      <PageHead
        title="Submissions"
        sub="Listings and changes sent in by businesses, waiting on a decision."
      />

      <Panel
        title={`${rows.length} ${active === "all" ? "in total" : active}`}
        action={
          <div className="t-inline t-wrap">
            {TABS.map((tab) => (
              <Link
                key={tab.key}
                href={`/admin/submissions?status=${tab.key}`}
                className="t-chip t-chip--sm"
                aria-pressed={active === tab.key}
              >
                {tab.label} ({count(tab.key)})
              </Link>
            ))}
          </div>
        }
        flush
      >
        <div className="a-tablewrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>What</th>
                <th>Business</th>
                <th>Sent by</th>
                <th>Received</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Review</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <EmptyRow colSpan={6}>
                  {active === "pending"
                    ? "Nothing waiting. The queue is clear."
                    : "Nothing here."}
                </EmptyRow>
              ) : (
                rows.map((s) => {
                  const payload = s.payload as { name?: string } | null;
                  return (
                    <tr key={s.id}>
                      <td>
                        <span className="a-table__strong">
                          {s.kind === "create"
                            ? payload?.name ?? "A new listing"
                            : "A change"}
                        </span>
                        <span className="a-table__sub">
                          {s.kind === "create" ? "new listing" : s.placeId}
                        </span>
                      </td>
                      <td>
                        {s.business.name}
                        <span className="a-table__sub">{s.business.status}</span>
                      </td>
                      <td>
                        {s.submittedBy.name}
                        <span className="a-table__sub">{s.submittedBy.email}</span>
                      </td>
                      <td>{adminDate(s.createdAt)}</td>
                      <td>
                        <StatusBadge status={s.status} />
                      </td>
                      <td>
                        <div className="a-table__actions" style={{ justifyContent: "flex-end" }}>
                          <Link
                            href={`/admin/submissions/${s.id}`}
                            className="t-btn t-btn--secondary t-btn--sm"
                          >
                            Open
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
