import type { Metadata } from "next";
import ProfileEditScreen from "@/components/profile/ProfileEditScreen";
import { getCurrentUser } from "@/lib/auth";
import { getProfileOverview } from "@/lib/data/user";

export const metadata: Metadata = { title: "Edit profile" };
export const dynamic = "force-dynamic";

export default async function ProfileEditPage() {
  const user = await getCurrentUser();
  const overview = user ? await getProfileOverview(user.id) : null;
  return <ProfileEditScreen initialImage={overview?.image ?? null} />;
}
