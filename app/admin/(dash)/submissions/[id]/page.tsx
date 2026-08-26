import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import { PageHead, Panel, SampleNotice, StatusBadge } from "@/components/admin/ui";
import { adminDate, businessById, submissionById } from "@/lib/admin/placeholder";

export const dynamic = "force-dynamic";

/** One field of the proposed listing, laid out like the place detail facts. */
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="t-fact">
      <span className="t-fact__icon">
        <Icon name="info" size={16} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span className="t-fact__label">{label}</span>
        <span className="t-fact__value" style={{ display: "block" }}>
          {value || <span className="t-muted">Not supplied</span>}
        </span>
      </span>
    </div>
  );
}

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const submission = submissionById(id);
  if (!submission) notFound();

  const business = businessById(submission.businessId);
  const decided = submission.status !== "pending";

  return (
    <>
      <PageHead
        title={submission.placeName}
        sub={`Submitted by ${submission.businessName} on ${adminDate(submission.submittedAt)}`}
        actions={
          <Link href="/admin/submissions" className="t-btn t-btn--ghost t-btn--sm">
            <Icon name="chevronLeft" size={15} />
            Back to queue
          </Link>
        }
      />

      <SampleNotice what="Business submissions" />

      <div className="a-cols">
        <div>
          <Panel title="Proposed listing">
            <div className="t-facts">
              <Field label="Name" value={submission.placeName} />
              <Field
                label="Category"
                value={`${submission.subcategory} · ${submission.categoryId}`}
              />
              <Field label="City" value={submission.city} />
              <Field label="Description" value={submission.description} />
              <Field label="Phone" value={submission.phone} />
              <Field
                label="Website"
                value={
                  submission.website ? (
                    <a href={submission.website} target="_blank" rel="noopener noreferrer">
                      {submission.website}
                    </a>
                  ) : (
                    ""
                  )
                }
              />
              <Field label="Photo" value={submission.image ? submission.image : ""} />
            </div>
          </Panel>

          {submission.status === "rejected" && submission.rejectionReason && (
            <div className="t-notice t-notice--danger" style={{ marginTop: "var(--t-5)" }}>
              <span className="t-notice__icon">
                <Icon name="alert" size={16} />
              </span>
              <div className="t-notice__body">
                <span className="t-notice__title">Turned down</span>
                {submission.rejectionReason}
              </div>
            </div>
          )}
        </div>

        <div>
          <Panel title="Decision">
            <div className="t-inline" style={{ marginBottom: "var(--t-3)" }}>
              <StatusBadge status={submission.status} />
              {decided && submission.reviewedBy && (
                <span className="t-small t-muted">
                  by {submission.reviewedBy} · {adminDate(submission.reviewedAt ?? "")}
                </span>
              )}
            </div>

            {decided ? (
              <p className="t-small t-muted">
                This submission has already been decided. Reopening it will be possible
                once submissions are stored.
              </p>
            ) : (
              <>
                <p className="t-small t-muted" style={{ marginBottom: "var(--t-3)" }}>
                  Approving publishes it as a place owned by {submission.businessName}.
                  Rejecting returns it with your reason.
                </p>

                <div className="a-field" style={{ marginBottom: "var(--t-3)" }}>
                  <label className="a-label" htmlFor="reason">
                    Reason (required to reject)
                  </label>
                  <textarea
                    id="reason"
                    className="a-textarea"
                    placeholder="What the business needs to change…"
                    disabled
                  />
                  <span className="a-hint">
                    Disabled until submissions are stored — see the sample-data note.
                  </span>
                </div>

                <div className="t-inline t-wrap">
                  <button type="button" className="t-btn t-btn--primary" disabled>
                    <Icon name="check" size={16} />
                    Approve &amp; publish
                  </button>
                  <button type="button" className="t-btn t-btn--danger" disabled>
                    <Icon name="close" size={16} />
                    Reject
                  </button>
                  <button type="button" className="t-btn t-btn--secondary" disabled>
                    Edit first
                  </button>
                </div>
              </>
            )}
          </Panel>

          {business && (
            <Panel
              title="Business"
              action={
                <Link
                  href={`/admin/businesses?highlight=${business.id}`}
                  className="t-btn t-btn--ghost t-btn--sm"
                >
                  Open
                </Link>
              }
            >
              <div className="t-facts">
                <Field label="Name" value={business.name} />
                <Field label="Contact" value={`${business.contactName} · ${business.email}`} />
                <Field label="Phone" value={business.phone} />
                <Field label="TIN" value={business.tin} />
                <Field
                  label="Standing"
                  value={<StatusBadge status={business.status} />}
                />
                <Field
                  label="Listings"
                  value={`${business.listings} live · ${business.pending} pending`}
                />
              </div>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
