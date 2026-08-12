"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  createPlace,
  updatePlace,
  type PlaceFormState,
} from "./actions";
import styles from "../admin.module.css";

export interface PlaceFormValues {
  id?: string;
  name: string;
  categoryId: string;
  subcategory: string;
  subtype: string;
  city: string;
  area: string;
  lat: string;
  lng: string;
  coordsPrecision: "exact" | "district" | "unknown";
  rating: string;
  image: string;
  description: string;
  hours: string;
  phone: string;
  mapLink: string;
  highlights: string;
  priceFrom: string;
  keywords: string;
}

export interface CategoryOption {
  id: string;
  label: string;
  subcategories: string[];
}

const initialState: PlaceFormState = {};

export default function PlaceForm({
  mode,
  values,
  categories,
}: {
  mode: "create" | "edit";
  values: PlaceFormValues;
  categories: CategoryOption[];
}) {
  const action = mode === "edit" ? updatePlace : createPlace;
  const [state, formAction, pending] = useActionState(action, initialState);

  const [categoryId, setCategoryId] = useState(values.categoryId);
  const subs =
    categories.find((c) => c.id === categoryId)?.subcategories ?? [];

  return (
    <form action={formAction} className={styles.form}>
      {mode === "edit" && <input type="hidden" name="id" defaultValue={values.id} />}

      {state?.error && <p className={styles.error}>{state.error}</p>}

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">
            Name *
          </label>
          <input
            id="name"
            name="name"
            className={styles.input}
            defaultValue={values.name}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="categoryId">
            Category *
          </label>
          <select
            id="categoryId"
            name="categoryId"
            className={styles.select}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="">— select —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label} ({c.id})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="subcategory">
            Subcategory *
          </label>
          <input
            id="subcategory"
            name="subcategory"
            className={styles.input}
            defaultValue={values.subcategory}
            list="subcategory-options"
            required
          />
          <datalist id="subcategory-options">
            {subs.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <span className={styles.hint}>
            Should match one of the category&apos;s subcategories.
          </span>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="subtype">
            Subtype
          </label>
          <input
            id="subtype"
            name="subtype"
            className={styles.input}
            defaultValue={values.subtype}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="city">
            City *
          </label>
          <input
            id="city"
            name="city"
            className={styles.input}
            defaultValue={values.city}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="area">
            Area
          </label>
          <input
            id="area"
            name="area"
            className={styles.input}
            defaultValue={values.area}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="lat">
            Latitude
          </label>
          <input
            id="lat"
            name="lat"
            type="number"
            step="any"
            className={styles.input}
            defaultValue={values.lat}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="lng">
            Longitude
          </label>
          <input
            id="lng"
            name="lng"
            type="number"
            step="any"
            className={styles.input}
            defaultValue={values.lng}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="coordsPrecision">
            Coords precision
          </label>
          <select
            id="coordsPrecision"
            name="coordsPrecision"
            className={styles.select}
            defaultValue={values.coordsPrecision}
          >
            <option value="exact">exact</option>
            <option value="district">district</option>
            <option value="unknown">unknown</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="rating">
            Rating
          </label>
          <input
            id="rating"
            name="rating"
            type="number"
            step="any"
            min="0"
            max="5"
            className={styles.input}
            defaultValue={values.rating}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="priceFrom">
            Price from
          </label>
          <input
            id="priceFrom"
            name="priceFrom"
            type="number"
            step="1"
            className={styles.input}
            defaultValue={values.priceFrom}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            className={styles.input}
            defaultValue={values.phone}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="hours">
            Hours
          </label>
          <input
            id="hours"
            name="hours"
            className={styles.input}
            defaultValue={values.hours}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="image">
            Image URL
          </label>
          <input
            id="image"
            name="image"
            className={styles.input}
            defaultValue={values.image}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="mapLink">
            Map link
          </label>
          <input
            id="mapLink"
            name="mapLink"
            className={styles.input}
            defaultValue={values.mapLink}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          className={styles.textarea}
          defaultValue={values.description}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="highlights">
          Highlights
        </label>
        <input
          id="highlights"
          name="highlights"
          className={styles.input}
          defaultValue={values.highlights}
        />
        <span className={styles.hint}>Comma-separated.</span>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="keywords">
          Keywords
        </label>
        <input
          id="keywords"
          name="keywords"
          className={styles.input}
          defaultValue={values.keywords}
        />
        <span className={styles.hint}>Comma-separated.</span>
      </div>

      <div className={styles.btnRow}>
        <button
          type="submit"
          className={`${styles.btn} ${styles.btnPrimary}`}
          disabled={pending}
        >
          {pending ? "Saving…" : mode === "edit" ? "Update place" : "Create place"}
        </button>
        <Link href="/admin/places" className={`${styles.btn} ${styles.btnSecondary}`}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
