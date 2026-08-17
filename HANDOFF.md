# HANDOFF

## Current Task
Close out the weaknesses and threats found in the SWOT review (`SWOT.md`):
security hardening, data-protection compliance, tests and CI.

## Status
Done and verified. Lint, typecheck and a clean production build all pass;
**78 unit tests pass**; rate limiting was confirmed against the real admin
login in a browser (blocked from the 6th attempt, as designed).

**One decision left for the owner:** three `high` npm advisories remain in
Next's own transitive tree (`postcss`, `sharp`). Clearing them requires
**Next 16**, a major upgrade. Next 15.5.23 cleared the critical one. See
"Dependencies" below.

### What changed (second pass — session revocation and auth tests)
- **Sessions are now revocable.** `User.tokenVersion` is carried in the cookie
  payload; `getCurrentUser` refuses a cookie whose version is stale. Changing a
  password bumps it and re-issues a cookie for the current browser, so the
  device that proved it knows the password stays in and everything else is
  signed out. Settings also has an explicit "sign out on all devices".
  - Cookies issued before this change have a two-part payload and are rejected,
    so **everyone is signed out once** on deploy. That is intended.
- **The token format and its crypto moved to `lib/session-token.ts`** — pure,
  no Next runtime — so forgery, expiry, future-dating and the old cookie format
  are all covered by unit tests (94 total now).
- **`npm run test:auth`** (`scripts/e2e-auth.cjs`) makes the two manual browser
  checks repeatable: rate limiting blocks by the 6th attempt, and a replayed
  pre-change cookie is refused. It restores the demo password afterwards.

### What changed (first pass)
- **Rate limiting** on public login, registration and admin login
  (`lib/rate-limit-core.ts` for the logic, `lib/rate-limit.ts` for the request
  side). Per-address *and* per-account, because they stop different attacks.
- **Server-side session expiry.** `getCurrentUser` now checks the timestamp in
  the cookie payload. A stolen cookie is replayed by a client that has no
  reason to honour `maxAge`, so the browser dropping it protects nobody.
- **No default passwords.** The seed generates and prints one; the demo account
  is opt-in via `SEED_DEMO_USER=true`. `npm run set-password` resets any
  account, and users can change their own in Settings.
- **The committed Google Maps key is out of `legacy/pages/map.php`.** It is
  still in git history — **it must be revoked in the Google Cloud console.**
- **Privacy**: `/privacy` policy page, data export and account deletion in
  Settings (Law N° 058/2021). Deleting an account unlinks bookings rather than
  destroying them — they are commercial records.
- **Booking validation**: guest count capped at 20 (matching the stepper), so
  the price can no longer overflow the `int4` column into a 500; dates must be
  in the future and within two years.
- **Tests and CI**: 78 unit tests on the pure layer via `node:test` (no new
  dependencies), and `.github/workflows/ci.yml`.
- **`scripts/e2e.cjs` could not start on this machine** — it hardcoded
  `Program Files\Google\Chrome`, but Chrome here is in `Program Files (x86)`.
  It now probes both, plus Edge, plus `CHROME_PATH`.

## Progress
- [x] **Map cut back to an ordinary Google map.** Deleted the district
      polygons, national mask, district labels + collision culling, palette,
      country/detail style swap, drill-down, `public/geo/*` (239 KB) and
      `scripts/build-rwanda-geo.mjs`. What remains: default Google basemap with
      only `poi.business` hidden, our pins, a filter row, a results panel, the
      selected-place sheet and in-app directions.
- [x] Map opens framed on the **results**, not the country — every listing is
      in Kigali, so fitting Rwanda rendered as one pin in an empty map.
      Changing the filter reframes onto the new results.
- [x] Rebuilt the map side panel: fixed search + filters head, scrolling
      result list, rows that drive the map instead of navigating away.
- [x] **Profile screen** on a local demo account (`lib/client/account.tsx`):
      avatar initials, name, @handle, bio, home city, join date, and three
      stats. Editable inline with validation; persists to localStorage.
- [x] Visit history is **real**, not seeded (`lib/client/visited.ts` +
      `VisitRecorder` on the place page), so "Places visited" and "Districts"
      mean something. Clearable from the profile and from Settings.
- [x] `/place/<unknown>` and `/city/<unknown>` now return a real **404**
      instead of 200 (`dynamicParams = false`)
