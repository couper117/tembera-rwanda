"use client";

import { useActionState } from "react";
import { createCategory, updateCategory, type ActionState } from "./actions";

const initial: ActionState = {};

export interface CategoryFormValues {
  id: string;
  label: string;
  title: string;
  icon: string;
  primary: boolean;
  sortOrder: number;
}

export default function CategoryForm({
  mode,
  values,
}: {
  mode: "create" | "edit";
  values?: CategoryFormValues;
}) {
  const action = mode === "edit" ? updateCategory : createCategory;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="a-form">
      {state.error && <p className="a-error">{state.error}</p>}
      {state.success && <p className="a-success">{state.success}</p>}

      <div className="a-grid2">
        <div className="a-field">
          <label className="a-label">Id *</label>
          <input
            name="id"
            className="a-input"
            defaultValue={values?.id ?? ""}
            readOnly={mode === "edit"}
            placeholder="dining"
            required
          />
          {mode === "edit" && <span className="a-hint">Immutable.</span>}
        </div>
        <div className="a-field">
          <label className="a-label">Label *</label>
          <input
            name="label"
            className="a-input"
            defaultValue={values?.label ?? ""}
            required
          />
        </div>
        <div className="a-field">
          <label className="a-label">Title *</label>
          <input
            name="title"
            className="a-input"
            defaultValue={values?.title ?? ""}
            required
          />
        </div>
        <div className="a-field">
          <label className="a-label">Icon *</label>
          <input
            name="icon"
            className="a-input"
            defaultValue={values?.icon ?? ""}
            placeholder="utensils"
            required
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
          <label className="a-label">Primary</label>
          <div className="a-checkrow">
            <input
              type="checkbox"
              name="primary"
              defaultChecked={values?.primary ?? false}
            />
            <span className="a-hint">Show in the home Explore row.</span>
          </div>
        </div>
      </div>

      <div className="t-inline t-wrap">
        <button
          type="submit"
          className="t-btn t-btn--primary"
          disabled={pending}
        >
          {pending ? "Saving…" : mode === "edit" ? "Update category" : "Create category"}
        </button>
      </div>
    </form>
  );
}
