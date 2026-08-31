// Sample data for the admin screens.
//
// This build has no backend at all — no database, no sessions, no writes. Every
// admin screen therefore reads from here, and every write action validates its
// form and then stops (see lib/admin/readonly.ts). The screens themselves are
// finished and are what a real implementation drops in behind.
//
// Businesses signing up and submitting their own listings is the product this
// dashboard is being sold on, but none of it is in the schema: `Role` is still
// USER | ADMIN, `Place` has no owner and no approval state, and there is no
// audit trail. Rather than block the whole dashboard on a migration, these
// screens are built against the shapes those tables will take.
//
// Every type here is deliberately close to a future Prisma model, so wiring it
// up later is a matter of swapping the source, not rewriting the screens. Any
// screen reading this must render <SampleNotice> so the figures are never
// mistaken for live ones.

export type SubmissionStatus = "pending" | "approved" | "rejected";
export type BusinessStatus = "verified" | "unverified" | "suspended";

export interface Submission {
  id: string;
  /** The listing being proposed, in Place's shape. */
  placeName: string;
  categoryId: string;
  subcategory: string;
  city: string;
  description: string;
  phone: string;
  website: string;
  image: string;
  /** Who sent it. */
  businessId: string;
  businessName: string;
  submittedBy: string;
  submittedAt: string;
  status: SubmissionStatus;
  /** Set when an admin turns it down. */
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface Business {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  /** Rwanda Revenue Authority taxpayer id — what a real onboarding would ask. */
  tin: string;
  status: BusinessStatus;
  listings: number;
  pending: number;
  joinedAt: string;
}

export interface ActivityEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
  kind: "approve" | "reject" | "create" | "update" | "delete" | "signin";
}

export const SUBMISSIONS: Submission[] = [
  {
    id: "sub-1041",
    placeName: "Ubumwe Grande Hotel",
    categoryId: "stays",
    subcategory: "Hotels",
    city: "Gasabo",
    description:
      "Four-star hotel in Kimihurura with a rooftop restaurant, conference rooms and 84 en-suite rooms.",
    phone: "+250 788 301 442",
    website: "https://ubumwegrande.rw",
    image: "",
    businessId: "biz-204",
    businessName: "Ubumwe Hospitality Ltd",
    submittedBy: "Claudine Uwase",
    submittedAt: "2026-08-21T09:14:00Z",
    status: "pending",
  },
  {
    id: "sub-1040",
    placeName: "Kivu Sunset Lodge",
    categoryId: "stays",
    subcategory: "Lodges",
    city: "Rubavu",
    description:
      "Lakeside lodge with twelve cottages, a private beach and boat transfers to Napoleon Island.",
    phone: "+250 782 114 900",
    website: "https://kivusunset.rw",
    image: "",
    businessId: "biz-198",
    businessName: "Kivu Sunset Ltd",
    submittedBy: "Eric Habimana",
    submittedAt: "2026-08-20T15:02:00Z",
    status: "pending",
  },
  {
    id: "sub-1039",
    placeName: "Umucyo Craft Market",
    categoryId: "shopping",
    subcategory: "Markets",
    city: "Nyarugenge",
    description:
      "Cooperative market of 60 artisan stalls selling imigongo, basketry and woven textiles.",
    phone: "+250 788 655 210",
    website: "",
    image: "",
    businessId: "biz-211",
    businessName: "Umucyo Cooperative",
    submittedBy: "Alice Mukamana",
    submittedAt: "2026-08-20T11:40:00Z",
    status: "pending",
  },
  {
    id: "sub-1038",
    placeName: "Nyandungu Eco-Park Café",
    categoryId: "dining",
    subcategory: "Cafés",
    city: "Kicukiro",
    description: "Garden café inside the Nyandungu wetland reserve, open to day visitors.",
    phone: "+250 788 004 771",
    website: "",
    image: "",
    businessId: "biz-176",
    businessName: "Green Table Rwanda",
    submittedBy: "Jean-Paul Nsengimana",
    submittedAt: "2026-08-19T08:25:00Z",
    status: "pending",
  },
  {
    id: "sub-1036",
    placeName: "Musanze Caves Tours",
    categoryId: "wonders",
    subcategory: "Tourist Attractions",
    city: "Musanze",
    description: "Guided two-hour tours of the lava-tube caves, with equipment provided.",
    phone: "+250 783 220 118",
    website: "https://musanzecaves.rw",
    image: "",
    businessId: "biz-152",
    businessName: "Volcano Trails Ltd",
    submittedBy: "Diane Ingabire",
    submittedAt: "2026-08-18T14:10:00Z",
    status: "approved",
    reviewedBy: "Administrator",
    reviewedAt: "2026-08-18T16:30:00Z",
  },
  {
    id: "sub-1035",
    placeName: "Downtown Money Exchange",
    categoryId: "finance",
    subcategory: "Banks",
    city: "Nyarugenge",
    description: "Currency exchange counter.",
    phone: "+250 788 900 001",
    website: "",
    image: "",
    businessId: "biz-149",
    businessName: "Downtown Forex",
    submittedBy: "Samuel Rwema",
    submittedAt: "2026-08-17T10:05:00Z",
    status: "rejected",
    rejectionReason:
      "Could not verify a trading licence for this address, and the listing duplicates an existing entry.",
    reviewedBy: "Administrator",
    reviewedAt: "2026-08-17T13:20:00Z",
  },
];

