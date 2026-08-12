import { NextResponse } from "next/server";
import { nearest } from "@/lib/places/catalog";

/**
 * Nearest places to a point.
 *
 * The home screen renders a default (city-centre) version on the server, then
 * calls this once the user actually shares their location. That keeps the
 * initial payload small — the alternative is shipping the whole catalog to
 * every visitor just in case they grant permission.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const limit = Math.min(Number(searchParams.get("limit")) || 12, 50);
  const categoryId = searchParams.get("category") ?? undefined;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "lat and lng are required numbers" },
      { status: 400 },
    );
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "coordinates out of range" }, { status: 400 });
  }

  const places = nearest({ lat, lng }, { limit, categoryId }).map((place) => ({
    id: place.id,
    name: place.name,
    categoryId: place.categoryId,
    subtype: place.subtype,
    city: place.city,
    area: place.area,
    lat: place.lat,
    lng: place.lng,
    coordsPrecision: place.coordsPrecision,
    rating: place.rating,
    image: place.image,
  }));

  return NextResponse.json({ places });
}
