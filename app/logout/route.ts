import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

// Logout as a route handler rather than a server action: a raw
// `<form action={serverAction}>` that calls cookies() can lose the request
// scope under Next 15.1, so we clear the session cookie directly on the
// redirect response here, which is bulletproof and works without JS.
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const to = form?.get("redirectTo")?.toString() || "/";
  const res = NextResponse.redirect(new URL(to, request.url), 303);
  res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
