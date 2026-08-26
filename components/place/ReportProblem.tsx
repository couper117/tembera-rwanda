"use client";

import { useActionState, useState } from "react";
import Icon from "@/components/Icon";
import Spinner from "@/components/ui/Spinner";
import { submitReportAction } from "@/lib/actions/report";
import { REPORT_KINDS } from "@/lib/reports/kinds";

/**
 * "Report a problem with this listing."
 *
 * Collapsed by default — it is a safety valve, not a call to action, and it
 * should not compete with the page. Open to signed-out visitors, because the
 * person who knows a phone number is wrong is often the business itself.
 */
export default function ReportProblem({
  placeId,
  placeName,
}: {
  placeId: string;
  placeName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(submitReportAction, {});

  if (state.ok) {
    return (
      <section className="t-section">
        <div className="t-notice">
          <span className="t-notice__icon">
            <Icon name="check" size={18} />
          </span>
          <div className="t-notice__body">
            <div className="t-notice__title">Thank you</div>
            We&apos;ve got your report and someone will check it. Corrections
            make the guide better for everyone.
          </div>
        </div>
      </section>
    );
  }

  if (!open) {
    return (
      <section className="t-section">
        <button
          type="button"
          className="t-btn t-btn--ghost t-btn--sm"
          onClick={() => setOpen(true)}
        >
          <Icon name="alert" size={16} />
          Report a problem with this listing
        </button>
      </section>
    );
  }

  return (
    <section className="t-section">
      <div className="t-card" style={{ padding: "var(--t-4)" }}>
        <h2 className="t-heading" style={{ marginBottom: "var(--t-2)" }}>
          Report a problem
        </h2>
        <p className="t-small t-muted" style={{ marginBottom: "var(--t-4)" }}>
          Something wrong with <strong>{placeName}</strong>? Tell us and
          we&apos;ll check it. You don&apos;t need an account.
        </p>

        <form action={action} className="t-stack-3">
          <input type="hidden" name="placeId" value={placeId} />

          {state.error && (
            <div className="t-notice t-notice--danger" role="alert">
              <span className="t-notice__icon">
                <Icon name="alert" size={18} />
              </span>
              <div className="t-notice__body">{state.error}</div>
            </div>
          )}

          <div className="t-authfield">
            <span className="t-label">What&apos;s wrong?</span>
            <div className="t-inline t-wrap" role="radiogroup">
              {REPORT_KINDS.map((kind, i) => (
                <label key={kind.value} className="t-chip" style={{ cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="kind"
                    value={kind.value}
                    defaultChecked={i === 0}
                    required
                    style={{ marginRight: 6 }}
                  />
                  {kind.label}
                </label>
              ))}
            </div>
          </div>

          <div className="t-authfield">
            <span className="t-label">Tell us more</span>
            <label className="t-field t-field--area">
              <textarea
                className="t-field__input"
                name="body"
                rows={3}
                minLength={5}
                maxLength={2000}
                placeholder="For example: the phone number has changed, or it closed last year."
                required
              />
            </label>
          </div>

          <div className="t-authfield">
            <span className="t-label">Your email or phone (optional)</span>
            <label className="t-field">
              <Icon name="user" size={18} />
              <input
                className="t-field__input"
                type="text"
                name="contact"
                maxLength={200}
                placeholder="Only if you'd like us to reply"
              />
            </label>
          </div>

          <div className="t-inline t-wrap">
            <button
              type="submit"
              className="t-btn t-btn--primary t-btn--sm"
              disabled={pending}
              style={{ flex: 1 }}
            >
              {pending ? (
                <>
                  <Spinner size={16} tone="current" label="Sending report" />
                  Sending…
                </>
              ) : (
                "Send report"
              )}
            </button>
            <button
              type="button"
              className="t-btn t-btn--secondary t-btn--sm"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
