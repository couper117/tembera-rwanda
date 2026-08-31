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
 * Nothing in the app charges anybody. A plan is what a business *asks* for on
 * the claim form; money is a conversation we have with them afterwards.
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
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    rwf: 0,
    usd: 0,
    tagline: "You are already listed. Nothing to pay.",
  },
  {
    id: "checked",
    name: "Checked",
    rwf: 15_000,
    usd: 12,
    tagline: "Take control of your own listing and prove it is current.",
    featured: true,
  },
  {
    id: "top",
    name: "Top",
    rwf: 45_000,
    usd: 35,
    tagline: "Everything in Checked, and you surface in Recommended.",
  },
];

/** One row of the comparison table: a promise, and which plans keep it. */
export interface PlanFeature {
  label: string;
  free: boolean;
  checked: boolean;
  top: boolean;
}

export const PLAN_FEATURES: PlanFeature[] = [
  { label: "Your place is in the app", free: true, checked: true, top: true },
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