- [x] Lifted 8 hardcoded per-page datasets into `lib/places/sources/*` (verbatim)
- [x] Unified them into one catalog: now 495 places, 16 groups, 30 districts
- [x] Two-level taxonomy in `lib/places/taxonomy.ts` (16 groups, 70 subcategories)
- [x] Seeded `lib/places/sources/directory.ts` with ~200 real Rwandan institutions
- [x] Rail rebuilt: branded header, colour-coded single-column category list,
      "More categories", promo card, pinned Saved/Profile/Settings, collapsible
- [x] Full category tree still available in the header's mobile sheet
- [x] Per-category colour system applied across rail, tiles, cards and placeholders
- [x] Real /settings screen (location + local data); Profile slimmed to match
- [x] Header filled out: inline desktop search, city, categories, map, saved, profile
- [x] Subcategory-precise search and `?type=` deep links throughout
- [x] Design system (`app/globals.css` tokens + `app/components.css` primitives)
- [x] Inline SVG icon set, replacing the CDN FontAwesome dependency in the app
- [x] App shell: compact header, bottom nav, desktop rail, city picker
- [x] Screens: home, search, explore, category, city, place, map, saved, profile
- [x] Rebuilt booking + about on the design system (booking server action untouched)
- [x] Legacy category routes 308-redirect to the new ones
- [x] Empty / error / loading / no-location / no-map-key states throughout
- [x] Verified: build, lint, tsc, 17 screens screenshotted at 390px and 1440px

## Working Notes

### Architecture
- `lib/places/taxonomy.ts` is the **source of truth for categories**. A place's
  `subcategory` must be one of its group's declared subcategories, or the
  group page cannot filter it. A smoke check for this lives in the notes below.
- `lib/places/` is the core. `catalog.ts` (server-only — it pulls in the raw
  datasets) normalises every legacy record into one `Place` shape.
- Places carry three levels: `categoryId` (group), `subcategory` (taxonomy),
  and an optional `subtype` the source already had (a denomination, a shop
  type). The browser shows subcategory chips, then subtype chips beneath when
  they'd narrow anything further.
- The legacy redirect map in `next.config.mjs` hard-codes group ids. **Keep it
  in step with the taxonomy** — a stale id silently 404s old links.
  `search.ts` is **pure** and takes its data as an argument, so the search
  screen can run it in the browser over a slim index.
- **Never import `lib/places/catalog` from a client component.** It reaches the
  source datasets and would ship them to the browser. Pass
  `buildSearchIndex()` down as props instead (that's what `/search`, `/map` and
  `/saved` do).
- ~30 legacy records stored their photo as an inline `data:` URI (~500 KB
  total). Those are lifted out at catalog build time and served by
  `/api/place-image/[id]` with an immutable cache header, so no HTML response
  or bundle carries base64 any more.
- `/api/nearby?lat=&lng=` exists so the home screen can re-rank against the
  device position without shipping the catalog to every visitor.

### Honesty rules baked into the UI (please keep these)
- Ratings render only where the source actually had one — a missing star is
  missing data, not a low score.
- Records with only a district get that district's centre and
  `coordsPrecision: "district"`. `formatDistanceFor()` prefixes those with `~`
  and **suppresses sub-kilometre readings entirely**, because two places in one
  district would otherwise both read "0 m away".
- Categories with no data (banks, hospitals, transport, …) appear in the
  explorer marked "Coming soon" and open a "not yet" screen. They are never
  padded with invented listings.
- The home row is labelled "Top rated", not "Popular" — there is no analytics
  behind it. It round-robins across categories because the 50 synthetic stays
  all carry ~4.9 and would otherwise fill the row.

### Data caveats worth knowing
- **`sources/directory.ts` is a demo seed.** Real, well-known Rwandan
  institutions, but not a verified register: district-level location only, and
  no ratings, phone numbers or opening hours are asserted. The About screen
  says so to users. Verify before treating it as production data.
- The legacy 50 synthetic stays ("Serena Heights 1", generated by a seeded PRNG)
  were **removed** and replaced with real hotels, lodges and resorts. Recover
  them from git history if the volume is ever wanted back.
- Two subcategories are legitimately empty: **Train Stations** (Rwanda has no
  passenger rail) and **Shopping Centers**. They render greyed out rather than
  padded.
