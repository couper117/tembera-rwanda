"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Field, FormSection } from "@/components/admin/Field";
import HoursEditor from "@/components/admin/HoursEditor";
import MapPicker from "@/components/admin/MapPicker";
import Icon from "@/components/Icon";
import type { WeekHours } from "@/lib/places/hours";
import { createPlace, updatePlace, type PlaceFormState } from "./actions";

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
  hoursJson: WeekHours;
  phone: string;
  mapLink: string;
  website: string;
  highlights: string;
  priceFrom: string;
  keywords: string;
  sensitive: boolean;
  status: "draft" | "published" | "archived";
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
  cities,
}: {
  mode: "create" | "edit";
  values: PlaceFormValues;
  categories: CategoryOption[];
  cities: string[];
}) {
  const action = mode === "edit" ? updatePlace : createPlace;
  const [state, formAction, pending] = useActionState(action, initialState);

  const [categoryId, setCategoryId] = useState(values.categoryId);
  const [lat, setLat] = useState(values.lat);
  const [lng, setLng] = useState(values.lng);
  const [precision, setPrecision] = useState(values.coordsPrecision);

  const subs = categories.find((c) => c.id === categoryId)?.subcategories ?? [];
  const err = (field: string) => state?.fields?.[field];

  /**
   * A point placed by hand is not a district guess. Leaving the precision
   * behind would keep the public page calling the distance approximate for a
   * location somebody just corrected.
   */
  function setPoint(nextLat: string, nextLng: string) {
    setLat(nextLat);
    setLng(nextLng);
    setPrecision("exact");
  }

  return (
    <form action={formAction} className="a-form">
      {mode === "edit" && <input type="hidden" name="id" defaultValue={values.id} />}

      {state?.error && (
        <p className="a-error" role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="a-success" role="status">
          Saved.
        </p>
      )}

      <FormSection
        title="Identity"
        description="What this place is called, and where it sits in the catalogue."
      >
        <Field name="name" label="Name" required error={err("name")}>
          <input
            id="name"
            name="name"
            className="a-input"
            defaultValue={values.name}
            required
          />
        </Field>

        <div className="a-grid2">
          <Field name="categoryId" label="Category" required error={err("categoryId")}>
            <select
              id="categoryId"
              name="categoryId"
              className="a-select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              <option value="">Choose…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            name="subcategory"
            label="Subcategory"
            required
            error={err("subcategory")}
            hint="Must be one of the category's own subcategories."
          >
            <input
              id="subcategory"
              name="subcategory"
              className="a-input"
              list="subcategory-options"
              defaultValue={values.subcategory}
              required
            />
            <datalist id="subcategory-options">
              {subs.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>
        </div>

        <Field
          name="subtype"
          label="Subtype"
          error={err("subtype")}
          hint="Optional, freeform — a denomination, a cuisine, a speciality."
        >
          <input
            id="subtype"
            name="subtype"
            className="a-input"
            defaultValue={values.subtype}
          />
        </Field>
      </FormSection>

      <FormSection
        title="Location"
        description="Click the map to place it exactly. Most listings still carry only their district's centre."
      >
        <div className="a-grid2">
          <Field name="city" label="District" required error={err("city")}>
            <input
              id="city"
              name="city"
              className="a-input"
              list="city-options"
              defaultValue={values.city}
              required
            />
            <datalist id="city-options">
              {cities.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>

          <Field
            name="area"
            label="Area"
            error={err("area")}
            hint="The neighbourhood, if it has one."
          >
            <input id="area" name="area" className="a-input" defaultValue={values.area} />
          </Field>
        </div>

        <MapPicker lat={lat} lng={lng} onChange={setPoint} />

        <div className="a-grid2">
          <Field name="lat" label="Latitude" error={err("lat")}>
            <input
              id="lat"
              name="lat"
              className="a-input"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              inputMode="decimal"
            />
          </Field>
          <Field name="lng" label="Longitude" error={err("lng")}>
            <input
              id="lng"
              name="lng"
              className="a-input"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              inputMode="decimal"
            />
          </Field>
        </div>

        <Field
          name="coordsPrecision"
          label="How well do we know this?"
          error={err("coordsPrecision")}
          hint="Anything but 'exact' makes the public site show distances as approximate."
        >
          <select
            id="coordsPrecision"
            name="coordsPrecision"
            className="a-select"
            value={precision}
            onChange={(e) =>
              setPrecision(e.target.value as PlaceFormValues["coordsPrecision"])
            }
          >
            <option value="exact">Exact — a real coordinate</option>
            <option value="district">District centre only</option>
            <option value="unknown">Unknown</option>
          </select>
        </Field>

        <Field
          name="mapLink"
          label="External map link"
          error={err("mapLink")}
          hint="A Google Maps or OpenStreetMap URL, if the source had one."
        >
          <input
            id="mapLink"
            name="mapLink"
            className="a-input"
            defaultValue={values.mapLink}
          />
        </Field>
      </FormSection>

      <FormSection title="Contact" description="How a visitor reaches this place.">
        <div className="a-grid2">
          <Field
            name="phone"
            label="Phone"
            error={err("phone")}
            hint="+250 788 123 456, or however it is written locally."
          >
            <input
              id="phone"
              name="phone"
              className="a-input"
              defaultValue={values.phone}
            />
          </Field>
          <Field
            name="website"
            label="Website"
            error={err("website")}
            hint="A bare domain is fine — https:// is added for you."
          >
            <input
              id="website"
              name="website"
              className="a-input"
              defaultValue={values.website}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Opening hours"
        description="Set the week and the site can say whether a place is open right now."
      >
        <HoursEditor name="hoursJson" initial={values.hoursJson} />

        <Field
          name="hours"
          label="Free-text hours"
          error={err("hours")}
          hint="The fallback shown when the week above is not filled in — and the right home for 'dawn to dusk'."
        >
          <input
            id="hours"
            name="hours"
            className="a-input"
            defaultValue={values.hours}
          />
        </Field>
      </FormSection>

      <FormSection title="Content" description="What a visitor reads on the page.">
        <Field name="description" label="Description" error={err("description")}>
          <textarea
            id="description"
            name="description"
            className="a-textarea"
            rows={4}
            defaultValue={values.description}
          />
        </Field>

        <Field
          name="highlights"
          label="Highlights"
          error={err("highlights")}
          hint="Comma separated. These become the 'what to expect' chips."
        >
          <input
            id="highlights"
            name="highlights"
            className="a-input"
            defaultValue={values.highlights}
          />
        </Field>

        <Field
          name="keywords"
          label="Search keywords"
          error={err("keywords")}
          hint="Comma separated. Words people might search that are not in the name."
        >
          <input
            id="keywords"
            name="keywords"
            className="a-input"
            defaultValue={values.keywords}
          />
        </Field>
      </FormSection>

      <FormSection
        title="Photos"
        description="Paste image addresses for now. Upload arrives with the media work."
      >
        <Field
          name="image"
          label="Main photo"
          error={err("image")}
          hint="The one shown on cards and at the top of the page."
        >
          <input
            id="image"
            name="image"
            className="a-input"
            defaultValue={values.image}
          />
        </Field>

        <Field
          name="images"
          label="More photos"
          error={err("images")}
          hint="Comma separated addresses, shown in the gallery."
        >
          <input
            id="images"
            name="images"
            className="a-input"
            defaultValue={values.images}
          />
        </Field>
      </FormSection>

      <FormSection
        title="Publishing"
        description="Whether this listing is public, and how it may be presented."
      >
        <div className="a-grid2">
          <Field name="status" label="Status" error={err("status")}>
            <select
              id="status"
              name="status"
              className="a-select"
              defaultValue={values.status}
            >
              <option value="published">Published — live on the site</option>
              <option value="draft">Draft — not public yet</option>
              <option value="archived">Archived — retired, URL still works</option>
            </select>
          </Field>

          <Field
            name="rating"
            label="Editorial rating"
            error={err("rating")}
            hint="0–5. Overwritten by the average once visitors review it."
          >
            <input
              id="rating"
              name="rating"
              className="a-input"
              defaultValue={values.rating}
              inputMode="decimal"
            />
          </Field>
        </div>

        <Field
          name="priceFrom"
          label="Price from"
          error={err("priceFrom")}
          hint="Whole numbers only. Used for stays."
        >
          <input
            id="priceFrom"
            name="priceFrom"
            className="a-input"
            defaultValue={values.priceFrom}
            inputMode="numeric"
          />
        </Field>

        <label className="a-check">
          <input
            type="checkbox"
            name="sensitive"
            defaultChecked={values.sensitive}
          />
          <span>
            <strong>Place of remembrance.</strong> Suppresses ratings, reviews,
            prices and promotion everywhere. Every memorial-category listing is
            already treated this way; tick it for one filed elsewhere.
          </span>
        </label>
      </FormSection>

      <div className="t-inline t-wrap a-formactions">
        <button type="submit" className="t-btn t-btn--primary" disabled={pending}>
          {pending ? "Saving…" : mode === "edit" ? "Save changes" : "Create place"}
        </button>

        {mode === "edit" && values.id && (
          <Link
            href={`/place/${values.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="t-btn t-btn--secondary"
          >
            <Icon name="external" size={15} />
            Preview as public
          </Link>
        )}

        <Link href="/admin/places" className="t-btn t-btn--ghost">
          Back to places
        </Link>
      </div>
    </form>
  );
}
