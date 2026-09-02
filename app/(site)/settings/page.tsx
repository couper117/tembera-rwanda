import type { Metadata } from "next";
import SettingsScreen from "@/components/profile/SettingsScreen";
import { getCurrentUser } from "@/lib/auth";
import { getProfileOverview } from "@/lib/data/user";
import { DEFAULT_PREFERENCES, parsePreferences } from "@/lib/profile/preferences";

export const metadata: Metadata = {
  title: "Settings",
  description: "Your account, language, location and the data Tembera keeps.",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const overview = user ? await getProfileOverview(user.id) : null;

  return (
    <SettingsScreen
      initialPreferences={
        overview ? parsePreferences(overview.preferences) : DEFAULT_PREFERENCES
      }
    />
  );
}
