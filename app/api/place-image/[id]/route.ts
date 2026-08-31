import { NextResponse } from "next/server";
import { getPlaceImageData } from "@/lib/data/places";

/**
 * Serves the photos that the legacy data carried as inline `data:` URIs.
 *
 * Keeping them inline meant every page that listed churches or playgrounds
 * shipped hundreds of kilobytes of base64 in its HTML. Here they become
 * ordinary, cacheable image responses instead.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const dataUri = await getPlaceImageData(id);
  if (!dataUri) {
    return new NextResponse("No inline image for this place", { status: 404 });
  }

  const match = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUri);
  if (!match) {
    return new NextResponse("Malformed image data", { status: 500 });
  }

  const [, mime, base64Flag, payload] = match;
  const body = base64Flag
    ? Buffer.from(payload, "base64")
    : Buffer.from(decodeURIComponent(payload), "utf8");

  return new NextResponse(body, {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(body.byteLength),
      // The catalog is static, so these can be cached hard.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
