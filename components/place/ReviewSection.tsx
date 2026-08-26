"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Icon from "@/components/Icon";
import { submitReviewAction, deleteReviewAction } from "@/lib/actions/user";
import type { ReviewWithAuthor } from "@/lib/data/user";
import { reviewBodyError, reviewRatingError } from "@/lib/validation/review";

interface Props {
  placeId: string;
  reviews: ReviewWithAuthor[];
  currentUserId: number | null;
}

function Stars({ n }: { n: number }) {
  return (
    <span className="t-review__stars" aria-label={`${n} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Icon key={i} name="star" size={14} filled={i < n} />
      ))}
    </span>
  );
}

/** "Today" / "3 days ago" / "2 weeks ago" — same register as the profile's
 *  visited-place timestamps, kept local since reviews are the only other
 *  place a relative date shows up. */
function formatReviewDate(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (days < 1) return "Today";
  if (days < 7) return rtf.format(-days, "day");
  if (days < 30) return rtf.format(-Math.floor(days / 7), "week");
  if (days < 365) return rtf.format(-Math.floor(days / 30), "month");
  return rtf.format(-Math.floor(days / 365), "year");
}

export default function ReviewSection({ placeId, reviews, currentUserId }: Props) {
  const router = useRouter();
  const mine = reviews.find((r) => r.userId === currentUserId);
  const [rating, setRating] = useState(mine?.rating ?? 0);
  const [body, setBody] = useState(mine?.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    const invalid = reviewRatingError(rating) ?? reviewBodyError(body);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await submitReviewAction({ placeId, rating, body });
      if ("error" in res) setError(res.error);
      else router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await deleteReviewAction(placeId);
      setRating(0);
      setBody("");
      router.refresh();
    });
  }

  return (
    <section className="t-reviews">
      {currentUserId === null ? (
        <p className="t-signin-note">
          <Link href="/login">Sign in</Link> to rate and review this place.
        </p>
      ) : (
        <div className="t-review">
          <div className="t-ratingpick" role="group" aria-label="Your rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                data-on={n <= rating}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                onClick={() => setRating(n)}
              >
                <Icon name="star" size={22} filled={n <= rating} />
              </button>
            ))}
          </div>
          <div className="t-formrow" style={{ marginTop: 10 }}>
            <label className="t-field t-field--area">
              <textarea
                className="t-field__input"
                rows={3}
                placeholder="Share what this place is like…"
                value={body}
                aria-invalid={error !== null}
                aria-describedby={error ? "review-error" : undefined}
                onChange={(e) => {
                  const next = e.target.value;
                  setBody(next);
                  // Drop the warning as soon as they have fixed it.
                  if (error && !reviewRatingError(rating) && !reviewBodyError(next)) {
                    setError(null);
                  }
                }}
              />
            </label>
          </div>
          {error && (
            <p id="review-error" role="alert" className="t-small t-danger" style={{ marginTop: 8 }}>
              {error}
            </p>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button
              type="button"
              className="t-btn t-btn--primary t-btn--sm"
              onClick={submit}
              disabled={pending}
            >
              {mine ? "Update review" : "Post review"}
            </button>
            {mine && (
              <button
                type="button"
                className="t-btn t-btn--secondary t-btn--sm"
                onClick={remove}
                disabled={pending}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="t-signin-note">No reviews yet — be the first.</p>
      ) : (
        reviews.map((r) => (
          <div key={r.id} className="t-review">
            <div className="t-review__head">
              <span>
                <span className="t-review__author">{r.authorName}</span>
                <span className="t-review__meta">{formatReviewDate(r.createdAt)}</span>
              </span>
              <Stars n={r.rating} />
            </div>
            {r.body && <p className="t-review__body">{r.body}</p>}
          </div>
        ))
      )}
    </section>
  );
}
