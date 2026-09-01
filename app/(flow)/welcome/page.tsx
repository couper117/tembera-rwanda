import type { Metadata } from "next";
import { redirect } from "next/navigation";
import WelcomeScreen from "@/components/profile/WelcomeScreen";
import { ThemeProvider } from "@/lib/client/theme";
import { getCurrentUser } from "@/lib/auth";
import { getProfileOverview } from "@/lib/data/user";
import { cleanInterests } from "@/lib/profile/interests";

export const metadata: Metadata = { title: "Welcome to Tembera" };
export const dynamic = "force-dynamic";

/**
 * Onboarding, immediately after sign-up.
 *
 * Three questions, all of which change what the app does: what you are here
 * for, where you are based, and how you want distances. Nothing is asked that
 * is not used — an onboarding that collects a fact nobody reads is a toll
 * booth on the way in.
 */
export default async function WelcomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const overview = await getProfileOverview(user.id);
  // Outside the (site) layout on purpose: no desktop rail, no tab bar. Every
  // navigation control on screen is an invitation to leave an onboarding
  // half-finished, and there is a "Skip for now" for people who want that.
  return (
    <ThemeProvider>
      <WelcomeScreen
        name={user.name}
        handle={user.handle}
        email={user.email}
        bio={user.bio}
        homeCity={user.homeCity}
        initialInterests={cleanInterests(overview.interests)}
      />
    </ThemeProvider>
  );
}
