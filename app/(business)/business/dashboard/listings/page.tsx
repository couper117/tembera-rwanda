import Link from "next/link";
import Icon from "@/components/Icon";
import { EmptyRow, PageHead, Panel, StatusBadge } from "@/components/admin/ui";
import { requireBusiness } from "@/lib/auth";
import { getMyBusiness, getMyPlaces } from "@/lib/data/business";
import { isRenderableImage } from "@/lib/places/engine";

export const dynamic = "force-dynamic";

export default async function MyListingsPage() {
  const user = await requireBusiness();
  const business = await getMyBusiness(user.id);
  if (!business) return null;

  const places = await getMyPlaces(business.id);

  return (
    <>
      <PageHead
        title="My listings"
        sub={
          places.length === 0
            ? "Nothing yet."
            : `${places.length} listing${places.length === 1 ? "" : "s"} you manage.`
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

      <Panel title="Listings" flush>
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
