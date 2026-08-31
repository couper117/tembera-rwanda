"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  createPlace,
  updatePlace,
  type PlaceFormState,
} from "./actions";

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
  images: string;
  description: string;
  hours: string;
  phone: string;
  mapLink: string;
  website: string;
  highlights: string;
  priceFrom: string;
  keywords: string;
  sensitive: boolean;
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
    <form action={formAction} className="a-form">
      {mode === "edit" && <input type="hidden" name="id" defaultValue={values.id} />}

      {state?.error && <p className="a-error" role="alert">{state.error}</p>}

      <div className="a-grid2">
        <div className="a-field">
          <label className="a-label" htmlFor="name">
            Name *
          </label>
          <input
            id="name"
            name="name"
            className="a-input"
            defaultValue={values.name}
            required
          />
        </div>

        <div className="a-field">
          <label className="a-label" htmlFor="categoryId">
            Category *
          </label>
          <select
            id="categoryId"
            name="categoryId"
            className="a-select"
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

        <div className="a-field">
          <label className="a-label" htmlFor="subcategory">
            Subcategory *
          </label>
          <input
            id="subcategory"
            name="subcategory"
            className="a-input"
            defaultValue={values.subcategory}
            list="subcategory-options"
            required
          />
          <datalist id="subcategory-options">
            {subs.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <span className="a-hint">
            Should match one of the category&apos;s subcategories.
          </span>
        </div>

        <div className="a-field">
          <label className="a-label" htmlFor="subtype">
            Subtype
          </label>
          <input
            id="subtype"
            name="subtype"
            className="a-input"
            defaultValue={values.subtype}
          />
        </div>

        <div className="a-field">
          <label className="a-label" htmlFor="city">
            City *
          </label>
          <input
            id="city"
            name="city"
            className="a-input"
            defaultValue={values.city}
            required
          />
        </div>

        <div className="a-field">
          <label className="a-label" htmlFor="area">
            Area
          </label>
          <input
            id="area"
            name="area"
            className="a-input"
            defaultValue={values.area}
          />
        </div>

        <div className="a-field">
          <label className="a-label" htmlFor="lat">
            Latitude
          </label>
          <input
            id="lat"
            name="lat"
            type="number"
            step="any"
            className="a-input"
            defaultValue={values.lat}
          />
        </div>

        <div className="a-field">
          <label className="a-label" htmlFor="lng">
            Longitude
          </label>
          <input
            id="lng"
            name="lng"
            type="number"
            step="any"
            className="a-input"
            defaultValue={values.lng}
          />
        </div>

        <div className="a-field">
          <label className="a-label" htmlFor="coordsPrecision">
            Coords precision
          </label>
          <select
            id="coordsPrecision"
            name="coordsPrecision"
            className="a-select"
            defaultValue={values.coordsPrecision}
          >
            <option value="exact">exact</option>
            <option value="district">district</option>
            <option value="unknown">unknown</option>
          </select>
        </div>

        <div className="a-field">
          <label className="a-label" htmlFor="rating">
            Rating
          </label>
          <input
            id="rating"
            name="rating"
            type="number"
            step="any"
            min="0"
            max="5"
            className="a-input"
            defaultValue={values.rating}
          />
        </div>

        <div className="a-field">
          <label className="a-label" htmlFor="priceFrom">
            Price from
          </label>
          <input
            id="priceFrom"
            name="priceFrom"
            type="number"
            step="1"
            className="a-input"
            defaultValue={values.priceFrom}
          />
        </div>

        <div className="a-field">
          <label className="a-label" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            className="a-input"
            defaultValue={values.phone}
          />
        </div>

        <div className="a-field">
          <label className="a-label" htmlFor="hours">
            Hours
          </label>
          <input
            id="hours"
            name="hours"
            className="a-input"
            defaultValue={values.hours}
          />
        </div>

        <div className="a-field">
          <label className="a-label" htmlFor="image">
            Image URL
          </label>
          <input
            id="image"
            name="image"
            className="a-input"
            defaultValue={values.image}
          />
        </div>

        <div className="a-field">
          <label className="a-label" htmlFor="mapLink">
            Map link
          </label>
          <input
            id="mapLink"
            name="mapLink"
            className="a-input"
            defaultValue={values.mapLink}
          />
        </div>

        <div className="a-field">
          <label className="a-label" htmlFor="website">
            Website
          </label>
          <input
            id="website"
            name="website"
            className="a-input"
            placeholder="https://…"
            defaultValue={values.website}
          />
        </div>

        <div className="a-field">
          <label className="a-label">Sensitive</label>
          <div className="a-checkrow">
            <input type="checkbox" name="sensitive" defaultChecked={values.sensitive} />
            <span className="a-hint">
              Hides ratings &amp; reviews out of respect. The memorials category is
              sensitive by default — check this only for places outside it.
            </span>
          </div>
        </div>
      </div>

      <div className="a-field">
        <label className="a-label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          className="a-textarea"
          defaultValue={values.description}
        />
      </div>

      <div className="a-field">
        <label className="a-label" htmlFor="highlights">
          Highlights
        </label>
        <input
          id="highlights"
          name="highlights"
          className="a-input"
          defaultValue={values.highlights}
        />
        <span className="a-hint">Comma-separated.</span>
      </div>

      <div className="a-field">
        <label className="a-label" htmlFor="images">
          Gallery photos
        </label>
        <input
          id="images"
          name="images"
          className="a-input"
          defaultValue={values.images}
        />
        <span className="a-hint">Comma-separated image URLs, shown below the hero photo.</span>
      </div>

      <div className="a-field">
        <label className="a-label" htmlFor="keywords">
          Keywords
        </label>
        <input
          id="keywords"
          name="keywords"
          className="a-input"
          defaultValue={values.keywords}
        />
        <span className="a-hint">Comma-separated.</span>
      </div>

      <div className="t-inline t-wrap">
        <button
          type="submit"
          className="t-btn t-btn--primary"
          disabled={pending}
        >
          {pending ? "Saving…" : mode === "edit" ? "Update place" : "Create place"}
        </button>
        <Link href="/admin/places" className="t-btn t-btn--secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
