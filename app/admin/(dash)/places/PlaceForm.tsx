"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Field } from "@/components/admin/Field";
import FormFeedback from "@/components/admin/FormFeedback";
import HoursEditor from "@/components/admin/HoursEditor";
import MapPicker from "@/components/admin/MapPicker";
import Icon from "@/components/Icon";
import { summariseWeek, type WeekHours } from "@/lib/places/hours";
import { categoryHasPricing, priceFieldLabel } from "@/lib/places/pricing";
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

/**
 * Which fields live behind which tab.
 *
 * Used for two things: rendering the panels, and marking a tab that holds a
 * rejected field. Without the second, a validation error on a hidden tab is
 * invisible — the form just refuses to save and never says where.
 */
const TABS = [
  { id: "identity", label: "Identity", fields: ["name", "categoryId", "subcategory", "subtype"] },
  { id: "location", label: "Location", fields: ["city", "area", "lat", "lng", "coordsPrecision", "mapLink"] },
  { id: "contact", label: "Contact", fields: ["phone", "website"] },
  { id: "hours", label: "Hours", fields: ["hours", "hoursJson"] },
  { id: "content", label: "Content", fields: ["description", "highlights", "keywords"] },
  { id: "photos", label: "Photos", fields: ["image", "images"] },
  { id: "publishing", label: "Publishing", fields: ["status", "rating", "priceFrom", "sensitive"] },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** So the summary reads "District" rather than "city". */
const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  categoryId: "Category",
  subcategory: "Subcategory",
  subtype: "Subtype",
  city: "District",
  area: "Area",
  lat: "Latitude",
  lng: "Longitude",
  coordsPrecision: "Location accuracy",
  mapLink: "Map link",
  phone: "Phone",
  website: "Website",
  hours: "Free-text hours",
  hoursJson: "Opening hours",
  description: "Description",
  highlights: "Highlights",
  keywords: "Search keywords",
  image: "Main photo",
  images: "More photos",
  status: "Status",
  rating: "Editorial rating",
  priceFrom: "Price from",
  sensitive: "Place of remembrance",
};

function tabForField(field: string): TabId | undefined {
  return TABS.find((t) => (t.fields as readonly string[]).includes(field))?.id;
}

/**
 * What "finished" means for a listing.
 *
 * Deliberately the things a visitor actually needs — can I see it, find it,
 * reach it, and know what it is — rather than every column being non-null.
 */
