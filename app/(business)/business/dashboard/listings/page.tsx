import Link from "next/link";
import Icon from "@/components/Icon";
import { EmptyRow, PageHead, Panel, StatusBadge } from "@/components/admin/ui";
import { requireBusiness } from "@/lib/auth";
import { getMyBusiness, getMyPlaces, getMySubmissions } from "@/lib/data/business";
import { adminDate } from "@/lib/admin/placeholder";
import { isRenderableImage } from "@/lib/places/engine";

export const dynamic = "force-dynamic";

export default async function MyListingsPage() {
  const user = await requireBusiness();
  const business = await getMyBusiness(user.id);
  if (!business) return null;

  const [places, submissions] = await Promise.all([
    getMyPlaces(business.id),
    getMySubmissions(business.id),
  ]);

  /*
   * A proposed listing has no Place row until Tembera approves it, so it was
   * invisible here — you sent something in and nothing appeared, which reads
   * as the submission having failed. Pending and rejected proposals are shown
   * alongside the real listings, clearly marked as not live yet.
   */
  const proposals = submissions.filter(
    (s) => s.kind === "create" && s.status !== "approved",
  );

  return (
    <>
      <PageHead
        title="My listings"
        sub={
          places.length === 0 && proposals.length === 0
            ? "Nothing yet."
            : `${places.length} live, ${proposals.length} waiting on Tembera.`
        }
        actions={
          <Link
            href="/business/dashboard/listings/new"
            className="t-btn t-btn--primary t-btn--sm"
          >
            <Icon name="plus" size={15} />
            Propose a listing
          </Link>
        }
      />

      {proposals.length > 0 && (
        <Panel title="Waiting on Tembera" flush>
          <div className="a-tablewrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>District</th>
                  <th>Sent</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((s) => {
                  const payload = s.payload as
                    | { name?: string; city?: string; subcategory?: string }
                    | null;
                  return (
                    <tr key={s.id}>
                      <td>
                        <span className="a-table__strong">
                          {payload?.name ?? "A new listing"}
                        </span>
                        <span className="a-table__sub">{payload?.subcategory ?? ""}</span>
                      </td>
                      <td>{payload?.city ?? "—"}</td>
                      <td>{adminDate(s.createdAt)}</td>
                      <td>
                        <StatusBadge status={s.status} />
                        {s.status === "rejected" && s.rejectionReason && (
                          <span className="a-table__sub">{s.rejectionReason}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Panel title={proposals.length > 0 ? "Live listings" : "Listings"} flush>
        <div className="a-tablewrap">
          <table className="a-table">
            <thead>
              <tr>
                <th style={{ width: 52 }}>
                  <span className="a-visually-hidden">Photo</span>
                </th>
                <th>Name</th>
                <th>District</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {places.length === 0 ? (
                <EmptyRow colSpan={5}>
                  Tembera may already list your business. Find it on the site and
                  use &ldquo;Is this your business?&rdquo; to claim it — that is
                  quicker than proposing a new one.
                </EmptyRow>
              ) : (
                places.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {isRenderableImage(p.image ?? undefined) ? (
                        /* eslint-disable-next-line @next/next/no-img-element --
                           photos come from many hosts; the public PlaceImage
                           uses a plain img for the same reason. */
                        <img src={p.image!} alt="" className="a-thumb" loading="lazy" />
                      ) : (
                        <span className="a-thumb a-thumb--empty" title="No photo">
                          <Icon name="image" size={14} />
                        </span>
                      )}
                    </td>
                    <td>
                      <Link
                        href={`/business/dashboard/listings/${p.id}`}
                        className="a-table__strong"
                      >
                        {p.name}
                      </Link>
                      <span className="a-table__sub">{p.subcategory}</span>
                    </td>
                    <td>{p.city}</td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td>
                      <div className="a-table__actions" style={{ justifyContent: "flex-end" }}>
                        <Link
                          href={`/business/dashboard/listings/${p.id}`}
                          className="t-btn t-btn--secondary t-btn--sm"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/place/${p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="t-btn t-btn--ghost t-btn--sm"
                        >
                          View
                        </Link>
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
