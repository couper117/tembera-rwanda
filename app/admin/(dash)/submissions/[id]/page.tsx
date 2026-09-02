import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import { PageHead, Panel, StatusBadge } from "@/components/admin/ui";
import { adminDate } from "@/lib/admin/placeholder";
import { parseWeekHours, summariseWeek } from "@/lib/places/hours";
import PlaceImage from "@/components/ui/PlaceImage";
import { requireStaff } from "@/lib/auth";
import { adminSubmission } from "@/lib/data/business";
import { getAnyPlace } from "@/lib/data/places";
import { approveSubmissionAction, rejectSubmissionAction } from "../actions";

export const dynamic = "force-dynamic";

/** One proposed field, beside what the listing says today. */
type Kind = "text" | "long" | "chips" | "photo" | "photos" | "hours" | "link" | "coords";

/**
 * One field of a proposal, rendered as the thing it actually is.
 *
 * The old version put every value through String(), so structured hours
 * arrived as a wall of JSON, a photo as a URL, and a list of highlights as one
 * comma-spliced line. A reviewer had to decode the record before they could
 * judge it, which is the opposite of what a review screen is for.
 */
function Row({
  label,
  kind,
  proposed,
  current,
}: {
  label: string;
  kind: Kind;
  proposed: unknown;
  current?: unknown;
}) {
  const show = (v: unknown) => {
    if (v === null || v === undefined || v === "") return null;
    if (Array.isArray(v)) return v.length ? v : null;
    return v;
  };

  const next = show(proposed);
  const now = show(current);
  if (next === null && now === null) return null;

  // Compared as text so an array or an hours object does not read as changed
  // every time purely because it is a different object.
  const changed = current !== undefined && JSON.stringify(next) !== JSON.stringify(now);

  return (
    <div className={`a-diff${changed ? " a-diff--changed" : ""}`}>
      <span className="a-diff__label">{label}</span>
      {changed && now !== null && (
        <span className="a-diff__old">
          <Value kind={kind} value={now} muted />
        </span>
      )}
      <span className="a-diff__new">
        {next === null ? <em>empty</em> : <Value kind={kind} value={next} />}
      </span>
    </div>
  );
}

function Value({ kind, value, muted }: { kind: Kind; value: unknown; muted?: boolean }) {
  const list = Array.isArray(value) ? value.map(String) : [];

  if (kind === "photo" || kind === "photos") {
    const urls = kind === "photo" ? [String(value)] : list;
    if (muted) return <>{urls.length} photo{urls.length === 1 ? "" : "s"}</>;
    return (
      <span className="a-shots">
        {urls.map((url) => (
          // A reviewer is judging whether the photo is of the place. A URL
          // cannot answer that; the photo can. The address stays underneath,
          // because a dead link is itself a reason to reject and a blank grey
          // box does not say which of the two it is.
          <span key={url} className="a-shotwrap">
            <PlaceImage src={url} alt="" className="a-shot" />
            <span className="a-shot__src t-truncate" title={url}>
              {url.replace(/^https?:\/\/(www\.)?/, "")}
            </span>
          </span>
        ))}
      </span>
    );
  }

  if (kind === "chips") {
    if (muted) return <>{list.join(", ")}</>;
    return (
      <span className="a-chips">
        {list.map((item) => (
          <span key={item} className="a-chip">
            {item}
          </span>
        ))}
      </span>
    );
  }

  if (kind === "hours") {
    const week = parseWeekHours(value);
    const summary = summariseWeek(week);
    return <>{summary ?? <em>not set</em>}</>;
  }

  if (kind === "link" && !muted) {
    const href = String(value);
    const url = href.startsWith("http") ? href : `https://${href}`;
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {href}
      </a>
    );
  }

  if (kind === "coords") return <code>{String(value)}</code>;
  if (kind === "long") return <span className="a-diff__prose">{String(value)}</span>;
  return <>{Array.isArray(value) ? list.join(", ") : String(value)}</>;
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

  /**
   * Grouped, because eighteen equal rows is a record dump rather than a review.
   * A reviewer reads in this order: what is it, what does it say about itself,
   * how do you reach it, where is it, when is it open, what does it look like.
   */
  const SECTIONS: { title: string; fields: [string, string, Kind][] }[] = [
    {
      title: "What it is",
      fields: [
        ["name", "Name", "text"],
        ["categoryId", "Category", "text"],
        ["subcategory", "Subcategory", "text"],
        ["subtype", "Speciality", "text"],
      ],
    },
    {
      title: "What it says",
      fields: [
        ["description", "Description", "long"],
        ["highlights", "Highlights", "chips"],
        ["keywords", "Keywords", "chips"],
        ["priceFrom", "Price from", "text"],
      ],
    },
    {
      title: "How to reach it",
      fields: [
        ["phone", "Phone", "text"],
        ["website", "Website", "link"],
      ],
    },
    {
      title: "Where it is",
      fields: [
        ["city", "District", "text"],
        ["area", "Area", "text"],
        ["lat", "Latitude", "coords"],
        ["lng", "Longitude", "coords"],
      ],
    },
    {
      title: "When it is open",
      fields: [
        ["hoursJson", "Opening hours", "hours"],
        ["hours", "In their words", "text"],
      ],
    },
    {
      title: "Photos",
      fields: [
        ["image", "Main photo", "photo"],
        ["images", "More photos", "photos"],
      ],
    },
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
            {SECTIONS.map((section) => {
              const rows = section.fields.map(([key, label, kind]) => (
                <Row
                  key={key}
                  label={label}
                  kind={kind}
                  proposed={payload[key]}
                  current={
                    current ? (current as unknown as Record<string, unknown>)[key] : undefined
                  }
                />
              ));
              // A section every field of which is empty is noise; drop it
              // rather than printing a heading over nothing.
              if (rows.every((r) => r === null)) return null;
              return (
                <div key={section.title} className="a-subsection">
                  <h4 className="a-subsection__title">{section.title}</h4>
                  <div className="a-difflist">{rows}</div>
                </div>
              );
            })}
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
