import { NextResponse, type NextRequest } from "next/server";
import { signOut } from "@/auth";

/**
 * Sign out.
 *
 * A route handler rather than a server action because a raw
 * `<form action={serverAction}>` that touches cookies can lose the request
 * scope; this works without JavaScript either way. Four screens POST here —
 * the profile, settings, the admin sidebar and the admin login page.
 *
 * `redirectTo` is honoured only as a path on this site. Passing it to
 * `new URL(to, base)` is not enough on its own: an absolute URL overrides the
 * base entirely, which would make this an open redirect. A leading "//" is
 * rejected for the same reason — the browser reads it as protocol-relative.
 */
function safePath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const to = safePath(form?.get("redirectTo")?.toString());

  await signOut({ redirect: false });
  return NextResponse.redirect(new URL(to, request.url), 303);
}
