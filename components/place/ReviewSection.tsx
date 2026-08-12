"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitReviewAction, deleteReviewAction } from "@/lib/actions/user";
import type { ReviewWithAuthor } from "@/lib/data/user";

interface Props {
  placeId: string;
  reviews: ReviewWithAuthor[];
  currentUserId: number | null;
}

function Stars({ n }: { n: number }) {
  return (
    <span className="t-review__stars" aria-label={`${n} out of 5`}>
      {"★".repeat(n)}
      {"☆".repeat(5 - n)}
    </span>
  );
}

export default function ReviewSection({ placeId, reviews, currentUserId }: Props) {
  const router = useRouter();
  const mine = reviews.find((r) => r.userId === currentUserId);
  const [rating, setRating] = useState(mine?.rating ?? 0);
  const [body, setBody] = useState(mine?.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (rating < 1) {
      setError("Pick a rating first.");
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
                ★
              </button>
            ))}
          </div>
          <textarea
            className="t-textarea"
            rows={3}
            placeholder="Share what this place is like… (optional)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            style={{ marginTop: 10 }}
          />
          {error && <p className="t-authcard__error" style={{ marginTop: 8 }}>{error}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button
              type="button"
              className="t-btn t-btn--primary"
              onClick={submit}
              disabled={pending}
            >
              {mine ? "Update review" : "Post review"}
            </button>
            {mine && (
              <button type="button" className="t-btn" onClick={remove} disabled={pending}>
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
              <span className="t-review__author">{r.authorName}</span>
              <Stars n={r.rating} />
            </div>
            {r.body && <p className="t-review__body">{r.body}</p>}
          </div>
        ))
      )}
    </section>
  );
}
