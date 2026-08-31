"use client";

import { useEffect, useRef } from "react";
import Icon from "@/components/Icon";

/**
 * What a form says when it refuses, and when it works.
 *
 * A single line of red text at the top of a long tabbed form is not feedback:
 * the reader has to guess which of twenty fields it means, and on a tab they
 * may not be looking at. This does the three things that actually help:
 *
 *   1. Says how many problems there are, not just that there is one.
 *   2. Names each field, as a button that jumps to it — so "fix it" is a click
 *      rather than a search.
 *   3. Scrolls itself into view and announces itself, because a message that
 *      appears above the fold of a form you have scrolled down is invisible.
 *
 * Success gets the same treatment for the opposite reason: a save that changes
 * nothing on screen is indistinguishable from a save that failed.
 */

export interface FormFeedbackProps {
  /** Per-field messages, keyed by input name. */
  fields?: Record<string, string>;
  /** A banner message that is not tied to one field. */
  error?: string;
  /** Shown when the submission succeeded. */
  success?: string;
  /** Human labels for field names, so the summary reads in English. */
  labels?: Record<string, string>;
  /** Called with a field name when the reader clicks it in the summary. */
  onGoToField?: (field: string) => void;
}

export default function FormFeedback({
  fields,
  error,
  success,
  labels = {},
  onGoToField,
}: FormFeedbackProps) {
  const box = useRef<HTMLDivElement | null>(null);
  const entries = Object.entries(fields ?? {});
  const count = entries.length;

  // Bring the message into view. Without this a form that was scrolled down
  // simply appears to do nothing when it refuses.
  useEffect(() => {
    if (!error && !success && count === 0) return;
    box.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error, success, count]);

  if (success) {
    return (
      <div className="a-feedback a-feedback--ok" role="status" ref={box}>
        <span className="a-feedback__icon">
          <Icon name="check" size={17} />
        </span>
        <div className="a-feedback__body">
          <p className="a-feedback__title">{success}</p>
        </div>
      </div>
    );
  }

  if (!error && count === 0) return null;

  return (
    <div className="a-feedback a-feedback--bad" role="alert" ref={box}>
      <span className="a-feedback__icon">
        <Icon name="alert" size={17} />
      </span>
      <div className="a-feedback__body">
        <p className="a-feedback__title">
          {count > 0
            ? `${count} ${count === 1 ? "field needs" : "fields need"} your attention`
            : error}
        </p>

        {count > 0 && (
          <ul className="a-feedback__list">
            {entries.map(([field, message]) => (
              <li key={field}>
                <button
                  type="button"
                  className="a-feedback__jump"
                  onClick={() => {
                    onGoToField?.(field);
                    // Focus after the tab has switched and painted.
                    requestAnimationFrame(() => {
                      const el = document.getElementById(field);
                      el?.focus();
                      el?.scrollIntoView({ behavior: "smooth", block: "center" });
                    });
                  }}
                >
                  {labels[field] ?? field}
                </button>
                {" — "}
                {message}
              </li>
            ))}
          </ul>
        )}

        {/* The banner message is usually just the first field error repeated,
            since that is what firstError() returns. Show it only when it says
            something the list does not — otherwise the summary ends by
            restating one of its own bullets. */}
        {count > 0 && error && !entries.some(([, m]) => m === error) && (
          <p className="a-feedback__note">{error}</p>
        )}
      </div>
    </div>
  );
}
