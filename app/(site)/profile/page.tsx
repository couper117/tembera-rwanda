import type { Metadata } from "next";
import ProfileScreen from "@/components/profile/ProfileScreen";
import { buildSearchIndex } from "@/lib/places/catalog";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your Tembera account, saved places and visit history.",
};

export default function ProfilePage() {
  // Saves and visits are stored as ids in the browser, so the screen needs the
  // index to resolve them back into places.
  return <ProfileScreen index={buildSearchIndex()} />;
}
