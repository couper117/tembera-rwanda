import Link from "next/link";
import { PageHead, Panel, StatusBadge, EmptyRow } from "@/components/admin/ui";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { adminDate } from "@/lib/admin/placeholder";
import { prisma } from "@/lib/prisma";
import { planById } from "@/lib/business/plans";
import { deleteClaimAction, setClaimStatusAction } from "./actions";

export const dynamic = "force-dynamic";

/**
 * Businesses asking to take ownership of their own listing — the queue behind
 * the "Claim your listing" form on /business and on every place page.
 *
 * This is real. Every row is something a person typed and expects a call
 * about, which is why the contact details sit in the table rather than behind
 * a click: the job here is to pick up the phone, not to read a record.
 */
export default async function ClaimsPage() {
  const claims = await prisma.businessClaim.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { place: { select: { id: true, name: true, city: true } } },
  });

  const pending = claims.filter((c) => c.status === "pending").length;

  return (
    <>
      <PageHead
        title="Claims"
        sub={
          claims.length === 0
            ? "No business has claimed a listing yet."
            : `${pending} waiting of ${claims.length} total. Call to confirm the business is theirs before approving.`
        }
      />

      <Panel title="Listing claims" flush>
        <div className="a-tablewrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Business</th>
                <th>Listing</th>
                <th>Plan</th>
                <th>Who to call</th>
                <th>Note</th>
                <th>Received</th>
                <th>Status</th>
                <th style={{ width: 230 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {claims.length === 0 ? (
                <EmptyRow colSpan={9}>
                  No claims yet. The form is on /business and at the bottom of
                  every place page.
                </EmptyRow>
              ) : (
                claims.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>
                      <span className="a-table__strong">{c.businessName}</span>
                      <span className="a-table__sub">{c.email}</span>
                    </td>
                    <td>
                      {c.place ? (
                        <Link
                          href={`/admin/places/${c.place.id}`}
                          className="a-table__strong"
                        >
                          {c.place.name}
                        </Link>
                      ) : (
                        <span className="a-table__sub">
                          Not matched — find it by hand
                        </span>
                      )}
                      {c.place && <span className="a-table__sub">{c.place.city}</span>}
                    </td>
                    <td>{planById(c.plan)?.name ?? c.plan}</td>
                    <td>
                      <span className="a-table__strong">{c.contactName}</span>
                      <span className="a-table__sub">
                        <a href={`tel:${c.phone.replace(/\s/g, "")}`}>{c.phone}</a>
                      </span>
                    </td>
                    <td style={{ maxWidth: 260, whiteSpace: "pre-wrap" }}>
                      {c.note || <span className="a-table__sub">—</span>}
                    </td>
                    <td>{adminDate(c.createdAt)}</td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>
                      <div className="a-table__actions" style={{ flexWrap: "wrap" }}>
                        <form action={setClaimStatusAction} className="a-table__actions">
                          <input type="hidden" name="id" value={c.id} />
                          <select
                            name="status"
                            defaultValue={c.status}
                            className="a-select"
                            style={{ width: "auto" }}
                            aria-label={`Status for claim ${c.id}`}
                          >
                            <option value="pending">pending</option>
                            <option value="approved">approved</option>
                            <option value="rejected">rejected</option>
                          </select>
                          <button type="submit" className="t-btn t-btn--secondary t-btn--sm">
                            Save
                          </button>
                        </form>
                        <form action={deleteClaimAction}>
                          <input type="hidden" name="id" value={c.id} />
                          <ConfirmButton question={`Delete claim ${c.id}?`} />
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