export const BUSINESSES: Business[] = [
  {
    id: "biz-204",
    name: "Ubumwe Hospitality Ltd",
    contactName: "Claudine Uwase",
    email: "claudine@ubumwegrande.rw",
    phone: "+250 788 301 442",
    city: "Gasabo",
    tin: "102938471",
    status: "verified",
    listings: 3,
    pending: 1,
    joinedAt: "2026-03-11T00:00:00Z",
  },
  {
    id: "biz-198",
    name: "Kivu Sunset Ltd",
    contactName: "Eric Habimana",
    email: "eric@kivusunset.rw",
    phone: "+250 782 114 900",
    city: "Rubavu",
    tin: "100472913",
    status: "verified",
    listings: 2,
    pending: 1,
    joinedAt: "2026-02-02T00:00:00Z",
  },
  {
    id: "biz-211",
    name: "Umucyo Cooperative",
    contactName: "Alice Mukamana",
    email: "alice@umucyo.coop",
    phone: "+250 788 655 210",
    city: "Nyarugenge",
    tin: "108811204",
    status: "unverified",
    listings: 0,
    pending: 1,
    joinedAt: "2026-08-14T00:00:00Z",
  },
  {
    id: "biz-176",
    name: "Green Table Rwanda",
    contactName: "Jean-Paul Nsengimana",
    email: "jp@greentable.rw",
    phone: "+250 788 004 771",
    city: "Kicukiro",
    tin: "104120558",
    status: "verified",
    listings: 5,
    pending: 1,
    joinedAt: "2025-11-27T00:00:00Z",
  },
  {
    id: "biz-152",
    name: "Volcano Trails Ltd",
    contactName: "Diane Ingabire",
    email: "diane@volcanotrails.rw",
    phone: "+250 783 220 118",
    city: "Musanze",
    tin: "103998210",
    status: "verified",
    listings: 7,
    pending: 0,
    joinedAt: "2025-09-05T00:00:00Z",
  },
  {
    id: "biz-149",
    name: "Downtown Forex",
    contactName: "Samuel Rwema",
    email: "sam@downtownforex.rw",
    phone: "+250 788 900 001",
    city: "Nyarugenge",
    tin: "101220487",
    status: "suspended",
    listings: 0,
    pending: 0,
    joinedAt: "2025-08-19T00:00:00Z",
  },
];

