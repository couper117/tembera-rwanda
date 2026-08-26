// The kinds of problem someone can report about a listing.
//
// Kept out of lib/actions/report.ts because a "use server" module may only
// export async functions — exporting this array from there breaks the client
// component that imports it, silently, at runtime rather than at build time.
export const REPORT_KINDS = [
  { value: "closed", label: "This place has closed" },
  { value: "details", label: "Phone, hours or name is wrong" },
  { value: "location", label: "The location is wrong" },
  { value: "photo", label: "There's a problem with the photo" },
  { value: "other", label: "Something else" },
] as const;

export const REPORT_KIND_VALUES = REPORT_KINDS.map((k) => k.value) as [
  string,
  ...string[],
];

/** Admin-facing short labels, for the reports table. */
export const REPORT_KIND_LABEL: Record<string, string> = {
  closed: "Has closed",
  details: "Wrong details",
  location: "Wrong location",
  photo: "Photo problem",
  other: "Other",
};
