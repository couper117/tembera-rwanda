import Link from "next/link";
import Icon from "@/components/Icon";
import { EmptyRow, PageHead, Panel, Stat, StatusBadge } from "@/components/admin/ui";
import { adminDate } from "@/lib/admin/format";
import { requireBusiness } from "@/lib/auth";
import {
  getMyBusiness,
  getMyPlaces,
  getMyReviews,
  getMySubmissions,
} from "@/lib/data/business";

export const dynamic = "force-dynamic";

export default async function BusinessOverviewPage() {
  const user = await requireBusiness();
  const business = await getMyBusiness(user.id);
  if (!business) return null; // the layout has already redirected

  const [places, submissions, reviews] = await Promise.all([
    getMyPlaces(business.id),
    getMySubmissions(business.id),
    getMyReviews(business.id),
  ]);

  const pending = submissions.filter((s) => s.status === "pending");
  const rejected = submissions.filter((s) => s.status === "rejected");
  const rated = reviews.filter((r) => r.rating > 0);
  const average =
    rated.length > 0 ? rated.reduce((sum, r) => sum + r.rating, 0) / rated.length : null;

  return (
    <>
      <PageHead
        title={`Welcome, ${user.name.split(" ")[0]}`}
        sub="Your listings on Tembera, and anything waiting on us."
      />

      {/*
        Standing decides whether an edit publishes or queues, so it is
        explained here in plain words rather than left as a badge to decode.
      */}
      {business.status === "unverified" && (
        <div className="t-notice" style={{ marginBottom: "var(--t-4)" }}>
          <span className="t-notice__icon">
            <Icon name="info" size={16} />
          </span>
          <div className="t-notice__body">
            <strong>Your account is not verified yet.</strong> You can propose
            listings and edit yours, but changes are reviewed by Tembera before
            they go live. Verification usually needs your RRA taxpayer number —
            add it under <Link href="/business/dashboard/settings">Business details</Link>.
          </div>
        </div>
      )}

      {business.status === "suspended" && (
        <div className="t-notice t-notice--danger" style={{ marginBottom: "var(--t-4)" }}>
          <span className="t-notice__icon">
            <Icon name="alert" size={16} />
          </span>
          <div className="t-notice__body">
            <strong>This account is suspended.</strong> Your listings stay on
            Tembera, but you cannot change them. Contact us to sort it out.
          </div>
        </div>
      )}

      <div className="a-stats">
        <Stat
          label="Listings"
          value={places.length}
          icon="pin"
          note="you manage"
          href="/business/dashboard/listings"
        />
        <Stat label="Awaiting review" value={pending.length} icon="mail" note="with Tembera" />
        <Stat
          label="Reviews"
          value={reviews.length}
          icon="star"
          note={average ? `${average.toFixed(1)} average` : "none yet"}
          href="/business/dashboard/reviews"
        />
        <Stat
          label="Needs your attention"
          value={rejected.length}
          icon="alert"
          note="turned down"
        />
      </div>

      <div className="a-cols">
        <div>
          <Panel
            title="Your listings"
            action={
              <Link href="/business/dashboard/listings" className="t-btn t-btn--ghost t-btn--sm">
                See all
                <Icon name="chevronRight" size={15} />
              </Link>
            }
            flush
          >
            <div className="a-tablewrap">
              <table className="a-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>District</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {places.length === 0 ? (
                    <EmptyRow colSpan={3}>
                      Nothing yet. Propose a listing, or claim one Tembera already
                      publishes about you.
                    </EmptyRow>
                  ) : (
                    places.slice(0, 6).map((p) => (
                      <tr key={p.id}>
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div>
          <Panel title="Sent to Tembera" flush>
            {submissions.length === 0 ? (
              <p className="a-empty">Nothing sent yet.</p>
            ) : (
              <div className="a-queue">
                {submissions.slice(0, 6).map((s) => {
                  const payload = s.payload as { name?: string } | null;
                  return (
                    <div key={s.id} className="a-queue__item">
                      <span className="a-queue__icon">
                        <Icon
                          name={
                            s.status === "approved"
                              ? "check"
                              : s.status === "rejected"
                                ? "close"
                                : "mail"
                          }
                          size={17}
                        />
                      </span>
                      <span className="a-queue__body">
                        <span className="a-queue__name">
                          {s.kind === "create"
                            ? payload?.name ?? "A new listing"
                            : `Changes to ${s.placeId ?? "a listing"}`}
                        </span>
                        <span className="a-queue__meta">
                          {s.status} · {adminDate(s.createdAt)}
                          {s.status === "rejected" && s.rejectionReason && (
                            <> · {s.rejectionReason}</>
                          )}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
