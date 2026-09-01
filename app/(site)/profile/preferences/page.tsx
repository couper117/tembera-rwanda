import type { Metadata } from "next";
import PreferencesScreen from "@/components/profile/PreferencesScreen";
import { getCurrentUser } from "@/lib/auth";
import { getProfileOverview } from "@/lib/data/user";
import { cleanInterests } from "@/lib/profile/interests";
import { DEFAULT_PREFERENCES, parsePreferences } from "@/lib/profile/preferences";

export const metadata: Metadata = { title: "Preferences" };
export const dynamic = "force-dynamic";

export default async function PreferencesPage() {
  const user = await getCurrentUser();
  const overview = user ? await getProfileOverview(user.id) : null;

  return (
    <PreferencesScreen
      initial={overview ? parsePreferences(overview.preferences) : DEFAULT_PREFERENCES}
      initialInterests={cleanInterests(overview?.interests)}
    />
  );
}