- A handful of source image URLs are dead (a removed Flickr upload, some
  `googleusercontent.com/image_collection` links). `PlaceImage` falls back to a
  category-tinted glyph — including for images that 404 before hydration, which
  is why it checks `naturalWidth` on mount as well as listening for `onError`.
  Most directory entries have no photo at all and use the same treatment.

### The desktop rail
- It is a **floating card**: inset from the window by `--t-rail-inset` on all
  sides, rounded, white, with a hairline border. `--t-rail-w` is the total
  footprint including that inset, and both `.t-main` and `.t-header` offset by
  it — change the one variable and the whole layout follows.
- **It must never scroll.** The category list is trimmed to whatever the
  viewport height allows, via `max-height` queries in `components.css` that
  hide `.t-rail__cats > a:nth-child(n + N)`.
- **Those thresholds are measured, not derived.** Do not hand-calculate them:
  flex children shrink rather than overflow, so `scrollHeight > clientHeight`
  never fires and a naive check passes while rows are visibly squashed. The
  real signals are (a) any `.t-railrow` rendering under its set height and
  (b) `.t-rail__foot` extending past the rail's bottom edge. The probe that
  produced the current numbers drives the visible count from JS with
  `style.setProperty("display", …, "important")` — a plain inline style loses
  to the media queries — and records the largest count that trips neither
  signal, walking 1300px → 400px in both expanded and collapsed states.
  **Re-run it after any rail spacing change.**
- `.t-railrow` is `flex: none` so rows can never squash; if the trimming is
  ever wrong the failure shows as the footer overflowing, which the probe
  catches.
- `:nth-child` trimming excludes `.t-railmore`, or "More categories" would
  disappear exactly when it becomes necessary.
- Collapse state lives in `components/app/AppShell.tsx`, which sets
  `data-rail="collapsed"` on `.t-app` and overrides `--t-rail-w`. Persisted in
  localStorage.
- Labels collapse by animating `max-width` to 0, **not** `display: none` —
  everything (rail width, labels, content offset) shares `--t-rail-anim`, so
  the collapse reads as one movement instead of a pop.

### The map
Deliberately **ordinary**. An earlier version made Rwanda the entire map —
district polygons, a national mask, custom name plates, drill-down, restricted
panning. It worked, but it was more map than the product needs, so it was cut.
Do not rebuild it without being asked.

What is there now:
- Default Google basemap. The only styling is `poi.business` off (our pins are
  the content; two sets of pins on one map is unreadable) and transit icons off.
  Roads, water, parks and place names stay exactly as Google draws them.
- No `restriction`, no `strictBounds`; just `minZoom: 6`.
- The map frames the **current results**, not the country. Nearly every listing
  is in Kigali, so fitting Rwanda's bbox rendered as a single pin in an empty
  map. Changing the category refits.
- `fitPlaces()` reads `visibleRef`, not `visible` — it is called from a map
  callback registered once, which would otherwise close over a stale list.
- Zoom is capped at `PLACE_ZOOM` after a fit, or a single result drops you into
  a street with no context.
- Google's zoom control shows on desktop only (`matchMedia` at init); phones
  pinch.

Two layout rules that are easy to lose and break the whole screen:
- `.t-map__stage` needs its own `height: 100%` — the canvas is absolutely
  positioned, so without it the stage collapses to 0px and the map vanishes
  on mobile.
- `.t-map` needs `padding-left: var(--t-rail-w)` like `.t-main`, or its side
  panel hides under the sidebar.

Still true and worth keeping:
- `fitBounds` must wait for the map's first `idle`. Called earlier, the map
  hasn't measured its container and fits against a default size — a phone then
  lands on the same zoom as a desktop.
- Directions render **in the app** via DirectionsService/Renderer with a route
  sheet; nothing hands off to an external maps app. This path has still never
  been exercised — the key needs **Directions API** enabled.
- The three failure states are distinct and each was verified against a real
  failure: no key, **key rejected** (no retry button — reloading cannot help),
  and network failure (retry offered). The browsable list stays usable in all
  three.
- Many listings are district-precision, so dozens of pins land on the exact
  same centroid and only the top one is clickable. The panel list reaches all
  of them, so this is a data-quality limit, not a map bug. Clustering would be
  the fix if the coordinates ever improve.

### Profile and accounts
- Accounts are **database-backed** (`users` table). The old localStorage-only
  "demo account" is gone; `lib/client/account.tsx` is now a provider that
  reflects the signed-in user and falls back to local state for guests.
