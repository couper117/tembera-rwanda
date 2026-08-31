"use client";

import { useActionState } from "react";
import Icon from "@/components/Icon";
import Spinner from "@/components/ui/Spinner";
import { submitClaimAction } from "@/lib/actions/claim";
import { PLANS, type PlanId } from "@/lib/business/plans";

/**
 * "Claim your listing."
 *
 * The one place a business becomes a customer, so unlike the report form this
 * is a call to action and stays open. No account needed — an owner should not
 * have to sign up as a visitor before telling us the listing is theirs.
 *
 * `placeId` and `placeName` are passed when the form is opened from a specific
 * listing, so the owner never has to describe which place they mean.
 */
export default function ClaimForm({
  placeId,
  placeName,
  defaultPlan = "checked",
}: {
  placeId?: string;
  placeName?: string;
  defaultPlan?: PlanId;
}) {
  const [state, action, pending] = useActionState(submitClaimAction, {});

  if (state.ok) {
    return (
      <div className="t-notice">
        <span className="t-notice__icon">
          <Icon name="check" size={18} />
        </span>
        <div className="t-notice__body">
          <div className="t-notice__title">Thank you</div>
          We&apos;ve got your claim and someone will call you to confirm it is
          your business. Nothing is charged until we speak.
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="t-stack-3">
      {placeId && <input type="hidden" name="placeId" value={placeId} />}

      {state.error && (
        <div className="t-notice t-notice--danger" role="alert">
          <span className="t-notice__icon">
            <Icon name="alert" size={18} />
          </span>
          <div className="t-notice__body">{state.error}</div>
        </div>
      )}

      <div className="t-authfield">
        <span className="t-label">Business name</span>
        <label className="t-field">
          <Icon name="basket" size={18} />
          <input
            className="t-field__input"
            type="text"
            name="businessName"
            defaultValue={placeName ?? ""}
            maxLength={200}
            placeholder="For example: Repub Lounge"
            required
          />
        </label>
      </div>

      <div className="t-authfield">
        <span className="t-label">Which plan?</span>
        <div className="t-inline t-wrap" role="radiogroup">
          {PLANS.map((plan) => (
            <label key={plan.id} className="t-chip" style={{ cursor: "pointer" }}>
              <input
                type="radio"
                name="plan"
                value={plan.id}
                defaultChecked={plan.id === defaultPlan}
                required
                style={{ marginRight: 6 }}
              />
              {plan.name}
            </label>
          ))}
        </div>
      </div>

      <div className="t-authfield">
        <span className="t-label">Your name</span>
        <label className="t-field">
          <Icon name="user" size={18} />
          <input
            className="t-field__input"
            type="text"
            name="contactName"
            maxLength={200}
            placeholder="Who should we ask for?"
            required
          />
        </label>
      </div>

      <div className="t-authfield">
        <span className="t-label">Phone</span>
        <label className="t-field">
          <Icon name="phone" size={18} />
          <input
            className="t-field__input"
            type="tel"
            name="phone"
            maxLength={25}
            placeholder="0788 000 000"
            required
          />
        </label>
      </div>

      <div className="t-authfield">
        <span className="t-label">Email</span>
        <label className="t-field">
          <Icon name="mail" size={18} />
          <input
            className="t-field__input"
            type="email"
            name="email"
            maxLength={200}
            placeholder="you@yourbusiness.rw"
            required
          />
        </label>
      </div>

      <div className="t-authfield">
        <span className="t-label">Anything else? (optional)</span>
        <label className="t-field t-field--area">
          <textarea
            className="t-field__input"
            name="note"
            rows={3}
            maxLength={2000}
            placeholder="Opening hours, a second branch, anything we should know."
          />
        </label>
      </div>

      <button
        type="submit"
        className="t-btn t-btn--primary t-btn--block"
        disabled={pending}
      >
        {pending ? (
          <>
            <Spinner size={16} tone="current" label="Sending claim" />
            Sending…
          </>
        ) : (
          "Claim your listing"
        )}
      </button>

      <p className="t-small t-muted" style={{ textAlign: "center" }}>
        We call you to check it is your business. Nothing is charged today.
      </p>
    </form>
  );
}
