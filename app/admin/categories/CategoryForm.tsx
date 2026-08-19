"use client";

import { useActionState } from "react";
import { createCategory, updateCategory, type ActionState } from "./actions";
import styles from "../admin.module.css";

const initial: ActionState = {};

export interface CategoryFormValues {
  id: string;
  label: string;
  title: string;
  icon: string;
  primary: boolean;
  sensitive: boolean;
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
    <form action={formAction} className={styles.form}>
      {state.error && <p className={styles.error}>{state.error}</p>}
      {state.success && <p className={styles.success}>{state.success}</p>}

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label}>Id *</label>
          <input
            name="id"
            className={styles.input}
            defaultValue={values?.id ?? ""}
            readOnly={mode === "edit"}
            placeholder="dining"
            required
          />
          {mode === "edit" && <span className={styles.hint}>Immutable.</span>}
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Label *</label>
          <input
            name="label"
            className={styles.input}
            defaultValue={values?.label ?? ""}
            required
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Title *</label>
          <input
            name="title"
            className={styles.input}
            defaultValue={values?.title ?? ""}
            required
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Icon *</label>
          <input
            name="icon"
            className={styles.input}
            defaultValue={values?.icon ?? ""}
            placeholder="utensils"
            required
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Sort order</label>
          <input
            name="sortOrder"
            type="number"
            className={styles.input}
            defaultValue={values?.sortOrder ?? 0}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Primary</label>
          <div className={styles.checkRow}>
            <input
              type="checkbox"
              name="primary"
              defaultChecked={values?.primary ?? false}
            />
            <span className={styles.hint}>Show in the home Explore row.</span>
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Place of remembrance</label>
          <div className={styles.checkRow}>
            <input
              type="checkbox"
              name="sensitive"
              defaultChecked={values?.sensitive ?? false}
            />
            <span className={styles.hint}>
              For memorials and similar. Removes ratings, reviews, prices and
              promotional placement everywhere, and uses a restrained layout.
            </span>
          </div>
        </div>
      </div>

      <div className={styles.btnRow}>
        <button
          type="submit"
          className={`${styles.btn} ${styles.btnPrimary}`}
          disabled={pending}
        >
          {pending ? "Saving…" : mode === "edit" ? "Update category" : "Create category"}
        </button>
      </div>
    </form>
  );
}
