import Link from "next/link";
import Icon from "@/components/Icon";
import { EmptyRow, PageHead, Panel, Stat } from "@/components/admin/ui";
import { adminDate } from "@/lib/admin/placeholder";
import { requireBusiness } from "@/lib/auth";
import { getMyBusiness, getMyReviews } from "@/lib/data/business";

export const dynamic = "force-dynamic";

export default async function BusinessReviewsPage() {
  const user = await requireBusiness();
  const business = await getMyBusiness(user.id);
  if (!business) return null;

  const reviews = await getMyReviews(business.id);
  const average =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;
  const low = reviews.filter((r) => r.rating <= 2).length;

  return (
    <>
      <PageHead
        title="Reviews"
        sub="What visitors are saying about your listings, newest first."
      />

      <div className="a-stats">
        <Stat label="Reviews" value={reviews.length} icon="star" note="in total" />
        <Stat
          label="Average"
          value={average ? average.toFixed(1) : "—"}
          icon="sparkle"
          note="out of 5"
        />
        <Stat label="Two stars or fewer" value={low} icon="alert" note="worth reading" />
      </div>

      {/*
        No reply control yet, and no pretence of one. Replying in public is a
        real feature with real consequences — it needs its own model, its own
        moderation and somewhere for the reviewer to be notified — and a
        disabled button promising it would be worse than saying nothing.
      */}
      <Panel title="Latest reviews" flush>
        <div className="a-tablewrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Listing</th>
                <th>Visitor</th>
                <th>Rating</th>
                <th style={{ whiteSpace: "normal", minWidth: 260 }}>What they said</th>
                <th>Posted</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <EmptyRow colSpan={5}>
                  No reviews yet. They appear here as visitors write them.
                </EmptyRow>
              ) : (
                reviews.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/place/${r.place.id}`} className="a-table__strong">
                        {r.place.name}
                      </Link>
                    </td>
                    <td>
                      {r.user.name}
                      <span className="a-table__sub">@{r.user.handle}</span>
                    </td>
                    <td>
                      <span className="t-rating">
                        <Icon name="star" size={13} filled />
                        {r.rating}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "normal" }}>
                      {r.body || <span className="t-muted">No comment</span>}
                    </td>
                    <td>{adminDate(r.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <p className="a-hint" style={{ marginTop: "var(--t-3)" }}>
        Something abusive or untrue? Use the report button on the listing and
        Tembera will look at it.
      </p>
    </>
  );
}
