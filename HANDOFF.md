# HANDOFF

## Current Task
Rebuilding the backend on Neon Postgres, on branch `backend-rebuild`. Ten
phases; see `~/.claude/plans/good-now-that-we-virtual-locket.md` for the full
plan. Phases 0–2 are done.

## Status
**In progress — Phase 3 (Auth.js v5) is next.**

The catalog is live in Neon and the whole public site reads it. No screen was
changed to get there: `lib/data/*` kept its signatures, which is what that seam
was built for.

**⚠ `/admin` is still completely unauthenticated.** The guard came out with the
sessions and goes back in Phase 3, in `app/admin/(dash)/layout.tsx`. Do not
deploy before that lands.

## Progress
- [x] **Phase 0** — Neon linked (project `soft-butterfly-15369979`, `dev` +
      `production` branches). Bookings and experiences deleted entirely.
- [x] **Phase 1** — Schema, Prisma 7 + Neon WS adapter, one-way seed.
      495 places, 16 categories, 71 subcategories, 30 districts.
- [x] **Phase 2** — `lib/data/*` reads Postgres. `catalog.ts` is seed-only.
- [ ] **Phase 3** — Auth.js v5, four roles, close the admin door, rewrite the
      legal pages.
- [ ] Phases 4–9 — public writes, admin CMS writes, business dashboard, the
      richer place page, email, analytics and data quality.

## Working Notes

### Where things stand
- `.env` points at the **dev** Neon branch, which holds the whole catalog.
  The **production branch is still completely empty — no tables at all.** The
  dev branch was created before the first migration ran, so nothing has ever
  been applied to production. It gets `prisma migrate deploy` + seed only once
  the rebuild is proven out on dev.
- Connection strings: `DATABASE_URL` is the pooled host, `DIRECT_URL` the
  direct one. Migrations cannot run through Neon's pooler.
- Nothing is pushed. Four commits sit on `backend-rebuild`; `static-fallback`
  holds the pre-rebuild static state.

### Traps found the hard way
- **The `prisma` CLI publishes an RC to its `latest` tag.** A plain
  `npm install prisma` gives 8.0.0-rc.12 against a stable 7.10.0 client — a
  mismatched major pair. All three Prisma packages are pinned to 7.10.0.
- **Prisma 7 moved the datasource URL out of the schema.** It lives in
  `prisma.config.ts`, which reads `process.env.DIRECT_URL` directly rather than
  Prisma's `env()` helper — that helper throws on a missing variable, which
  would break `prisma generate` (needs no database) and with it Vercel's
  `postinstall`.
- **Prisma 7 evaluates `prisma.config.ts` before reading `.env`,** and `tsx`
  never reads it. Both the config and the seed load `dotenv` explicitly.
- **`unstable_cache` survives server restarts** via `.next/cache`. Changing a
  row directly in the database looks like it did nothing. Admin actions call
  `revalidateTag`; this only bites when poking the DB by hand.
- A script run from outside the project root cannot resolve `node_modules`.

### Invariants, and how they are verified
1. **`lib/data/*` is the seam.** Rebuild behind the signatures. If a screen has
   to change, the seam was used wrong.
2. **Sensitive categories never show ratings, prices, reviews or promotion.**
   Stripped at source in `getPlaces()`. Verified empirically, not assumed:
   `/c/memorials` renders 0 occurrences of `t-rating` while `/c/dining` renders
   10, and a memorial detail page has no rating and no reviews section.
   Phase 4 must add the matching guard on the **write** side — nothing
   currently stops a review being written against a memorial.
3. **Place ids are one-way.** Derived from source array order in
   `catalog.ts#assignIds`, and also public URLs and foreign keys.
   `prisma/seed-ids.json` freezes all 495; the seed refuses to run against a
   catalog that no longer matches, and `npm run verify-seed` checks the same
   thing from the database side — including the case that actually matters, an
   id that now points at a *different* place.
4. **The pure domain layer stays pure.** `lib/places/{engine,search,geo}.ts`
   import nothing from `lib/data`. 112 tests, still passing, no DB dependency.

### Notes on what was built
- `getPlaces()` filters to `status=published`. `getAllPlaces()`,
  `getAnyPlace()` and `countByCategoryAllStatuses()` are uncached staff-only
  reads so admin sees drafts and its own edits at once. **Staff reads do not
  strip sensitive fields** — an editor must be able to correct a stored value —
  so they must never feed a public screen.
- One hot query: `getPlaces()` pulls all 495 rows, cached by tag; every list,
  count, summary and ranking is then computed in-process by the pure engine.
  Do not split this into per-screen SQL.
- The seed writes `website`, `images` and `sensitive`, which the original
  dropped — though the static catalog carries no values for the first two, so
  that fix is correct rather than recovering anything.
- `/c/[category]` and `/city/[city]` stay `force-dynamic`. Prerendering them
  via `generateStaticParams` is what broke the Vercel build.

### Open items carried forward
- **The Google Maps API key is still in git history and must be revoked** in
  the Google Cloud console. Long-standing, still not done.
- `lib/rwanda/calendar.ts` and `events.ts` still both derive Umuganda, the
  fixed holidays and "today in Kigali", and export two different
  `daysBetween`. Collapsing them is Phase 9.
- Places have no owner yet: `Place.businessId` exists as a bare nullable
  column; its relation lands with the `Business` model in Phase 6.

## Recently Completed
- Catalog reads from Postgres; `catalog.ts` demoted to seed-only input.
- Schema, Neon client and the guarded one-way seed; 495 ids frozen.
- Bookings and experiences removed from the product entirely.
- Backend stripped to a static build (preserved on `static-fallback`).
