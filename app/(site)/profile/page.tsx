import type { Metadata } from "next";
import ProfileScreen from "@/components/profile/ProfileScreen";
import { buildSearchIndex } from "@/lib/data/places";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your Tembera account, saved places and visit history.",
};

export default async function ProfilePage() {
  // Saves and visits are stored as ids in the browser, so the screen needs the
  // index to resolve them back into places.
  const index = await buildSearchIndex();
  return <ProfileScreen index={index} />;
}
