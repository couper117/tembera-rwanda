import type { Metadata } from "next";
import ProfileOverview from "@/components/profile/ProfileOverview";
import { buildSearchIndex } from "@/lib/data/places";
import { getCurrentUser } from "@/lib/auth";
import { getProfileOverview } from "@/lib/data/user";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your Tembera journey — places visited, districts explored and what you save.",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  // Saves and visits live in the browser for a guest, so the screen needs the
  // index to resolve ids back into places either way.
  const [index, user] = await Promise.all([buildSearchIndex(), getCurrentUser()]);

  // A guest gets null and the page falls back to what this browser knows.
  // Everything server-side — the photo, review history, save timestamps —
  // simply does not exist for them, and the screen says so rather than
  // inventing it.
  const server = user ? await getProfileOverview(user.id) : null;

  return (
    <ProfileOverview
      index={index}
      server={
        server && {
          image: server.image,
          interests: server.interests,
          reviews: server.reviews,
          saves: server.saves,
          visits: server.visits,
        }
      }
    />
  );
}
