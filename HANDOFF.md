# HANDOFF

## Current Task
Remove the backend entirely so the site deploys to Vercel as a static,
browse-only build with no database to provision. Keep all UI — including the
full admin dashboard — intact for a backend to be written later.

## Status
**Done.** The app builds, runs and deploys with no `DATABASE_URL`, no
`.env` at all, and no Postgres anywhere.

Verified:
- `tsc --noEmit` clean; `next lint` clean; **112 unit tests pass**
- `next build` passes from a clean `.next`, with no environment variables
- All **35 routes return 200** on `next start`, `/c/nope`, `/place/nope` and
  `/admin/places/nope` return **404**, and the server log is error-free
- Runtime dependencies are now just `next`, `react`, `react-dom`, `zod`

## Progress
- [x] Data layer (`lib/data/*`) rewritten over the static catalog, same async
      signatures — no screen changed
- [x] Prisma, bcryptjs, sessions, rate limiting and `prisma/` deleted
- [x] Every server action made inert: validates, then declines to write
- [x] Admin dashboard repointed at the static catalog + sample rows
- [x] README, `.env.example`, CI, privacy policy and terms corrected
- [ ] **`/admin` is unauthenticated.** Close it before any real deployment

## Working Notes

### The shape of the change
The catalog was always static — `lib/places/sources/*` + `catalog.ts` built the
dataset that the Prisma seed had loaded into Postgres. So removing the backend
meant pointing `lib/data/*` back at the catalog rather than at the database.

`lib/data/*` functions stay `async` and keep their exact signatures. That is
deliberate: every screen already awaits them, so restoring a real backend is a
matter of replacing four function bodies, not editing the UI.

### Where the seams are, for putting a backend back
1. `lib/data/{places,categories,cities,calendar,user}.ts` — replace bodies.
2. `lib/auth.ts` — a stub whose `getCurrentUser()` always returns null. Its
   `User` interface is already the shape `app/(site)/layout.tsx` consumes.
3. `lib/actions/*` and `app/**/actions.ts` — bodies return
   `READ_ONLY_MESSAGE` (`lib/admin/readonly.ts`) or "Not signed in.". Forms,
   zod schemas, error styling and pending states are all still wired.
4. **`app/admin/(dash)/layout.tsx`** — the `requireAdmin()` guard was removed
   from here. One line in one place re-closes the whole dashboard.

### Decisions made
- **Account screens kept as inert UI**, per instruction. They render and
  validate, then say plainly that nothing was sent. Never a fake success — a
  booking confirmation for a discarded request would be worse than an error.
- **Admin backend-only screens use hardcoded sample rows**, per instruction,
  extending the `lib/admin/placeholder.ts` convention that already existed for
  submissions/businesses/activity. Every such screen renders `<SampleNotice>`.
- **Saved and visited still work** — they were always localStorage-first
  (`lib/client/saved.tsx`, `visited.tsx`); the server actions were only the
  "also sync to the account" half, called with `void` and ignored. They are now
  no-ops, which is what those call sites already assumed.
- **`/api/nearby` and `/api/place-image/[id]` were kept.** Neither touches a
  database — the image route now reads `inlineImage()` from the catalog, which
  is where the catalog's own image URLs already point.
- **Privacy policy and terms were rewritten.** They claimed bcrypt hashing,
  30-day session cookies, account deletion and seven-year booking retention —
  all false now, and the privacy page is written against Law N° 058/2021, so
  leaving it stale was not an option.
- **Deleted three untracked leftovers**: `app/admin/{page.tsx,AdminShell.tsx,
  admin.module.css}`. They were the pre-merge admin, superseded by
  `components/admin/AdminShell.tsx` + the `(dash)` group, and `page.tsx`
  collided with `(dash)/page.tsx` on `/admin`.
- Also removed: the `_*.ts` scratch scripts, `scripts/` (all DB-dependent), and
  `tests/{rate-limit,session-token}.test.ts` (their modules are gone).
- **`/logout` was kept**, as an inert redirect. Four screens still POST to it
  (profile, settings, admin sidebar, admin login), so deleting it would have
  405'd those buttons. Its `redirectTo` field is now restricted to a path on
  this site — the original passed it straight to `new URL(to, base)`, where an
  absolute URL overrides the base, which was an open redirect.

### Open items
- **`/admin` has no auth.** It exposes only sample data and the public catalog
  and can change nothing, but it is publicly reachable. This is the single most
  important thing to fix when the backend lands.
- **The Google Maps API key is still in git history and must be revoked in the
  Google Cloud console.** Carried over from before — still not done.
- `lib/rwanda/calendar.ts` and `lib/rwanda/events.ts` still both derive
  Umuganda and the public holidays. Worth collapsing onto one.
- Admin "add a calendar date" can never show a result — there is nowhere to
  store one, so that list is permanently empty. It is behind a `<SampleNotice>`.

### Architecture traps worth knowing
- **Never import `lib/places/catalog` from a client component** — it reaches
  the raw datasets and would ship them to the browser. Pass
  `buildSearchIndex()` down as props.
- `lib/places/taxonomy.ts` is the source of truth for categories; the legacy
  redirect map in `next.config.mjs` hardcodes group ids, so a stale id silently
  404s old links.
- `/c/[category]` and `/city/[city]` are `force-dynamic`. They previously
  prerendered via `generateStaticParams`, which is what broke the Vercel build.
  Do not reintroduce that: `notFound()` already returns a real 404.

## Recently Completed
- Backend removed: no database, no accounts, no sessions; static catalog only.
- Vercel build fixed: `/c/[category]` and `/city/[city]` no longer query at
  build time.
- Review text required (10–1000 chars) from one shared schema.
- Admin dashboard rebuilt on a shared shell, `(dash)` route group, plain CSS.
- Turn-by-turn navigation at `/navigate/[id]` via OSRM.
- Real licensed photos for the parks, lakes, museums and district cards.
