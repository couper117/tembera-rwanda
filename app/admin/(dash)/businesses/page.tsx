import Link from "next/link";
import Icon from "@/components/Icon";
import { EmptyRow, PageHead, Panel, Stat, StatusBadge } from "@/components/admin/ui";
import { adminDate } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/auth";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { adminBusinesses, pendingRegistrations } from "@/lib/data/business";
import { formatRwf, planById } from "@/lib/business/plans";
import { decideRegistrationAction, setBusinessStatusAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function BusinessesPage() {
  // ADMIN only: verifying a business says Tembera has checked who they are.
  await requireAdmin();

  const [businesses, waiting] = await Promise.all([
    adminBusinesses(),
    pendingRegistrations(),
  ]);
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

      {/* The money queue sits above the account list because it is the only
          thing on this screen with somebody waiting at the other end of it.
          Confirming here is what creates the account — see
          decideRegistrationAction. */}
      {waiting.length > 0 && (
        <Panel
          title={`Paid sign-ups awaiting payment (${waiting.length})`}
          flush
        >
          <div className="a-tablewrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Contact</th>
                  <th>Plan</th>
                  <th>Owed</th>
                  <th>Reference</th>
                  <th style={{ textAlign: "right" }}>Payment</th>
                </tr>
              </thead>
              <tbody>
                {waiting.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="a-table__strong">{r.businessName}</span>
                      <span className="a-table__sub">
                        {r.city} · waiting since {adminDate(r.createdAt)}
                      </span>
                    </td>
                    <td>
                      {r.contactName}
                      <span className="a-table__sub">
                        {r.email} · {r.phone}
                      </span>
                    </td>
                    <td>{planById(r.plan)?.name ?? r.plan}</td>
                    <td>{formatRwf(r.amountRwf)}</td>
                    <td>
                      {/* The string an admin matches against the statement. */}
                      <code className="a-ref">{r.reference}</code>
                    </td>
                    <td>
                      <div className="a-table__actions">
                        <form action={decideRegistrationAction}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="decision" value="confirm" />
                          <button type="submit" className="t-btn t-btn--primary t-btn--sm">
                            <Icon name="check" size={14} />
                            Payment received
                          </button>
                        </form>
                        <form action={decideRegistrationAction}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="decision" value="reject" />
                          <ConfirmButton
                            label="Reject"
                            question="Reject this sign-up?"
                          />
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="a-hint" style={{ padding: "var(--t-3) var(--t-4)" }}>
            Confirming creates the account and the business, and grants the
            verified tick. Only do it once the money is on the statement — this
            is the only check between choosing a paid plan and having one.
          </p>
        </Panel>
      )}

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