const COMPLETENESS = [
  { key: "photo", label: "A photo" },
  { key: "description", label: "A description" },
  { key: "exact", label: "An exact location" },
  { key: "contact", label: "A phone or website" },
  { key: "hours", label: "Opening hours" },
] as const;

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

  const [tab, setTab] = useState<TabId>("identity");

  // Tracked so the preview card and the completeness meter respond as you
  // type. Everything else stays uncontrolled — there is no reason to re-render
  // the whole form on every keystroke in a field nothing else reads.
  const [name, setName] = useState(values.name);
  const [categoryId, setCategoryId] = useState(values.categoryId);
  const [subcategory, setSubcategory] = useState(values.subcategory);
  const [city, setCity] = useState(values.city);
  const [image, setImage] = useState(values.image);
  const [description, setDescription] = useState(values.description);
  const [phone, setPhone] = useState(values.phone);
  const [website, setWebsite] = useState(values.website);
  const [lat, setLat] = useState(values.lat);
  const [lng, setLng] = useState(values.lng);
  const [precision, setPrecision] = useState(values.coordsPrecision);
  const [week, setWeek] = useState<WeekHours>(values.hoursJson);
  const [status, setStatus] = useState(values.status);

  const subs = categories.find((c) => c.id === categoryId)?.subcategories ?? [];
  const err = (field: string) => state?.fields?.[field];

  // When the server rejects something, go to the tab holding it. Marking the
  // tab with a count says where the problem is; this saves the reader having
  // to go looking for it — and on a phone, where the tabs scroll sideways, the
  // marked tab may not even be on screen.
  useEffect(() => {
    if (!state?.fields) return;
    const bad = TABS.find((t) => t.fields.some((f) => state.fields?.[f]));
    if (bad) setTab(bad.id);
  }, [state]);

  const done = useMemo(() => {
    const summary = summariseWeek(week);
    return {
      photo: Boolean(image.trim()),
      description: description.trim().length > 20,
      exact: precision === "exact" && Boolean(lat && lng),
      contact: Boolean(phone.trim() || website.trim()),
      hours: Boolean(summary),
    } as Record<string, boolean>;
  }, [image, description, precision, lat, lng, phone, website, week]);

  const doneCount = COMPLETENESS.filter((c) => done[c.key]).length;
  const percent = Math.round((doneCount / COMPLETENESS.length) * 100);

  /** A pin placed by hand is not a district guess — see the note in the action. */
  function setPoint(nextLat: string, nextLng: string) {
    setLat(nextLat);
    setLng(nextLng);
    setPrecision("exact");
  }

  const categoryLabel = categories.find((c) => c.id === categoryId)?.label ?? "";

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
      {mode === "edit" && <input type="hidden" name="id" defaultValue={values.id} />}

      {/* ---------------------------------------------------------- header */}
      <div className="a-editorhead">
        <div className="a-preview">
          {image.trim() ? (
            /* eslint-disable-next-line @next/next/no-img-element --
               listing photos come from a dozen hosts; the public PlaceImage
               uses a plain img for the same reason. */
            <img src={image} alt="" className="a-preview__img" />
          ) : (
            <span className="a-preview__img a-preview__img--empty">
              <Icon name="image" size={18} />
            </span>
          )}
          <span className="a-preview__body">
            <span className="a-preview__name">{name || "Untitled listing"}</span>
            <span className="a-preview__meta">
              {[categoryLabel, subcategory, city].filter(Boolean).join(" · ") ||
                "Not categorised yet"}
            </span>
          </span>
        </div>

        <div className="a-complete">
          <div className="a-complete__bar" aria-hidden="true">
            <span style={{ width: `${percent}%` }} />
          </div>
          <p className="a-complete__label">
            {percent}% complete
            {doneCount < COMPLETENESS.length && (
              <>
                {" — still missing "}
                {COMPLETENESS.filter((c) => !done[c.key])
                  .map((c) => c.label.toLowerCase())
                  .join(", ")}
              </>
            )}
          </p>
        </div>

        <div className="a-editorhead__actions">
          {mode === "edit" && values.id && (
            <Link
              href={`/place/${values.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="t-btn t-btn--secondary t-btn--sm"
            >
              <Icon name="external" size={15} />
              Preview
            </Link>
          )}
          <button type="submit" className="t-btn t-btn--primary t-btn--sm" disabled={pending}>
            {pending ? "Saving…" : mode === "edit" ? "Save changes" : "Create place"}
          </button>
        </div>
      </div>

      <FormFeedback
        fields={state?.fields}
        error={state?.error}
        success={state?.ok ? "Saved." : undefined}
        labels={FIELD_LABELS}
        onGoToField={(field) => {
          const target = tabForField(field);
          if (target) setTab(target);
        }}
      />

      {/* ------------------------------------------------------------ tabs */}
      <div className="a-tabs" role="tablist" aria-label="Listing details">
        {TABS.map((t) => {
          const problems = t.fields.filter((f) => err(f)).length;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              className={`a-tab${tab === t.id ? " a-tab--on" : ""}${problems ? " a-tab--bad" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {problems > 0 && (
                <span className="a-tab__count" aria-label={`${problems} problems`}>
                  {problems}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/*
        Every panel stays mounted and is hidden with the `hidden` attribute
        rather than unmounted. An unmounted input is not submitted, so
        switching tabs would silently drop whatever was typed on the others.
      */}
      <div
        className="a-tabpanel"
        role="tabpanel"
        id="panel-identity"
        aria-labelledby="tab-identity"
        hidden={tab !== "identity"}
      >
        <Field name="name" label="Name" required error={err("name")}>
          <input
            id="name"
            name="name"
            className="a-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
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
          hint="Optional — a denomination, a cuisine, a speciality."
        >
          <input id="subtype" name="subtype" className="a-input" defaultValue={values.subtype} />
        </Field>
      </div>

      <div
        className="a-tabpanel"
        role="tabpanel"
        id="panel-location"
        aria-labelledby="tab-location"
        hidden={tab !== "location"}
      >
        <div className="a-grid2">
          <Field name="city" label="District" required error={err("city")}>
            <input
              id="city"
              name="city"
              className="a-input"
              list="city-options"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
            <datalist id="city-options">
              {cities.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>

          <Field name="area" label="Area" error={err("area")} hint="The neighbourhood, if it has one.">
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
            onChange={(e) => setPrecision(e.target.value as PlaceFormValues["coordsPrecision"])}
          >
            <option value="exact">Exact — a real coordinate</option>
            <option value="district">District centre only</option>
            <option value="unknown">Unknown</option>
          </select>
        </Field>

        <Field name="mapLink" label="External map link" error={err("mapLink")}>
          <input id="mapLink" name="mapLink" className="a-input" defaultValue={values.mapLink} />
        </Field>
      </div>

      <div
        className="a-tabpanel"
        role="tabpanel"
        id="panel-contact"
        aria-labelledby="tab-contact"
        hidden={tab !== "contact"}
      >
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
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div
        className="a-tabpanel"
        role="tabpanel"
        id="panel-hours"
        aria-labelledby="tab-hours"
        hidden={tab !== "hours"}
      >
        <HoursEditor name="hoursJson" initial={values.hoursJson} onChange={setWeek} />

        <Field
          name="hours"
          label="Free-text hours"
          error={err("hours")}
          hint="The fallback when the week above is empty — and the right home for 'dawn to dusk'."
        >
          <input id="hours" name="hours" className="a-input" defaultValue={values.hours} />
        </Field>
      </div>

      <div
        className="a-tabpanel"
        role="tabpanel"
        id="panel-content"
        aria-labelledby="tab-content"
        hidden={tab !== "content"}
      >
        <Field name="description" label="Description" error={err("description")}>
          <textarea
            id="description"
            name="description"
            className="a-textarea"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <Field
          name="highlights"
          label="Highlights"
          error={err("highlights")}
          hint="Comma separated. These become the 'what to expect' chips."
        >
          <input id="highlights" name="highlights" className="a-input" defaultValue={values.highlights} />
        </Field>

        <Field
          name="keywords"
          label="Search keywords"
          error={err("keywords")}
          hint="Comma separated. Words people search that are not in the name."
        >
          <input id="keywords" name="keywords" className="a-input" defaultValue={values.keywords} />
        </Field>
      </div>

      <div
        className="a-tabpanel"
        role="tabpanel"
        id="panel-photos"
        aria-labelledby="tab-photos"
        hidden={tab !== "photos"}
      >
        <Field
          name="image"
          label="Main photo"
          error={err("image")}
          hint="Shown on cards and at the top of the page."
        >
          <input
            id="image"
            name="image"
            className="a-input"
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
        </Field>

        <Field
          name="images"
          label="More photos"
          error={err("images")}
          hint="Comma separated addresses, shown in the gallery."
        >
          <input id="images" name="images" className="a-input" defaultValue={values.images} />
        </Field>
      </div>

      <div
        className="a-tabpanel"
        role="tabpanel"
        id="panel-publishing"
        aria-labelledby="tab-publishing"
        hidden={tab !== "publishing"}
      >
        <div className="a-grid2">
          <Field name="status" label="Status" error={err("status")}>
            <select
              id="status"
              name="status"
              className="a-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as PlaceFormValues["status"])}
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
            hint="0–5. Replaced by the average once visitors review it."
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

        {/* The unit comes from the category — see lib/places/pricing.ts. A
            number with the wrong unit is worse than no number, because the
            reader believes it. */}
        {categoryHasPricing(categoryId) && (
          <Field
            name="priceFrom"
            label={priceFieldLabel(categoryId)}
            error={err("priceFrom")}
            hint="Whole francs."
          >
            <input
              id="priceFrom"
              name="priceFrom"
              className="a-input"
              defaultValue={values.priceFrom}
              inputMode="numeric"
            />
          </Field>
        )}

        <label className="a-check">
          <input type="checkbox" name="sensitive" defaultChecked={values.sensitive} />
          <span>
            <strong>Place of remembrance.</strong> Suppresses ratings, reviews, prices
            and promotion everywhere. Every memorial-category listing is already
            treated this way; tick it for one filed elsewhere.
          </span>
        </label>
      </div>

      <div className="a-formactions">
        <Link href="/admin/places" className="t-btn t-btn--ghost">
          Back to places
        </Link>
      </div>
    </form>
  );
}
