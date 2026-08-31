"use client";

import { useActionState } from "react";
import { Field } from "@/components/admin/Field";
import FormFeedback from "@/components/admin/FormFeedback";
import { inviteMemberAction, type BusinessState } from "@/lib/actions/business";

const initial: BusinessState = {};

export default function InviteMemberForm() {
  const [state, formAction, pending] = useActionState(inviteMemberAction, initial);

  return (
    <form action={formAction} className="a-form a-form--roomy">
      <FormFeedback
        fields={state.fields}
        error={state.error}
        success={state.ok ? "Added. They can sign in with their own account now." : undefined}
        labels={{ email: "Email address" }}
      />

      <Field
        name="email"
        label="Their email address"
        error={state.fields?.email}
        hint="They need a Tembera account first — there is no invitation email yet, so we will not pretend to send one."
      >
        <input id="email" name="email" type="email" className="a-input" required />
      </Field>

      <div>
        <button type="submit" className="t-btn t-btn--primary" disabled={pending}>
          {pending ? "Adding…" : "Add to the team"}
        </button>
      </div>
    </form>
  );
}
