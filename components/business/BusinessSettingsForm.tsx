"use client";

import { useActionState } from "react";
import { Field } from "@/components/admin/Field";
import {
  updateBusinessProfileAction,
  type BusinessState,
} from "@/lib/actions/business";

const initial: BusinessState = {};

export default function BusinessSettingsForm({
  values,
  cities,
  canEdit,
}: {
  values: {
    name: string;
    contactName: string;
    email: string;
    phone: string;
    city: string;
    tin: string;
  };
  cities: string[];
  canEdit: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateBusinessProfileAction, initial);

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

      <Field name="name" label="Business name" required error={state.fields?.name}>
        <input
          id="name"
          name="name"
          className="a-input"
          defaultValue={values.name}
          disabled={!canEdit}
          required
        />
      </Field>

      <div className="a-grid2">
        <Field name="contactName" label="Contact person" required error={state.fields?.contactName}>
          <input
            id="contactName"
            name="contactName"
            className="a-input"
            defaultValue={values.contactName}
            disabled={!canEdit}
            required
          />
        </Field>
        <Field name="phone" label="Phone" required error={state.fields?.phone}>
          <input
            id="phone"
            name="phone"
            className="a-input"
            defaultValue={values.phone}
            disabled={!canEdit}
            required
          />
        </Field>
      </div>

      <div className="a-grid2">
        <Field name="email" label="Email" required error={state.fields?.email}>
          <input
            id="email"
            name="email"
            type="email"
            className="a-input"
            defaultValue={values.email}
            disabled={!canEdit}
            required
          />
        </Field>
        <Field name="city" label="District" required error={state.fields?.city}>
          <input
            id="city"
            name="city"
            className="a-input"
            list="biz-settings-cities"
            defaultValue={values.city}
            disabled={!canEdit}
            required
          />
          <datalist id="biz-settings-cities">
            {cities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
      </div>

      <Field
        name="tin"
        label="RRA taxpayer number"
        error={state.fields?.tin}
        hint="Nine digits. Tembera uses this to verify you are who you say you are — a verified account publishes without review."
      >
        <input
          id="tin"
          name="tin"
          className="a-input"
          defaultValue={values.tin}
          disabled={!canEdit}
          inputMode="numeric"
        />
      </Field>

      {canEdit ? (
        <div>
          <button type="submit" className="t-btn t-btn--primary" disabled={pending}>
            {pending ? "Saving…" : "Save details"}
          </button>
        </div>
      ) : (
        <p className="a-hint">
          Only the account owner can change these. Ask them, or contact Tembera.
        </p>
      )}
    </form>
  );
}
