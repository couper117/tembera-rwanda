"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Field } from "@/components/admin/Field";
import FormFeedback from "@/components/admin/FormFeedback";
import HoursEditor from "@/components/admin/HoursEditor";
import MapPicker from "@/components/admin/MapPicker";
import Icon from "@/components/Icon";
import type { WeekHours } from "@/lib/places/hours";
import { categoryHasPricing, priceFieldLabel } from "@/lib/places/pricing";
import {
  proposePlaceAction,
  updateMyPlaceAction,
  type BusinessState,
} from "@/lib/actions/business";

export interface BusinessPlaceValues {
  placeId?: string;
  name: string;
  categoryId: string;
  subcategory: string;
  city: string;
  subtype: string;
  area: string;
  lat: string;
  lng: string;
  coordsPrecision: "exact" | "district" | "unknown";
  description: string;
  hours: string;
  hoursJson: WeekHours;
  phone: string;
  website: string;
  image: string;
  images: string;
  highlights: string;
  priceFrom: string;
  keywords: string;
  mapLink: string;
}

const initial: BusinessState = {};

const TABS = [
  { id: "about", label: "About", fields: ["name", "categoryId", "subcategory", "subtype", "description"] },
  { id: "where", label: "Where", fields: ["city", "area", "lat", "lng", "coordsPrecision", "mapLink"] },
  { id: "contact", label: "Contact", fields: ["phone", "website"] },
  { id: "hours", label: "Hours", fields: ["hours", "hoursJson"] },
  { id: "photos", label: "Photos", fields: ["image", "images"] },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** So the summary reads "District" rather than "city". */
const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  categoryId: "Category",
  subcategory: "Subcategory",
  subtype: "Speciality",
  description: "Description",
  city: "District",
  area: "Area",
  lat: "Latitude",
  lng: "Longitude",
  mapLink: "Map link",
  phone: "Phone",
  website: "Website",
  hours: "Opening hours",
  image: "Main photo",
  images: "More photos",
  highlights: "Highlights",
  keywords: "Search words",
  priceFrom: "Price from",
};

/** The tab a field lives on, for jumping to it from the summary. */
function tabForField(field: string): TabId | undefined {
  return TABS.find((t) => (t.fields as readonly string[]).includes(field))?.id;
}

/**
 * The listing form a business sees.
 *
 * Shorter than the admin's on purpose. The fields that decide what a listing
 * IS — its name, category and district — are shown but locked when editing:
 * changing them is a decision about the catalogue, not about the business, so
 * it goes through Tembera. Rating, status and promotion are absent entirely,
 * because they are not the subject's to set.
 *
 * The server enforces all of that independently; see businessPlaceSchema. This
 * form is the explanation, not the guard.
 */
