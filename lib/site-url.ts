import "server-only";
import { headers } from "next/headers";

/**
 * The absolute origin this request arrived on.
 *
 * A payment gateway needs somewhere to send the payer back to and somewhere to
 * post its webhook, and both have to be absolute. Deriving it from the request
 * rather than hardcoding it means the same code works on localhost, on a
 * Vercel preview and in production without a per-environment constant that
 * somebody will eventually forget to change.
 *
 * `PUBLIC_SITE_URL` overrides it, for the case the header cannot cover: a
 * webhook is delivered to whatever URL we handed over, and behind a proxy that
 * rewrites Host, the request's own view of itself can be wrong.
 */
export async function siteUrl(): Promise<string> {
  const override = process.env.PUBLIC_SITE_URL?.trim();
  if (override) return override.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