export const ACTIVITY: ActivityEntry[] = [
  {
    id: "act-1",
    actor: "Administrator",
    action: "approved submission",
    target: "Musanze Caves Tours",
    at: "2026-08-18T16:30:00Z",
    kind: "approve",
  },
  {
    id: "act-2",
    actor: "Administrator",
    action: "rejected submission",
    target: "Downtown Money Exchange",
    at: "2026-08-17T13:20:00Z",
    kind: "reject",
  },
  {
    id: "act-3",
    actor: "Administrator",
    action: "verified business",
    target: "Kivu Sunset Ltd",
    at: "2026-08-16T09:12:00Z",
    kind: "update",
  },
  {
    id: "act-4",
    actor: "Administrator",
    action: "edited place",
    target: "BK Arena",
    at: "2026-08-15T17:48:00Z",
    kind: "update",
  },
  {
    id: "act-5",
    actor: "Administrator",
    action: "signed in",
    target: "admin@tembera.rw",
    at: "2026-08-15T08:02:00Z",
    kind: "signin",
  },
];

/* ------------------------------------------- accounts, bookings, feedback */

export interface AdminUser {
  id: number;
  email: string;
  handle: string;
  name: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  _count: { saves: number; visits: number };
}

export interface AdminBooking {
  id: number;
  experience: string;
  fullName: string;
  email: string;
  preferredAt: string;
  guests: number;
  totalPrice: number;
  createdAt: string;
  status: "pending" | "confirmed" | "cancelled";
}

export interface AdminReport {
  id: number;
  place: { id: string; name: string; city: string };
  kind: string;
  body: string;
  contact: string;
  createdAt: string;
  status: "open" | "resolved" | "dismissed";
}

export interface AdminReview {
  id: number;
  rating: number;
  body: string;
  createdAt: string;
  user: { name: string; handle: string };
  place: { id: string; name: string };
}

/**
 * The signed-in administrator the Users screen compares rows against, so the
 * "that's you" marker and the self-demote/self-delete guards still render.
 */
export const CURRENT_ADMIN: AdminUser = {
  id: 1,
  email: "admin@tembera.rw",
  handle: "admin",
  name: "Administrator",
  role: "ADMIN",
  createdAt: "2025-08-19T00:00:00Z",
  _count: { saves: 0, visits: 0 },
};

export const USERS: AdminUser[] = [
  CURRENT_ADMIN,
  {
    id: 7,
    email: "claudine.uwase@example.rw",
    handle: "claudine",
    name: "Claudine Uwase",
    role: "USER",
    createdAt: "2026-07-02T00:00:00Z",
    _count: { saves: 14, visits: 6 },
  },
  {
    id: 11,
    email: "eric.habimana@example.rw",
    handle: "erich",
    name: "Eric Habimana",
    role: "USER",
    createdAt: "2026-06-18T00:00:00Z",
    _count: { saves: 9, visits: 12 },
  },
  {
    id: 14,
    email: "diane.ingabire@example.rw",
    handle: "dianei",
    name: "Diane Ingabire",
    role: "ADMIN",
    createdAt: "2026-05-30T00:00:00Z",
    _count: { saves: 3, visits: 21 },
  },
  {
    id: 22,
    email: "samuel.rwema@example.rw",
    handle: "srwema",
    name: "Samuel Rwema",
    role: "USER",
    createdAt: "2026-08-09T00:00:00Z",
    _count: { saves: 1, visits: 0 },
  },
];

