"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createCity, updateCity, type CityFormState } from "./actions";

const initial: CityFormState = {};

export interface CityFormValues {
  id?: number;
  name: string;
  group: string;
  province: string;
  lat: string;
  lng: string;
  image: string;
  sortOrder: number;
}

export default function CityForm({
  mode,
  values,
}: {
  mode: "create" | "edit";
  values?: CityFormValues;
}) {
  const action = mode === "edit" ? updateCity : createCity;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="a-form">
      {mode === "edit" && <input type="hidden" name="id" defaultValue={values?.id} />}
      {state.error && <p className="a-error" role="alert">{state.error}</p>}

      <div className="a-grid2">
        <div className="a-field">
          <label className="a-label">Name *</label>
          <input name="name" className="a-input" defaultValue={values?.name ?? ""} required />
        </div>
        <div className="a-field">
          <label className="a-label">Group</label>
          <input name="group" className="a-input" defaultValue={values?.group ?? ""} />
        </div>
        <div className="a-field">
          <label className="a-label">Province</label>
          <input name="province" className="a-input" defaultValue={values?.province ?? ""} />
        </div>
        <div className="a-field">
          <label className="a-label">Latitude</label>
          <input
            name="lat"
            type="number"
            step="any"
            className="a-input"
            defaultValue={values?.lat ?? ""}
          />
        </div>
        <div className="a-field">
          <label className="a-label">Longitude</label>
          <input
            name="lng"
            type="number"
            step="any"
            className="a-input"
            defaultValue={values?.lng ?? ""}
          />
        </div>
        <div className="a-field">
          <label className="a-label">Sort order</label>
          <input
            name="sortOrder"
            type="number"
            className="a-input"
            defaultValue={values?.sortOrder ?? 0}
          />
        </div>
        <div className="a-field">
          <label className="a-label">Image URL</label>
          <input name="image" className="a-input" defaultValue={values?.image ?? ""} />
        </div>
      </div>

      <div className="t-inline t-wrap">
        <button
          type="submit"
          className="t-btn t-btn--primary"
          disabled={pending}
        >
          {pending ? "Saving…" : mode === "edit" ? "Update city" : "Create city"}
        </button>
        {mode === "edit" && (
          <Link href="/admin/cities" className="t-btn t-btn--secondary">
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}
