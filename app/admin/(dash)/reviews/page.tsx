import Link from "next/link";
import Icon from "@/components/Icon";
import { PageHead, Panel, Stat } from "@/components/admin/ui";
import { adminDate } from "@/lib/admin/placeholder";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Reviews are real rows — only the moderation verbs are still to come. */
export default async function AdminReviewsPage() {
  const [total, reviews, average] = await Promise.all([
    prisma.review.count(),
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { name: true, handle: true } },
        place: { select: { name: true, id: true } },
      },
    }),
    prisma.review.aggregate({ _avg: { rating: true } }),
  ]);

  const lowRated = reviews.filter((r) => r.rating <= 2).length;

  return (
    <>
      <PageHead
        title="Reviews"
        sub="What visitors are saying, newest first."
      />

      <p className="a-sample">
        <Icon name="info" size={16} />
        <span>
          <strong>Reviews are live;</strong> moderation is not. Hiding or flagging a
          review needs a status field on the Review model, which does not exist yet — so
          those actions are shown but disabled.
        </span>
      </p>

      <div className="a-stats">
        <Stat label="Reviews" value={total} icon="star" />
        <Stat
          label="Average"
          value={average._avg.rating ? average._avg.rating.toFixed(2) : "—"}
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
