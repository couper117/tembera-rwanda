"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Field } from "@/components/admin/Field";
import FormFeedback from "@/components/admin/FormFeedback";
import { PLANS } from "@/lib/business/plans";
import { registerBusinessAction, type BusinessState } from "@/lib/actions/business";

const initial: BusinessState = {};

export default function RegisterBusinessForm({ cities }: { cities: string[] }) {
  const [state, formAction, pending] = useActionState(registerBusinessAction, initial);
  const router = useRouter();

  // The action signs in and reports success; the navigation happens here. See
  // the note in registerBusinessAction on why it does not redirect itself.
  useEffect(() => {
    if (state.ok) router.push("/business/dashboard");
  }, [state.ok, router]);

  return (
    <form action={formAction} className="a-form a-form--roomy">
      <FormFeedback
        fields={state.fields}
        error={state.error}
        labels={{
          businessName: "Business name",
          contactName: "Your name",
          email: "Email",
          phone: "Phone",
          city: "District",
          password: "Password",
        }}
      />

      <Field name="businessName" label="Business name" required error={state.fields?.businessName}>
        <input id="businessName" name="businessName" className="a-input" required />
      </Field>

      <div className="a-grid2">
        <Field name="contactName" label="Your name" required error={state.fields?.contactName}>
          <input id="contactName" name="contactName" className="a-input" required />
        </Field>
        <Field name="phone" label="Phone" required error={state.fields?.phone}>
          <input id="phone" name="phone" className="a-input" placeholder="+250 788 123 456" required />
        </Field>
      </div>

      <div className="a-grid2">
        <Field name="email" label="Email" required error={state.fields?.email}>
          <input id="email" name="email" type="email" className="a-input" required />
        </Field>
        <Field name="city" label="District" required error={state.fields?.city}>
          <input id="city" name="city" className="a-input" list="signup-cities" required />
          <datalist id="signup-cities">
            {cities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
      </div>

      <Field
        name="password"
        label="Password"
        required
        error={state.fields?.password}
        hint="At least 8 characters. This is how you sign in."
      >
        <input
          id="password"
          name="password"
          type="password"
          className="a-input"
          minLength={8}
          required
        />
      </Field>

      <Field
        name="plan"
        label="Which plan interests you?"
        hint="Nothing is charged here. Tembera will contact you about it."
      >
        <select id="plan" name="plan" className="a-select" defaultValue="free">
          {PLANS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.rwf === 0 ? "free" : `${p.rwf.toLocaleString()} RWF / month`}
            </option>
          ))}
        </select>
      </Field>

      <div className="t-inline t-wrap">
        <button type="submit" className="t-btn t-btn--primary" disabled={pending}>
          {pending ? "Creating…" : "Create the account"}
        </button>
        <Link href="/login" className="t-btn t-btn--ghost">
          I already have one
        </Link>
      </div>
    </form>
  );
}
