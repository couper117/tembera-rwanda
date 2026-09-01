import { NextResponse } from "next/server";
import { getPlaces } from "@/lib/data/places";

/**
 * Name, city and photo for a handful of place ids.
 *
 * The header's saved-places dropdown knows the ids — they live in the browser
 * for a guest and in the session for an account — but nothing about the places
 * themselves. The alternative is handing the whole catalog to every visitor
 * through a context just in case they open one menu, which is ~494 rows of
 * payload for a list of six.
 *
 * Read-only and public: everything returned is already on the place page.
 */
const MAX_IDS = 40;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const ids = (searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, MAX_IDS);

  if (ids.length === 0) return NextResponse.json({ places: [] });

  const wanted = new Set(ids);
  const byId = new Map(
    (await getPlaces()).filter((p) => wanted.has(p.id)).map((p) => [p.id, p]),
  );

  // Answer in the order asked for — the caller's order is the saved order,
  // and re-sorting it here would silently shuffle the menu.
  const places = ids
    .map((id) => byId.get(id))
    .filter((p) => p !== undefined)
    .map((place) => ({
      id: place.id,
      name: place.name,
      categoryId: place.categoryId,
      subtype: place.subtype,
      city: place.city,
      image: place.image,
    }));

  return NextResponse.json({ places });
}
