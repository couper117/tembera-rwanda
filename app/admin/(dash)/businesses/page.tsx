import Link from "next/link";
import Icon from "@/components/Icon";
import { EmptyRow, PageHead, Panel, Stat, StatusBadge } from "@/components/admin/ui";
import { adminDate } from "@/lib/admin/placeholder";
import { requireAdmin } from "@/lib/auth";
import { adminBusinesses } from "@/lib/data/business";
import { setBusinessStatusAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function BusinessesPage() {
  // ADMIN only: verifying a business says Tembera has checked who they are.
  await requireAdmin();

  const businesses = await adminBusinesses();
  const verified = businesses.filter((b) => b.status === "verified").length;
  const unverified = businesses.filter((b) => b.status === "unverified").length;
  const listings = businesses.reduce((sum, b) => sum + b._count.places, 0);

  return (
    <>
      <PageHead
        title="Businesses"
        sub="Hotels, restaurants and operators with an account on Tembera."
      />

      <div className="a-stats">
        <Stat label="Accounts" value={businesses.length} icon="basket" />
        <Stat label="Verified" value={verified} icon="check" note="publish without review" />
        <Stat label="Unverified" value={unverified} icon="alert" note="need checking" />
        <Stat label="Listings" value={listings} icon="pin" note="owned by businesses" />
      </div>

      <Panel title="All accounts" flush>
        <div className="a-tablewrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Contact</th>
                <th>District</th>
                <th>TIN</th>
                <th>Listings</th>
                <th>Joined</th>
                <th>Standing</th>
                <th style={{ textAlign: "right" }}>Change</th>
              </tr>
            </thead>
            <tbody>
              {businesses.length === 0 ? (
                <EmptyRow colSpan={8}>
                  No business accounts yet. They register at{" "}
                  <Link href="/business/register">/business/register</Link>.
                </EmptyRow>
              ) : (
                businesses.map((b) => (
                  <tr key={b.id} className={b.status === "suspended" ? "a-row--muted" : undefined}>
                    <td>
                      <span className="a-table__strong">{b.name}</span>
                      <span className="a-table__sub">
                        {b._count.members} {b._count.members === 1 ? "person" : "people"} · {b.plan}
                      </span>
                    </td>
                    <td>
                      {b.contactName}
                      <span className="a-table__sub">{b.email}</span>
                    </td>
                    <td>{b.city}</td>
                    <td>
                      {b.tin ?? (
                        <span className="a-table__sub" title="Needed before verifying">
                          not given
                        </span>
                      )}
                    </td>
                    <td>
                      {b._count.places}
                      {b._count.submissions > 0 && (
                        <span className="a-table__sub">{b._count.submissions} sent in</span>
                      )}
                    </td>
                    <td>{adminDate(b.createdAt)}</td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td>
                      <div className="a-table__actions" style={{ justifyContent: "flex-end" }}>
                        <form action={setBusinessStatusAction} className="a-table__actions">
                          <input type="hidden" name="id" value={b.id} />
                          <select
                            name="status"
                            defaultValue={b.status}
                            className="a-select"
                            style={{ width: "auto" }}
                            aria-label={`Standing for ${b.name}`}
                          >
                            <option value="unverified">unverified</option>
                            <option value="verified">verified</option>
                            <option value="suspended">suspended</option>
                          </select>
                          <button type="submit" className="t-btn t-btn--secondary t-btn--sm">
                            Save
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
      </Panel>

      <p className="a-hint" style={{ marginTop: "var(--t-3)" }}>
        <Icon name="info" size={14} /> Verifying a business lets its edits go live
        without review. Check the TIN against the Rwanda Revenue Authority first.
      </p>
    </>
  );
}
