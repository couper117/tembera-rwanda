import Link from "next/link";
import Icon from "@/components/Icon";
import { PageHead, Panel, SampleNotice, Stat, StatusBadge } from "@/components/admin/ui";
import { BUSINESSES, adminDate } from "@/lib/admin/placeholder";

export const dynamic = "force-dynamic";

export default async function BusinessesPage() {
  const verified = BUSINESSES.filter((b) => b.status === "verified").length;
  const unverified = BUSINESSES.filter((b) => b.status === "unverified").length;
  const listings = BUSINESSES.reduce((sum, b) => sum + b.listings, 0);

  return (
    <>
      <PageHead
        title="Businesses"
        sub="Hotels, restaurants and operators with an account on Tembera."
        actions={
          <button type="button" className="t-btn t-btn--primary t-btn--sm" disabled>
            <Icon name="plus" size={15} />
            Invite business
          </button>
        }
      />

      <SampleNotice what="Business accounts" />

      <div className="a-stats">
        <Stat label="Accounts" value={BUSINESSES.length} icon="basket" />
        <Stat label="Verified" value={verified} icon="check" note="can publish" />
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
                <th>City</th>
                <th>TIN</th>
                <th>Listings</th>
                <th>Joined</th>
                <th>Standing</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {BUSINESSES.map((b) => (
                <tr key={b.id}>
                  <td>
                    <span className="a-table__strong">{b.name}</span>
                    <span className="a-table__sub">{b.id}</span>
                  </td>
                  <td>
                    {b.contactName}
                    <span className="a-table__sub">{b.email}</span>
                  </td>
                  <td>{b.city}</td>
                  <td>{b.tin}</td>
                  <td>
                    {b.listings} live
                    {b.pending > 0 && <span className="a-table__sub">{b.pending} pending</span>}
                  </td>
                  <td>{adminDate(b.joinedAt)}</td>
                  <td>
                    <StatusBadge status={b.status} />
                  </td>
                  <td>
                    <div className="a-table__actions">
                      {b.pending > 0 && (
                        <Link
                          href="/admin/submissions?status=pending"
                          className="t-btn t-btn--secondary t-btn--sm"
                        >
                          Review
                        </Link>
                      )}
                      <button type="button" className="t-btn t-btn--ghost t-btn--sm" disabled>
                        Manage
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
