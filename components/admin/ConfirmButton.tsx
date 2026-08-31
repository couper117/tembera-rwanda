"use client";

import { useEffect, useState } from "react";

interface Props {
  /** Shown before the first click. */
  label?: string;
  /** Shown while armed, next to Yes/No. */
  question?: string;
  disabled?: boolean;
}

/**
 * A submit button that asks first.
 *
 * Every destructive action in the old admin fired on a single click — one
 * mis-tap deleted a place, a category or a user outright, with no confirm, no
 * undo and no toast. This arms on the first click and only submits on the
 * second, and disarms itself after a few seconds so a stray armed button
 * doesn't sit waiting on the page.
 *
 * It stays a real form submit, so the server action keeps working exactly as
 * before with no JavaScript required to reach it.
 */
export default function ConfirmButton({
  label = "Delete",
  question = "Sure?",
  disabled,
}: Props) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer);
  }, [armed]);

  if (!armed) {
    return (
      <button
        type="button"
        className="t-btn t-btn--secondary t-btn--sm"
        onClick={() => setArmed(true)}
        disabled={disabled}
      >
        {label}
      </button>
    );
  }

  return (
    <span className="a-confirm">
      <span className="a-confirm__ask">{question}</span>
      <button type="submit" className="t-btn t-btn--danger t-btn--sm" disabled={disabled}>
        Yes
      </button>
      <button
        type="button"
        className="t-btn t-btn--ghost t-btn--sm"
        onClick={() => setArmed(false)}
      >
        No
      </button>
    </span>
  );
}
