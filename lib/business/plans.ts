/**
 * What a business pays, and what it gets for paying.
 *
 * The single source of truth for both `/business` and `/business/pricing`, so
 * the two screens can never drift apart. The deck quotes the same numbers.
 *
 * These prices are a first draft and are not approved yet. Changing them is
 * meant to be a one-line edit here — that is the whole reason this file exists
 * rather than the numbers being typed into two pages.
 *
 * A paid plan is not granted by choosing it. Picking "Top" from a dropdown
 * used to create a live account carrying the tick and the Recommended slot,
 * which is the entire product given away to anyone who can type. Checked and
 * Top now hold a BusinessRegistration until the money arrives — see
 * lib/business/payments.ts and registerBusinessAction.
 */

export type PlanId = "free" | "checked" | "top";

export interface Plan {
  id: PlanId;
  name: string;
  /** Rwandan francs per month. Francs lead — this is a Rwandan product. */
  rwf: number;
  /** Rounded US dollars per month, shown alongside for visitors. */
  usd: number;
  /** One line on who the plan is for. */
  tagline: string;
  /** Marks the plan we steer businesses towards. */
  featured?: boolean;
  /**
   * Carries the verified tick. The tick is a claim Tembera makes to visitors
   * about a listing being current and its owner being who they say they are —
   * so it is only ever issued after somebody has both paid and been checked.
   */
  verifiedTick: boolean;
  /** What this plan lets an owner actually do, in their words. */
  perks: string[];
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    rwf: 0,
    usd: 0,
    tagline: "You are already listed. Nothing to pay.",
    verifiedTick: false,
    perks: [
      "Your place stays in the app, where visitors already find it",
      "Report anything wrong and we will fix it",
      "See your listing the way visitors see it",
    ],
  },
  {
    id: "checked",
    name: "Checked",
    rwf: 15_000,
    usd: 12,
    tagline: "Take control of your own listing and prove it is current.",
    featured: true,
    verifiedTick: true,
    perks: [
      "The blue verified tick on your listing",
      "Edit your own hours, phone, photos and description",
      "A last-checked date visitors can see",
      "See how many people looked at your place",
      "Reply to reviews",
    ],
  },
  {
    id: "top",
    name: "Top",
    rwf: 45_000,
    usd: 35,
    tagline: "Everything in Checked, and you surface in Recommended.",
    verifiedTick: true,
    perks: [
      "Everything in Checked",
      "You appear in Recommended, marked as sponsored",
      "Priority when we review your changes",
      "More photos on your listing",
    ],
  },
];

/** The plans money is owed for. Free never touches the payment flow. */
export function isPaidPlan(id: string): boolean {
  const plan = planById(id);
  return plan !== undefined && plan.rwf > 0;
}

/** One row of the comparison table: a promise, and which plans keep it. */
export interface PlanFeature {
  label: string;
  free: boolean;
  checked: boolean;
  top: boolean;
}

export const PLAN_FEATURES: PlanFeature[] = [
  { label: "Your place is in the app", free: true, checked: true, top: true },
  { label: "The verified tick", free: false, checked: true, top: true },
  { label: "You can fix your own details", free: false, checked: true, top: true },
  { label: "Badge and a last checked date", free: false, checked: true, top: true },
  { label: "You see how many people looked", free: false, checked: true, top: true },
  { label: "You come up in Recommended", free: false, checked: false, top: true },
];

/** Francs, grouped the way they are read locally: "RWF 15,000". */
export function formatRwf(amount: number): string {
  return `RWF ${amount.toLocaleString("en-US")}`;
}

/** The dollar line under the francs. Free has no second price to show. */
export function formatUsd(amount: number): string {
  return amount === 0 ? "" : `about $${amount}`;
}

export const PLAN_IDS = PLANS.map((p) => p.id) as [PlanId, ...PlanId[]];

export function planById(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}
