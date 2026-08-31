import Link from "next/link";
import Icon from "@/components/Icon";
import { PageHead, Panel, SampleNotice, Stat } from "@/components/admin/ui";
import { REVIEWS, adminDate } from "@/lib/admin/placeholder";

export const dynamic = "force-dynamic";

/** Sample rows: there is no review table in this build, and no way to post one. */
export default async function AdminReviewsPage() {
  const reviews = REVIEWS;
  const total = reviews.length;
  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  const lowRated = reviews.filter((r) => r.rating <= 2).length;

  return (
    <>
      <PageHead
        title="Reviews"
        sub="What visitors are saying, newest first."
      />

      <SampleNotice what="Reviews" />

      <div className="a-stats">
        <Stat label="Reviews" value={total} icon="star" />
        <Stat
          label="Average"
          value={average ? average.toFixed(2) : "—"}
          icon="sparkle"
          note="across all places"
        />
        <Stat label="Low rated" value={lowRated} icon="alert" note="2 stars or fewer" />
      </div>

      <Panel title="Latest reviews" flush>
        <div className="a-tablewrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Place</th>
                <th>Author</th>
                <th>Rating</th>
                <th style={{ whiteSpace: "normal", minWidth: 260 }}>Comment</th>
                <th>Posted</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <p className="a-empty">No reviews yet.</p>
                  </td>
                </tr>
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
                      {r.body ? r.body : <span className="t-muted">No comment</span>}
                    </td>
                    <td>{adminDate(r.createdAt)}</td>
                    <td>
                      <div className="a-table__actions">
                        <button type="button" className="t-btn t-btn--ghost t-btn--sm" disabled>
                          Hide
                        </button>
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