- `lib/client/visited.ts` + `components/place/VisitRecorder.tsx` record real
  visits, so "Places visited" and "Districts" are derived from behaviour rather
  than seeded. `VisitRecorder` exists so the place page can stay a server
  component.
- Storage keys still used for **guests**: `tembera.saved`, `tembera.visited`,
  `tembera.recent`, `tembera.city`. Signed in, those live in the database
  instead and sync across devices.

### Keys — open actions
- A working `NEXT_PUBLIC_GOOGLE_MAPS_KEY` is in `.env` (gitignored). Two others
  were tried first and failed: Google's public *demo* key from their samples
  (`Maps Demo Key limit reached`), and one whose project had Maps JavaScript
  API disabled (`ApiNotActivatedMapError`).
- **Enable Directions API** on the working key — the in-app routing is built
  and wired but has never been exercised.
- **Restrict the key by HTTP referrer.** A `NEXT_PUBLIC_*` key ships to the
  browser by design; referrer restriction is the actual protection.
- **REVOKE the key that was committed in `legacy/pages/map.php`.** It has been
  removed from the working tree, but it remains readable in git history, so
  removal is not containment — only revocation is. This is an owner action in
  the Google Cloud console and is still outstanding.

### Dependencies
- `npm audit` is at **3 high, 0 critical**. Next 15.5.23 cleared the critical.
- The three remaining sit in **Next's own transitive tree** (`postcss`,
  `sharp`) and `npm audit fix --force` resolves them only by installing
  **Next 16** — a major upgrade. Not taken unilaterally.
- Exploitability here is low but not zero: the postcss advisories are
  build-time and process *our own* CSS, and the sharp/libvips ones need a
  malicious image through the optimizer, which is restricted to six whitelisted
  CDN hosts in `next.config.mjs`.
- When the Next 16 upgrade is taken, note that **`next lint` is removed in 16**
  — the lint script and CI both need migrating to the ESLint CLI
  (`npx @next/codemod@canary next-lint-to-eslint-cli .`).
- CI fails on `critical` only, deliberately, so the build is not permanently
  red on findings that cannot be fixed without that major bump. Tighten the
  threshold once it lands.

### Loading states
- **Skeletons for data**, spinner for everything else. Anything resolving into
  a list or grid of places uses `components/ui/Skeleton.tsx`, because a
  placeholder shaped like the result is the better signal. `Spinner` is for
  waits with no content shape yet: the Maps SDK booting, the booking form
  submitting, a geolocation lookup.
- Inside a filled button pass `tone="current"` so the ring inherits the button's
  text colour — the accent green is invisible on the green button.
- The global `prefers-reduced-motion` rule would freeze the spinner solid, so
  `components.css` overrides it back to a slow steady rotation.

### CSS gotchas already paid for
- `.t-show-desktop` / `.t-hide-desktop` **only ever set `display: none`.** An
  earlier version set `display: initial` for the visible state, which silently
  clobbered each component's own display (the flex header search collapsed,
  grid icon buttons lost their centring). Don't reintroduce that.
- Grid tracks are `minmax(0, 1fr)`, never bare `1fr` — card titles are
  `nowrap`, and a long place name would otherwise widen its column and make the
  whole row's cards taller.
- Card media uses an absolutely-positioned image inside an `aspect-ratio` box.
  A percentage height there resolves to auto and stretches the card.

### Local setup (unchanged from before)
- Postgres 18, service `postgresql-x64-18`, `postgres`/`postgres`;
  `psql` is at `C:\Program Files\PostgreSQL\18\bin\psql.exe`.
- **Port 3000 is free on this machine** (the earlier note claiming it belonged
  to unrelated work is out of date — `next dev` binds 3000 fine). If it is in
  use, it is almost certainly an orphaned dev server of your own; check before
  assuming otherwise.
- **Never run two dev servers against this project.** They share `.next` and
  corrupt each other: the symptoms are `SyntaxError: Unexpected end of JSON
  input`, phantom 404s on `/` and `/map`, and `ChunkLoadError` in the browser.
- Likewise, **stop the dev server before `npm run build`**, and `rm -rf .next`
  when switching between dev and build output — `next dev` over a build output
  makes dynamic routes 404. This has cost time twice.
