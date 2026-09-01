import type { Metadata } from "next";
import { ThemeProvider } from "@/lib/client/theme";
import RegisterFlow from "@/components/business/RegisterFlow";
import { getCities } from "@/lib/data/cities";
import { payTo } from "@/lib/business/payments";
import "../../../admin/admin.css";

export const metadata: Metadata = {
  title: "Register your business",
  description:
    "Take charge of your listing on Tembera: fix your own hours and photos, reply to reviews, and get the verified tick.",
};

export const dynamic = "force-dynamic";

/**
 * Sign-up lives outside the site chrome on purpose.
 *
 * It sits in the (business) route group rather than (site), so it gets neither
 * the desktop rail nor the bottom tab bar. Those are for browsing a catalogue;
 * this is a funnel, and every tab on screen is an invitation to leave it
 * half-finished. The auth screens make the same choice for the same reason.
 *
 * It pulls in the admin stylesheet for its form controls: the public site has
 * no form of this size, and duplicating the inputs so a marketing page could
 * own them would leave two sets to keep in step.
 */
export default async function RegisterBusinessPage() {
  const cities = await getCities();

  return (
    <ThemeProvider>
      <RegisterFlow cities={cities.map((c) => c.name)} payTo={payTo()} />
    </ThemeProvider>
  );
}
