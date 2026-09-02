import Link from "next/link";
import Icon from "@/components/Icon";
import { EmptyRow, PageHead, Panel, Stat } from "@/components/admin/ui";
import { adminDate } from "@/lib/admin/format";
import { requireStaff } from "@/lib/auth";
import { adminReviews, reviewStats } from "@/lib/data/moderation";
import { setReviewHiddenAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  await requireStaff();

  const [reviews, stats] = await Promise.all([adminReviews(), reviewStats()]);

  return (
    <>
      <PageHead
        title="Reviews"
        sub="What visitors are saying, newest first. Hiding a review removes it from the place page and from its rating."
      />

      <div className="a-stats">
        <Stat label="Reviews" value={stats.total} icon="star" note="posted" />
        <Stat
          label="Average"
          value={stats.average ? stats.average.toFixed(2) : "—"}
          icon="sparkle"
          note="visible reviews only"
        />
        <Stat
          label="Low rated"
          value={stats.lowRated}
          icon="alert"
          note="2 stars or fewer"
        />
        <Stat label="Hidden" value={stats.hidden} icon="lock" note="by a moderator" />
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
                <EmptyRow colSpan={6}>
                  No reviews yet. They are written from a place page by anyone
                  signed in.
                </EmptyRow>
              ) : (
                reviews.map((r) => (
                  <tr key={r.id} className={r.hidden ? "a-row--muted" : undefined}>
                    <td>
                      <Link href={`/place/${r.place.id}`} className="a-table__strong">
                        {r.place.name}
                      </Link>
                      {r.hidden && <span className="a-table__sub">hidden</span>}
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
                      <div className="a-table__actions" style={{ justifyContent: "flex-end" }}>
                        <form action={setReviewHiddenAction}>
                          <input type="hidden" name="id" value={r.id} />
                          <input
                            type="hidden"
                            name="hidden"
                            value={r.hidden ? "false" : "true"}
                          />
                          <button
                            type="submit"
                            className="t-btn t-btn--secondary t-btn--sm"
                          >
                            {r.hidden ? "Show" : "Hide"}
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
    </>
  );
}
