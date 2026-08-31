"use client";

import { useActionState } from "react";
import { Field } from "@/components/admin/Field";
import type { Settings } from "@/lib/data/settings";
import { updateSettingsAction, type SettingsState } from "./actions";

const initial: SettingsState = {};

export default function SettingsForm({ values }: { values: Settings }) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, initial);

  return (
    <form action={formAction} className="a-form a-form--roomy">
      {state.error && (
        <p className="a-error" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="a-success" role="status">
          Saved.
        </p>
      )}

      <Field name="orgName" label="Name" required>
        <input
          id="orgName"
          name="orgName"
          className="a-input"
          defaultValue={values.orgName}
          required
        />
      </Field>

      <Field
        name="orgContact"
        label="Public contact address"
        hint="Printed on the privacy page as the way to reach someone about their data. Left blank, that page says so plainly rather than showing an address nobody reads."
      >
        <input
          id="orgContact"
          name="orgContact"
          className="a-input"
          defaultValue={values.orgContact}
          placeholder="privacy@tembera.rw"
        />
      </Field>

      <Field name="orgBlurb" label="Description">
        <textarea
          id="orgBlurb"
          name="orgBlurb"
          className="a-textarea"
          rows={3}
          defaultValue={values.orgBlurb}
        />
      </Field>

      <div>
        <button type="submit" className="t-btn t-btn--primary" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
