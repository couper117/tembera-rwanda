import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

/**
 * One PrismaClient, talking to Neon over its serverless driver.
 *
 * The WebSocket adapter is chosen over the HTTP one deliberately. HTTP is
 * faster for a single round trip, but it cannot do interactive transactions —
 * and approving a business submission is exactly that: create the place,
 * assign its owner, close the submission and write the audit row, all or
 * nothing. Picking WS now avoids swapping drivers later.
 *
 * DATABASE_URL points at Neon's pooled endpoint. The direct endpoint is
 * DIRECT_URL and is only used by the CLI for migrations — see prisma.config.ts.
 */

// NOTE: the Neon WebSocket connection drops occasionally under repeated load,
// surfacing as a bare `prisma:error undefined` and an opaque
// `[object ErrorEvent]` — which says nothing about the database and reads like
// an application bug. Setting neonConfig.webSocketConstructor = ws is the
// documented Node fix, but importing `ws` here broke the production build
// ("Cannot find module for page"), so it is left for a focused change rather
// than bundled into a UI commit. Node 24 supplies a global WebSocket, which is
// why it works at all.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and fill in the Neon connection strings.",
  );
}

// Reuse a single client across hot-reloads in dev to avoid exhausting the
// connection pool. On Vercel this also keeps one client per warm lambda.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
