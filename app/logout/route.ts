import { NextResponse, type NextRequest } from "next/server";

/**
 * Sign out, with the backend removed.
 *
 * Nobody can be signed in — there is no session cookie to clear — but four
 * screens still POST here (the profile, settings, the admin sidebar and the
 * admin login page), so the route has to exist or those buttons 405.
 *
 * `redirectTo` is honoured only as a path on this site. Passing it to
 * `new URL(to, base)` is not enough on its own: an absolute URL overrides the
 * base entirely, which turns this into an open redirect. A leading "//" is
 * rejected for the same reason — the browser reads it as protocol-relative.
 */
function safePath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const to = safePath(form?.get("redirectTo")?.toString());
  return NextResponse.redirect(new URL(to, request.url), 303);
}
