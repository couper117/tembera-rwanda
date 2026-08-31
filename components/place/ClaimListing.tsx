"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import ClaimForm from "@/components/business/ClaimForm";

/**
 * "Is this your business?" — the claim entry point on a place page.
 *
 * Collapsed by default and sat low on the page: a visitor reading about a
 * restaurant is not the audience, and it must not compete with saving,
 * directions or reviews. The owner, who is looking for exactly this, will find
 * it. Opening it reveals the same form as `/business`, pre-filled with the
 * listing they are standing on.
 */
export default function ClaimListing({
  placeId,
  placeName,
}: {
  placeId: string;
  placeName: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <section className="t-section">
        <button
          type="button"
          className="t-btn t-btn--ghost t-btn--sm"
          onClick={() => setOpen(true)}
        >
          <Icon name="basket" size={16} />
          Is this your business? Claim this listing
        </button>
      </section>
    );
  }

  return (
    <section className="t-section">
      <div className="t-card" style={{ padding: "var(--t-4)" }}>
        <h2 className="t-heading" style={{ marginBottom: "var(--t-2)" }}>
          Claim this listing
        </h2>
        <p className="t-small t-muted" style={{ marginBottom: "var(--t-4)" }}>
          Take control of <strong>{placeName}</strong> — fix your own hours and
          photos, and show visitors it is current.{" "}
          <Link href="/business">See what you get</Link>.
        </p>

        <ClaimForm placeId={placeId} placeName={placeName} />

        <button
          type="button"
          className="t-btn t-btn--secondary t-btn--sm"
          onClick={() => setOpen(false)}
          style={{ marginTop: "var(--t-3)" }}
        >
          Cancel
        </button>
      </div>
    </section>
  );
}
