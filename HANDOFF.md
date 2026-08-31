# HANDOFF

## Current Task
Integrate the local v2 work (admin rebuild, navigation, photos, review
validation, site shell) with the 18 commits already on `origin/main`
(auth hardening, data protection, reports, the Rwandan calendar, tests + CI),
and push to `main`.

## Status
Merged and pushed. The two branches had diverged from `Tembera v2` and both
sides had independently built a "sensitive places" concept and a Rwandan
calendar, so the merge needed real resolution rather than a fast-forward.

Verified: `tsc --noEmit` clean, `next lint` clean, **136 unit tests pass**,
no route collisions, and `next build` **compiles and passes type/lint
validation**.

**⚠ Run `npm run db:push` before starting the app.** The build stops at page
data collection on this machine because the local Postgres predates the merged
schema (`categories.sensitive` is missing, along with `users.token_version`,
`places.website/images/sensitive`, and the `calendar_dates` and `reports`
tables). This is local DB state, not a code defect — CI runs `db:push` before
its build. Two dev servers were live on :3000 and :3001 throughout, so the
verification build was written to a throwaway `distDir` rather than `.next`.

## Progress
- [x] Local work committed as 6 focused commits, then merged with `origin/main`
- [x] `/admin/reports` and `/admin/calendar` moved into the `(dash)` route
      group and rewritten off the deleted CSS module onto `admin.css` — as
      merged they imported an `AdminShell` and a stylesheet that no longer
      exist, and would not have built
- [x] One definition of "sensitive" on the place page (see Working Notes)
- [x] The two colliding `lib/data/calendar.ts` files separated
- [x] `.a-error` / `.a-success` were referenced by three admin forms but never
      defined in `admin.css` — added, with `role="alert"` / `role="status"`
- [ ] Not done: the app has not been exercised in a browser since the merge —
      it cannot start until the schema is pushed

## Working Notes

### Decisions made in the merge
- **"Sensitive" had two implementations.** `origin/main` put a `sensitive` flag
  on `Category`; the local branch put one on `Place` and OR'd it with
  `categoryId === "memorials"`. Both are kept and OR'd together on the place
  page — the category flag covers a whole class, the place flag covers a
  memorial seeded under another category (Campaign Against Genocide sits in
  "arts"), and the id is the backstop for rows predating both.
- **Reviews on a sensitive place are hidden outright**, not replaced with a
  notice. `origin/main`'s remembrance block already says Tembera does not
  review memorial sites; a second notice said it twice on one page.
  "Things to do" is suppressed there too, for the reason its highlights were.
- **Two files were both named `lib/data/calendar.ts`.** They are unrelated:
  `origin/main`'s is a `server-only` DB module (admin dates + closure banner)
  and keeps the name; the local static events dataset for the visitor calendar
  screen moved to **`lib/rwanda/events.ts`** and its three consumers were
  repointed. It cannot merge into the other — it is imported by client
  components, and `server-only` would break them.
- **`tests/engine.test.ts` was edited.** The curated `CITY_IMAGES` map now wins
  over a listing's own photo, which broke "never picks a known-dead image to
  represent a city" — it asserted the exact fallback. The guard is kept, on a
  city with no curated photo, and a second test pins the new precedence.

### Open items
- **The Google Maps API key is still in git history and must be revoked in the
  Google Cloud console.** It is out of the working tree and `.env` is ignored,
  but history is public. Carried over — still not done.
- Three `high` npm advisories remain in Next's transitive tree (`postcss`,
  `sharp`); clearing them needs **Next 16**, a major upgrade. CI fails on
  `critical` only, deliberately.
- **Two derivations of the Rwandan calendar now coexist:**
  `lib/rwanda/calendar.ts` (pure, unit tested, drives opening-hours warnings)
  and `lib/rwanda/events.ts` (the visitor calendar screen, carries the cultural
  events and display copy). Both derive Umuganda and the public holidays. Worth
  collapsing onto one before either grows.
- Four `_*.ts` / `_*.cjs` scratch scripts sit untracked at the repo root
  (`_check_db_images`, `_debug_catalog`, `_update_db_images`, `_verify_images`).
  Deliberately not committed — one hardcodes a temp scratchpad path. Delete
  them when done.

### Architecture traps worth knowing
- `lib/places/taxonomy.ts` is the source of truth for categories; the legacy
  redirect map in `next.config.mjs` hardcodes group ids, so a stale id silently
  404s old links.
- **Never import `lib/places/catalog` from a client component** — it reaches
  the raw datasets and would ship them to the browser. Pass
  `buildSearchIndex()` down as props.
- `unstable_cache` results persist in `.next/cache` **across dev server
  restarts**. Writing to `calendar_dates` from a script leaves the banner stale
  until the tag is revalidated or `.next` is removed; it looks exactly like a
  logic bug. The admin action calls `revalidateTag`, so the real path is fine.
- Admin auth now runs **once** in `app/admin/(dash)/layout.tsx`. Pages inside
  the group must not repeat `requireAdmin()`; `/admin/login` sits outside it
  deliberately so it renders bare.

## Recently Completed
- Review text required (10–1000 chars) from one schema shared by the form and
  the server action; empty-bodied reviews can no longer be posted.
- Admin dashboard rebuilt on a shared shell, `(dash)` route group and plain CSS;
  new activity, businesses, reviews, settings and submissions sections.
- Turn-by-turn navigation at `/navigate/[id]` via OSRM (no billing, no key),
  always with a Google Maps hand-off.
- Real licensed photos for the parks, lakes, museums and every district card.
- Auth hardening, session revocation, rate limiting, data-protection controls,
  listing reports, the Rwandan calendar, 136 unit tests and CI (`origin/main`).