- `npm run build` runs `prisma generate` first, and on this machine that now
  fails with `EPERM` renaming `query_engine-windows.dll.node` — **even with the
  dev server stopped**, so something outside the project (the project lives in
  a OneDrive-synced folder; antivirus is the other usual suspect) holds the
  file. It is unrelated to the app code: `npx next build` builds cleanly
  (354 pages) because the generated client is current and the schema is
  unchanged. If you edit `prisma/schema.prisma`, you must get
  `prisma generate` to run — pause OneDrive sync for the folder, or move the
  project out of the synced tree.
- **Never leave two dev servers running against this project at once.** They
  share one `.next` directory and corrupt each other's manifests — the symptoms
  are `SyntaxError: Unexpected end of JSON input` in the server log, several
  routes 404ing for no reason, and `ChunkLoadError` in the browser. Check with
  `Get-NetTCPConnection -LocalPort 3000,3001,3002 -State Listen` before
  starting one. (Port 3000 is occupied by unrelated work on this machine.)
- Killing the shell that wraps `npm run dev` orphans `next-server` on :3002:
  `Get-NetTCPConnection -LocalPort 3002 -State Listen | %{ Stop-Process -Id $_.OwningProcess -Force }`
  It can also leave the port in LISTEN with nothing answering — requests then
  hang rather than refuse. If `dev.log` has stopped growing, that's the tell.
- **Never run `next dev` over a `next build` output.** Sharing `.next` between
  the two makes every dynamic route (`/place/[id]`, `/c/[category]`) 404 in dev
  even though the build succeeded. `rm -rf .next` before switching modes. This
  cost real debugging time — it looks exactly like a routing bug.
- First compile of `/` in dev takes ~20s now that the catalog is 495 places.
  A curl that times out at 10s is impatience, not a hang.
- `next build` occasionally dies with "Cannot find module for page: /about"
  after a `.next` wipe. It is a filesystem race with OneDrive sync, not a code
  fault — the identical build passes on retry.

### Not done / next candidates
**Owner actions — cannot be done from the codebase:**
- **Revoke the Google Maps key** that was committed in `legacy/pages/map.php`
  (still in git history), and **restrict the live key by HTTP referrer**.
- **Fill in the privacy contact.** `app/(site)/privacy/page.tsx` uses
  `privacy@tembera.rw`; point it at a mailbox somebody reads. If Tembera is
  offered commercially, check registration with the supervisory authority
  under Law N° 058/2021.
- **Decide on Next 16** — see "Dependencies".
- **Move the project out of the OneDrive-synced folder.** It is the cause of
  the `EPERM` on `prisma generate` and the intermittent build races below.

**Product / engineering:**
- **Data verification** is the highest-value work left. `sources/directory.ts`
  is a demo seed, and the product is only as good as its records. An RDB or
  district-level partnership is the route.
- No password *reset* flow (no email sending is wired up at all). Users can
  change a known password; a forgotten one needs `npm run set-password`.
- Bookings are still lead capture: no payment, no availability, no confirmation
  email.
- Admins cannot upload an image — place photos are remote URLs from the six
  whitelisted CDNs plus legacy `data:` URIs.
- Enable **Directions API** so in-app routing can actually be used.
- The map uses the deprecated `google.maps.Marker`; moving to
  `AdvancedMarkerElement` needs a Map ID.
- `getPlace(id)` still scans the whole in-memory catalog (`lib/data/places.ts`).
  Fine at 495 places; push filtering into Prisma at roughly 5,000.

**Done since this list was last written:** `/c/<unknown>` now returns a real
404 (verified); the dark theme exists (`lib/client/theme.tsx`); the critical
advisory is cleared.

## Recently Completed
- Closed out the SWOT weaknesses: rate limiting, server-side session expiry,
  no default passwords, privacy policy, data export and account deletion,
  booking validation, 78 unit tests, and CI.
- Cut the bespoke Rwanda map back to an ordinary one; rebuilt its side panel.
- Built the profile screen on a local demo account with real visit history.
- Fixed `/place/<unknown>` and `/city/<unknown>` returning 200 instead of 404.
- Built, then removed, the district map: polygons, mask, tiered labels,
  drill-down. Over-built for the product — see "The map" before rebuilding.
- Expanded to the 16-group taxonomy, category sidebar and fuller header.
- Redesigned Tembera into a discovery product.
- Verified the migrated Next.js + Prisma + Postgres app end to end.
- Migrated the legacy PHP/MySQL app to Next.js + Prisma + Postgres (5d4cf2a).
