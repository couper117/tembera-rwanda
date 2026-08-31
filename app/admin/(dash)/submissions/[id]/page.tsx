import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import { PageHead, Panel, StatusBadge } from "@/components/admin/ui";
import { adminDate } from "@/lib/admin/placeholder";
import { requireStaff } from "@/lib/auth";
import { adminSubmission } from "@/lib/data/business";
import { getAnyPlace } from "@/lib/data/places";
import { approveSubmissionAction, rejectSubmissionAction } from "../actions";

export const dynamic = "force-dynamic";

/** One proposed field, beside what the listing says today. */
function Row({
  label,
  proposed,
  current,
}: {
  label: string;
  proposed: unknown;
  current?: unknown;
}) {
  const show = (v: unknown) => {
    if (v === null || v === undefined || v === "") return null;
    if (Array.isArray(v)) return v.length ? v.join(", ") : null;
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };

  const next = show(proposed);
  const now = show(current);
  if (next === null && now === null) return null;
  const changed = current !== undefined && next !== now;

  return (
    <div className={`a-diff${changed ? " a-diff--changed" : ""}`}>
      <span className="a-diff__label">{label}</span>
      {changed && now !== null && <span className="a-diff__old">{now}</span>}
      <span className="a-diff__new">{next ?? <em>empty</em>}</span>
    </div>
  );
}

export default async function SubmissionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireStaff();

  const { id } = await params;
  const { error } = await searchParams;

  const submission = await adminSubmission(Number(id));
  if (!submission) notFound();

  const payload = submission.payload as Record<string, unknown>;
  // For an edit, show what the listing says now beside what is proposed —
  // approving a change you cannot see is not reviewing it.
  const current = submission.placeId ? await getAnyPlace(submission.placeId) : null;
  const decided = submission.status !== "pending";

  const FIELDS: [string, string][] = [
    ["name", "Name"],
    ["categoryId", "Category"],
    ["subcategory", "Subcategory"],
    ["subtype", "Speciality"],
    ["city", "District"],
    ["area", "Area"],
    ["description", "Description"],
    ["phone", "Phone"],
    ["website", "Website"],
    ["hours", "Hours (free text)"],
    ["hoursJson", "Hours (structured)"],
    ["image", "Main photo"],
    ["images", "More photos"],
    ["highlights", "Highlights"],
    ["keywords", "Keywords"],
    ["priceFrom", "Price from"],
    ["lat", "Latitude"],
    ["lng", "Longitude"],
  ];

  return (
    <>
      <PageHead
        title={
          submission.kind === "create"
            ? String(payload.name ?? "A new listing")
            : `Changes to ${submission.placeId}`
        }
        sub={`From ${submission.business.name} · ${adminDate(submission.createdAt)}`}
        actions={
          submission.placeId ? (
            <Link
              href={`/admin/places/${submission.placeId}`}
              className="t-btn t-btn--secondary t-btn--sm"
            >
              Open the listing
            </Link>
          ) : undefined
        }
      />

      {error && (
        <div className="t-notice t-notice--danger" style={{ marginBottom: "var(--t-4)" }}>
          <span className="t-notice__icon">
            <Icon name="alert" size={16} />
          </span>
          <div className="t-notice__body">{error}</div>
        </div>
      )}

      <div className="a-cols">
        <div>
          <Panel title={submission.kind === "create" ? "Proposed listing" : "Proposed changes"}>
            <div className="a-difflist">
              {FIELDS.map(([key, label]) => (
                <Row
                  key={key}
                  label={label}
                  proposed={payload[key]}
                  current={
                    current ? (current as unknown as Record<string, unknown>)[key] : undefined
                  }
                />
              ))}
            </div>
          </Panel>
        </div>

        <div>
          <Panel title="Decision">
            <div className="t-facts" style={{ marginBottom: "var(--t-3)" }}>
              <div className="t-fact">
                <span className="t-fact__icon">
                  <Icon name="mail" size={17} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span className="t-fact__label">Status</span>
                  <span className="t-fact__value" style={{ display: "block" }}>
                    <StatusBadge status={submission.status} />
                  </span>
                </span>
              </div>
              <div className="t-fact">
                <span className="t-fact__icon">
                  <Icon name="basket" size={17} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span className="t-fact__label">Business standing</span>
                  <span className="t-fact__value" style={{ display: "block" }}>
                    {submission.business.status}
                  </span>
                </span>
              </div>
            </div>

            {decided ? (
              <>
                <p className="a-hint">
                  Decided {submission.reviewedAt ? adminDate(submission.reviewedAt) : ""}.
                </p>
                {submission.rejectionReason && (
                  <p className="a-hint" style={{ marginTop: "var(--t-2)" }}>
                    Reason given: {submission.rejectionReason}
                  </p>
                )}
              </>
            ) : (
              <>
                <form action={approveSubmissionAction} style={{ marginBottom: "var(--t-4)" }}>
                  <input type="hidden" name="id" value={submission.id} />
                  <button type="submit" className="t-btn t-btn--primary t-btn--block">
                    <Icon name="check" size={16} />
                    {submission.kind === "create" ? "Approve and publish" : "Apply the changes"}
                  </button>
                </form>

                <form action={rejectSubmissionAction} className="a-form">
                  <input type="hidden" name="id" value={submission.id} />
                  <div className="a-field">
                    <label className="a-label" htmlFor="reason">
                      Why are you turning it down?
                    </label>
                    <textarea
                      id="reason"
                      name="reason"
                      className="a-textarea"
                      rows={3}
                      placeholder="What the business needs to change."
                      required
                      minLength={5}
                    />
                    <p className="a-hint">
                      This is the only thing they see. Without it you will get the
                      same submission again.
                    </p>
                  </div>
                  <button type="submit" className="t-btn t-btn--danger t-btn--block">
                    <Icon name="close" size={16} />
                    Reject
                  </button>
                </form>
              </>
            )}
          </Panel>

          <Panel title="Who sent it">
            <div className="t-facts">
              <div className="t-fact">
                <span className="t-fact__icon">
                  <Icon name="user" size={17} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span className="t-fact__label">{submission.submittedBy.name}</span>
                  <span className="t-fact__value" style={{ display: "block" }}>
                    {submission.submittedBy.email}
                  </span>
                </span>
              </div>
            </div>
            <Link
              href="/admin/businesses"
              className="t-btn t-btn--ghost t-btn--sm"
              style={{ marginTop: "var(--t-3)" }}
            >
              All businesses
            </Link>
          </Panel>
        </div>
      </div>
    </>
  );
}