export default function BusinessPlaceForm({
  mode,
  values,
  categories,
  cities,
  verified,
}: {
  mode: "edit" | "create";
  values: BusinessPlaceValues;
  categories: { id: string; label: string; subcategories: string[] }[];
  cities: string[];
  verified: boolean;
}) {
  const action = mode === "edit" ? updateMyPlaceAction : proposePlaceAction;
  const [state, formAction, pending] = useActionState(action, initial);

  const [tab, setTab] = useState<TabId>("about");
  const [categoryId, setCategoryId] = useState(values.categoryId);
  const [lat, setLat] = useState(values.lat);
  const [lng, setLng] = useState(values.lng);
  const [precision, setPrecision] = useState(values.coordsPrecision);

  const subs = categories.find((c) => c.id === categoryId)?.subcategories ?? [];
  const err = (field: string) => state?.fields?.[field];
  const locked = mode === "edit";

  /**
   * What each field should show.
   *
   * React resets the form after the action runs, so on a rejected submission
   * the values prop is the only record of what was typed. Preferring it means
   * a person fixes one field rather than retyping all of them.
   */
  const v = (field: keyof BusinessPlaceValues) =>
    state?.values?.[field] ?? String(values[field] ?? "");

  // When the server rejects something, go to the tab holding it. Marking the
  // tab with a count says where the problem is; this saves the reader having
  // to go looking for it — and on a phone, where the tabs scroll sideways, the
  // marked tab may not even be on screen.
  useEffect(() => {
    if (!state?.fields) return;
    const bad = TABS.find((t) => t.fields.some((f) => state.fields?.[f]));
    if (bad) setTab(bad.id);
  }, [state]);

  // The controlled fields have to be put back by hand. The uncontrolled ones
  // are re-seeded by remounting them: React ignores a changed `defaultValue`
  // on an input that is already mounted, so bumping this key is what makes the
  // returned values actually appear. The key sits on the panels, not the
  // component, so the chosen tab survives.
  const [seed, setSeed] = useState(0);
  useEffect(() => {
    if (!state?.values) return;
    setCategoryId(state.values.categoryId ?? "");
    setLat(state.values.lat ?? "");
    setLng(state.values.lng ?? "");
    setSeed((n) => n + 1);
  }, [state?.values]);

  function setPoint(nextLat: string, nextLng: string) {
    setLat(nextLat);
    setLng(nextLng);
    setPrecision("exact");
  }

  return (
    <form action={formAction} className="a-form a-form--roomy" noValidate>
      {/*
        noValidate deliberately. Required fields live on tabs that are hidden
        rather than unmounted, and a browser cannot show its "please fill this
        in" bubble on an element it will not display — so it silently refuses
        to submit and the button appears dead. The server validates every field
        anyway and returns per-field messages, and the tab holding a rejected
        field is marked with a count, which is the behaviour we actually want:
        every problem reported at once, each next to its own input.
      */}
      {mode === "edit" && <input type="hidden" name="placeId" value={values.placeId} />}

      <FormFeedback
        fields={state?.fields}
        error={state?.error}
        success={state?.ok ? state.notice ?? "Saved." : undefined}
        labels={FIELD_LABELS}
        onGoToField={(field) => {
          const target = tabForField(field);
          if (target) setTab(target);
        }}
      />

      {!verified && mode === "edit" && (
        <div className="t-notice" style={{ marginBottom: "var(--t-3)" }}>
          <span className="t-notice__icon">
            <Icon name="info" size={16} />
          </span>
          <div className="t-notice__body">
            Until your account is verified, saving sends the change to Tembera
            for review rather than publishing it.
          </div>
        </div>
      )}

      <div className="a-tabs" role="tablist" aria-label="Listing details">
        {TABS.map((t) => {
          const problems = t.fields.filter((f) => err(f)).length;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`a-tab${tab === t.id ? " a-tab--on" : ""}${problems ? " a-tab--bad" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {problems > 0 && <span className="a-tab__count">{problems}</span>}
            </button>
          );
        })}
      </div>

      {/* Panels are hidden, not unmounted — an unmounted input is not
          submitted, so switching tabs would drop what was typed. */}
      <div className="a-tabpanel" role="tabpanel" hidden={tab !== "about"} key={`about-${seed}`}>
        <Field
          name="name"
          label="Name"
          required
          error={err("name")}
          hint={locked ? "Ask Tembera to change the name of a published listing." : undefined}
        >
          <input
            id="name"
            name="name"
            className="a-input"
            defaultValue={v("name")}
            readOnly={locked}
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
              disabled={locked}
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

          <Field name="subcategory" label="Subcategory" required error={err("subcategory")}>
            <input
              id="subcategory"
              name="subcategory"
              className="a-input"
              list="biz-subcategories"
              defaultValue={v("subcategory")}
              readOnly={locked}
              required
            />
            <datalist id="biz-subcategories">
              {subs.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>
        </div>

        <Field
          name="subtype"
          label="Speciality"
          error={err("subtype")}
          hint="Optional — a cuisine, a denomination, what you are known for."
        >
          <input id="subtype" name="subtype" className="a-input" defaultValue={v("subtype")} />
        </Field>

        <Field
          name="description"
          label="Description"
          error={err("description")}
          hint="What a visitor should know before they come."
        >
          <textarea
            id="description"
            name="description"
            className="a-textarea"
            rows={5}
            defaultValue={v("description")}
          />
        </Field>

        <Field
          name="highlights"
          label="Highlights"
          error={err("highlights")}
          hint="Comma separated — the two or three things people come for."
        >
          <input
            id="highlights"
            name="highlights"
            className="a-input"
            defaultValue={v("highlights")}
          />
        </Field>

        <Field name="keywords" label="Search words" error={err("keywords")} hint="Comma separated.">
          <input id="keywords" name="keywords" className="a-input" defaultValue={v("keywords")} />
        </Field>
      </div>

      <div className="a-tabpanel" role="tabpanel" hidden={tab !== "where"} key={`where-${seed}`}>
        <div className="a-grid2">
          <Field
            name="city"
            label="District"
            required
            error={err("city")}
            hint={locked ? "Ask Tembera to move a listing between districts." : undefined}
          >
            <input
              id="city"
              name="city"
              className="a-input"
              list="biz-cities"
              defaultValue={v("city")}
              readOnly={locked}
              required
            />
            <datalist id="biz-cities">
              {cities.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field name="area" label="Area" error={err("area")}>
            <input id="area" name="area" className="a-input" defaultValue={v("area")} />
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

        <input type="hidden" name="coordsPrecision" value={precision} />

        <Field name="mapLink" label="Map link" error={err("mapLink")}>
          <input id="mapLink" name="mapLink" className="a-input" defaultValue={v("mapLink")} />
        </Field>
      </div>

      <div className="a-tabpanel" role="tabpanel" hidden={tab !== "contact"} key={`contact-${seed}`}>
        <div className="a-grid2">
          <Field name="phone" label="Phone" error={err("phone")}>
            <input id="phone" name="phone" className="a-input" defaultValue={v("phone")} />
          </Field>
          <Field
            name="website"
            label="Website"
            error={err("website")}
            hint="A bare domain is fine."
          >
            <input id="website" name="website" className="a-input" defaultValue={v("website")} />
          </Field>
        </div>
      </div>

      <div className="a-tabpanel" role="tabpanel" hidden={tab !== "hours"} key={`hours-${seed}`}>
        <HoursEditor name="hoursJson" initial={values.hoursJson} />
        <Field
          name="hours"
          label="Or describe them"
          error={err("hours")}
          hint="Used when the week above is empty."
        >
          <input id="hours" name="hours" className="a-input" defaultValue={v("hours")} />
        </Field>
      </div>

      <div className="a-tabpanel" role="tabpanel" hidden={tab !== "photos"} key={`photos-${seed}`}>
        <Field
          name="image"
          label="Main photo"
          error={err("image")}
          hint="Paste the web address of a photo. Uploads are coming."
        >
          <input id="image" name="image" className="a-input" defaultValue={v("image")} />
        </Field>
        <Field name="images" label="More photos" error={err("images")} hint="Comma separated.">
          <input id="images" name="images" className="a-input" defaultValue={v("images")} />
        </Field>
        {/* Only where a starting price is a real concept. A bank or a
            memorial has no "from" price, and offering the field invites one. */}
        {categoryHasPricing(categoryId) && (
          <Field
            name="priceFrom"
            label={priceFieldLabel(categoryId)}
            error={err("priceFrom")}
            hint="Whole francs. Shown to visitors as a starting price."
          >
            <input
              id="priceFrom"
              name="priceFrom"
              className="a-input"
              defaultValue={v("priceFrom")}
              inputMode="numeric"
            />
          </Field>
        )}
      </div>

      <div className="a-formactions t-inline t-wrap">
        <button type="submit" className="t-btn t-btn--primary" disabled={pending}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Send to Tembera"
              : verified
                ? "Save changes"
                : "Send changes for review"}
        </button>
        {mode === "edit" && values.placeId && (
          <Link
            href={`/place/${values.placeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="t-btn t-btn--secondary"
          >
            <Icon name="external" size={15} />
            View
          </Link>
        )}
        <Link href="/business/dashboard/listings" className="t-btn t-btn--ghost">
          Back
        </Link>
      </div>
    </form>
  );
}
