"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createCity, updateCity, type CityFormState } from "./actions";
import styles from "../admin.module.css";

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
    <form action={formAction} className={styles.form}>
      {mode === "edit" && <input type="hidden" name="id" defaultValue={values?.id} />}
      {state.error && <p className={styles.error}>{state.error}</p>}

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label}>Name *</label>
          <input name="name" className={styles.input} defaultValue={values?.name ?? ""} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Group</label>
          <input name="group" className={styles.input} defaultValue={values?.group ?? ""} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Province</label>
          <input name="province" className={styles.input} defaultValue={values?.province ?? ""} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Latitude</label>
          <input
            name="lat"
            type="number"
            step="any"
            className={styles.input}
            defaultValue={values?.lat ?? ""}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Longitude</label>
          <input
            name="lng"
            type="number"
            step="any"
            className={styles.input}
            defaultValue={values?.lng ?? ""}
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
          <label className={styles.label}>Image URL</label>
          <input name="image" className={styles.input} defaultValue={values?.image ?? ""} />
        </div>
      </div>

      <div className={styles.btnRow}>
        <button
          type="submit"
          className={`${styles.btn} ${styles.btnPrimary}`}
          disabled={pending}
        >
          {pending ? "Saving…" : mode === "edit" ? "Update city" : "Create city"}
        </button>
        {mode === "edit" && (
          <Link href="/admin/cities" className={`${styles.btn} ${styles.btnSecondary}`}>
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}
