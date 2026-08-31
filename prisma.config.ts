// Prisma 7 evaluates this config before it reads .env, so load it ourselves —
// otherwise DIRECT_URL is undefined here even when it is set in .env.
import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 moved the connection URL out of schema.prisma. The schema now
 * declares only the provider; the URL lives here for the CLI, and the running
 * app gets its connection from the Neon adapter in lib/prisma.ts instead.
 *
 * Migrations use DIRECT_URL, not DATABASE_URL. Neon's pooled endpoint runs
 * PgBouncer in transaction mode, which cannot hold the session-level advisory
 * locks and prepared statements that `prisma migrate` needs. The app uses the
 * pooled endpoint; the CLI uses the direct one.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Read straight from process.env rather than Prisma's env() helper, which
    // throws on a missing variable at config-load time. That would break
    // `prisma generate` — which needs no database at all — and with it the
    // Vercel build's postinstall step. Commands that genuinely need a
    // connection still fail with a clear message when this is undefined.
    url: process.env.DIRECT_URL,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
