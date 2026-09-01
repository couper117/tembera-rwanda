import { permanentRedirect } from "next/navigation";

/**
 * The plan comparison is step 2 of the sign-up flow now — the moment somebody
 * actually needs it, with the plan they pick carried straight into the form.
 * A standalone pricing table was one more page to leave from.
 */
export default function PricingPage() {
  permanentRedirect("/business/register");
}