export const BOOKINGS: AdminBooking[] = [
  {
    id: 3182,
    experience: "Gorilla trekking — Volcanoes National Park",
    fullName: "Claudine Uwase",
    email: "claudine.uwase@example.rw",
    preferredAt: "2026-09-14T00:00:00Z",
    guests: 2,
    totalPrice: 3000,
    createdAt: "2026-08-24T10:12:00Z",
    status: "pending",
  },
  {
    id: 3181,
    experience: "Lake Kivu boat tour — Rubavu",
    fullName: "Eric Habimana",
    email: "eric.habimana@example.rw",
    preferredAt: "2026-09-05T00:00:00Z",
    guests: 4,
    totalPrice: 240,
    createdAt: "2026-08-23T16:44:00Z",
    status: "pending",
  },
  {
    id: 3179,
    experience: "Kigali city and memorial tour",
    fullName: "Samuel Rwema",
    email: "samuel.rwema@example.rw",
    preferredAt: "2026-08-30T00:00:00Z",
    guests: 1,
    totalPrice: 60,
    createdAt: "2026-08-21T09:03:00Z",
    status: "confirmed",
  },
  {
    id: 3174,
    experience: "Nyungwe canopy walk",
    fullName: "Diane Ingabire",
    email: "diane.ingabire@example.rw",
    preferredAt: "2026-08-28T00:00:00Z",
    guests: 3,
    totalPrice: 180,
    createdAt: "2026-08-19T13:20:00Z",
    status: "cancelled",
  },
];

export const REPORTS: AdminReport[] = [
  {
    id: 412,
    place: { id: "dining-repub-lounge", name: "Repub Lounge", city: "Kigali" },
    kind: "details",
    body: "The phone number rings out — they moved to a new line last month.",
    contact: "eric.habimana@example.rw",
    createdAt: "2026-08-25T07:51:00Z",
    status: "open",
  },
  {
    id: 409,
    place: { id: "shopping-kimironko-market", name: "Kimironko Market", city: "Gasabo" },
    kind: "details",
    body: "Opening hours are wrong on Sundays — the market closes at 4pm, not 6pm.",
    contact: "",
    createdAt: "2026-08-22T18:30:00Z",
    status: "open",
  },
  {
    id: 404,
    place: { id: "dining-poivre-noir", name: "Poivre Noir", city: "Kigali" },
    kind: "closed",
    body: "This restaurant has permanently closed. The building is empty.",
    contact: "claudine.uwase@example.rw",
    createdAt: "2026-08-14T11:07:00Z",
    status: "resolved",
  },
];

export const REVIEWS: AdminReview[] = [
  {
    id: 901,
    rating: 5,
    body: "Worth every franc. The guides were patient and the trek was unforgettable.",
    createdAt: "2026-08-24T19:22:00Z",
    user: { name: "Claudine Uwase", handle: "claudine" },
    place: { id: "wonders-volcanoes-national-park", name: "Volcanoes National Park" },
  },
  {
    id: 898,
    rating: 4,
    body: "Beautiful lake and very calm. Boat prices are negotiable, so ask around.",
    createdAt: "2026-08-22T08:40:00Z",
    user: { name: "Eric Habimana", handle: "erich" },
    place: { id: "wonders-lake-kivu", name: "Lake Kivu" },
  },
  {
    id: 894,
    rating: 2,
    body: "Slow service and half the menu was unavailable on a Friday evening.",
    createdAt: "2026-08-20T21:05:00Z",
    user: { name: "Samuel Rwema", handle: "srwema" },
    place: { id: "dining-repub-lounge", name: "Repub Lounge" },
  },
  {
    id: 890,
    rating: 5,
    body: "",
    createdAt: "2026-08-17T12:00:00Z",
    user: { name: "Diane Ingabire", handle: "dianei" },
    place: { id: "shopping-kimironko-market", name: "Kimironko Market" },
  },
];

/** Submissions per week, oldest first — the dashboard's trend line. */
export const SUBMISSION_TREND = [4, 6, 5, 9, 7, 12, 10, 14];

export const PENDING_SUBMISSIONS = SUBMISSIONS.filter((s) => s.status === "pending").length;

export function submissionById(id: string): Submission | undefined {
  return SUBMISSIONS.find((s) => s.id === id);
}

export function businessById(id: string): Business | undefined {
  return BUSINESSES.find((b) => b.id === id);
}

/** "20 Aug 2026" — one date format across every admin screen. */
export function adminDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
