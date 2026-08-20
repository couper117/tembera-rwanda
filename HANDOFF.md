# HANDOFF

## Current Task
Rebuild the login/register screens as a genuine full-bleed 50/50 split
(photo half + form half), not the floating-card-on-empty-page layout they
had before, and make it work on mobile too instead of just hiding the photo.

## Status
Solved. Typecheck and lint are clean; verified in a real headless Chrome via
Playwright-core across desktop, mobile, a narrow-desktop (800px, just under
the split breakpoint), and dark mode, with zero console/page errors and no
horizontal overflow.

**Not yet done:** no automated regression suite covers this beyond the ad hoc
Playwright check above. `npm run build` was **not** run — a dev server was
already live on :3001 and HANDOFF's own rule is not to build while a dev
server is running against the same `.next`.

**One known issue left over from prior work, deliberately:**
`/c/<unknown>` serves the correct not-found screen with a **200** instead of
a 404. See the note in `app/(site)/c/[category]/page.tsx` — it is the only
one of the three dynamic routes that reads `searchParams`, so
`dynamicParams = false` (which fixed `/place/[id]` and `/city/[city]`) cannot
apply. Fixing it means moving `?type=` into `PlaceBrowser`, which costs
server-rendered filtering on linked filtered URLs. Left for a decision.

## Progress
- [x] Rebuilt `.t-auth-container` in `app/(site)/auth.css` as a true 50/50
      grid (`1fr 1fr`, `min-height: 100dvh`) instead of a centred
      `max-width: 1060px` container with two independent floating cards —
      that was the actual source of the "horrible" complaint: huge empty
      gutters on all sides, not a broken image or missing asset
- [x] `components/auth/AuthHero.tsx` — the shared image half. Carries its
      own floating back + theme buttons (`t-iconbtn--solid`, same pattern as
      `.t-detail__floaters`) instead of the usual `PageHeader`, since a 56px
      opaque bar would cut a slice off a full-bleed photo
- [x] Mobile no longer hides the hero — it becomes a `38vh` top image band,
      and the form rises over its bottom edge as a rounded sheet
      (`margin-top: -22px`, `var(--t-shadow-sheet)`), same idea as
      `.t-detail__body`'s hero-overlap treatment
- [x] `AuthHero` takes an `image` prop — login and register now show
      **different photos** rather than one hardcoded in CSS
- [x] New login-only asset `public/assets/images/rwanda_forest_road.jpg`,
      converted from a user-pasted PNG via `sharp` (2.3MB → 170KB) and
      re-cropped (see Working Notes) so the road reads clearly instead of
      being buried under tree canopy + the text scrim
- [x] Fixed a real bug: the email field used the `external` icon (open-box/
      arrow), not a mail icon. Added a proper `mail` icon to `Icon.tsx`.
- [x] Removed the now-dead `.t-app:has(.t-auth-container) .t-header` rule in
      `components.css` — `PageHeader` no longer renders on these routes

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

### Profile and the demo account
- `lib/client/account.tsx` holds the one local profile (`AccountProvider`,
  mounted in `app/(site)/layout.tsx`). Seeded as "Demo User", every field
  editable, persisted to localStorage. `joinedAt` is deliberately not editable.
- The seed identity is obviously a placeholder on purpose — a plausible
  invented person would be worse.
- `lib/client/visited.ts` + `components/place/VisitRecorder.tsx` record real
  visits, so "Places visited" and "Districts" are derived from behaviour rather
  than seeded. `VisitRecorder` exists so the place page can stay a server
  component.
- Storage keys in use: `tembera.account`, `tembera.saved`, `tembera.visited`,
  `tembera.recent`, `tembera.city`. Settings can clear the last three.

### The calendar page
- `lib/data/calendar.ts` is pure and static — no DB, no fetch, safe to import
  from client components directly (unlike `lib/places/catalog`). Every
  rule-based date (Umuganda's "last Saturday of the month", Umuganura's
  "first Friday of August") is computed from the year, not hand-typed.
- A few real events (Umushyikirano, Kwita Izina, Itorero Urungano) genuinely
  move year to year with no fixed rule. They're marked `approx: true` and
  pinned to a representative date rather than invented as exact — same
  honesty principle as the distance-precision and rating rules on `/about`.
- **"Today" is computed in Africa/Kigali time (UTC+2, no DST), not the
  viewer's device timezone** — `nowInKigali()` shifts `Date.now()` by a fixed
  2 hours and reads the UTC fields. This is deliberate, not just convenient:
  it means server render and client hydration compute the exact same value
  from the same instant with zero timezone library and no hydration
  mismatch, and it's the substantively correct clock for "when things happen
  in Rwanda" regardless of who's viewing the page.
- The page originally shipped with the whole screen (stats, next-event card,
  month grid, agenda) capped at `maxWidth: 760`, inherited from the `/about`
  pattern. For a page that's actually text, that's fine; for a calendar grid
  it read as a narrow column drowning in gutter on desktop. Only the
  text sections (title/stats, the disclaimer notice) stay capped now — the
  interactive `CalendarScreen` uses the full page width, and splits into a
  **Calendar/List view toggle** (`t-cal-viewtoggle`) rather than stacking the
  month grid and the full agenda on one screen.
- Desktop calendar view is a two-column `t-cal-layout` (grid + a sticky
  `320px` side panel showing the selected day) above 900px; below that it
  collapses to one column via the same grid rule, no separate mobile markup.
- **Playwright's `fullPage: true` screenshot is unreliable on this layout** —
  it rendered content shifted left and cropped by roughly the rail's width,
  with no matching `scrollX`/overflow in `page.evaluate()`. A same-viewport
  (`fullPage: false`) screenshot of the identical page was pixel-correct.
  Root cause not chased down (likely a Chromium fullPage + `position: fixed`
  rail interaction) — just use `fullPage: false` for this app's screens.
- The bell in `AppHeader` reads the same `getCalendarEvents()` /
  `nowInKigali()` and shows the next 3 events as real notification rows
  (`kindStyleVars()` shared with `CalendarScreen` for the icon/colour), not a
  stub. A `.t-dot` appears on the bell only when the nearest event is within
  7 days.

### The auth screens
- `.t-auth-container` is load-bearing beyond styling: `components.css` keys
  `.t-main:has(.t-auth-container) { padding-left: 0; padding-bottom: 0 }` off
  its presence to cancel the rail/bottom-nav padding `.t-main` reserves
  everywhere else (DesktopRail and BottomNav both already `return null` on
  `/login` and `/register` via their own pathname checks, but `.t-main`'s
  padding doesn't know that on its own). Keep the class name if this gets
  restructured again.
- The split is **`1fr 1fr` at `min-width: 860px`**, full `100dvh`. Below
  that, `AuthHero` becomes a `38vh` top band and `.t-auth-form-wrapper` rises
  over its bottom edge by `-22px` with rounded top corners — the same
  "sheet over a hero" move `.t-detail__body` already uses for place pages,
  reused here instead of invented fresh.
- `.t-authcard` itself has **no border/shadow/radius any more** — on mobile
  the sheet chrome lives on `.t-auth-form-wrapper`, on desktop the form sits
  directly on the plain background. A card floating inside another card read
  as dated once the photo half became the actual visual anchor of the page.
- The hero's gradient is anchored to the **bottom only**
  (`linear-gradient(to top, dark 0%, dark 40%, transparent 68%)`), not a
  diagonal wash over the whole photo — the top of whatever image is used
  stays fully visible. `.t-auth-hero__desc` and `.t-auth-hero__stats` are
  `display: none` below 860px; only the badge + a shorter title show in the
  mobile band, or they'd overflow a 38vh strip.
- **Background-position tuning only matters when the container is wider,
  proportionally, than the image.** At `100dvh` tall and ~half-viewport
  wide, an auth-hero column is almost always *taller* relative to its width
  than a landscape source photo, so `cover` scales by height and shows the
  image's full vertical extent regardless of `background-position` — the
  only lever that actually moves what's visible is **cropping the source
  asset itself** before it ships. This is why `rwanda_forest_road.jpg` is a
  crop of the pasted photo (`sharp().extract()`, top 195px of 780 trimmed)
  rather than the original — the uncropped version buried the road under
  canopy + the text scrim with no CSS position fixing it.
- `AuthHero` takes an `image` prop (no default) — every call site must pass
  one. Each auth screen can carry its own photo; nothing forces them to
  match.
- **User-pasted images land in `~/.claude/image-cache/<session-id>/N.png`**,
  not anywhere under the project or the usual scratchpad — worth remembering
  next time a message references "this image" with no other path given.
  They're typically large lossless PNGs; re-encode through `sharp` (already
  a transitive dep via Next's image optimizer) before committing as a web
  asset — the pasted photo here was 2.3MB PNG, 170KB as an 84%-quality JPEG
  at the same crop.

### Keys — open actions
- A working `NEXT_PUBLIC_GOOGLE_MAPS_KEY` is in `.env` (gitignored). Two others
  were tried first and failed: Google's public *demo* key from their samples
  (`Maps Demo Key limit reached`), and one whose project had Maps JavaScript
  API disabled (`ApiNotActivatedMapError`).
- **Enable Directions API** on the working key — the in-app routing is built
  and wired but has never been exercised.
- **Restrict the key by HTTP referrer.** A `NEXT_PUBLIC_*` key ships to the
  browser by design; referrer restriction is the actual protection.
- `legacy/pages/map.php` still contains a different hardcoded Google key that
  is committed to git. **It should be revoked**, whether or not it still works.
- The default admin password is still `changeme123`.

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
- Port 3000 belongs to unrelated work — **do not kill it**. `next dev` lands on
  **3001**.
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
- **`/c/<unknown>` returns 200, not 404** — the one known defect. See Status
  and the note in `app/(site)/c/[category]/page.tsx`.
- Enable **Directions API** so in-app routing can actually be used, and
  restrict the Maps key by referrer. See "Keys — open actions".
- No dark theme. Tokens are structured for it (all colour lives on `:root`),
  but no dark palette exists yet.
- The map uses the deprecated `google.maps.Marker`; moving to
  `AdvancedMarkerElement` needs a Map ID.
- Default admin password is still `changeme123`.
- `npm audit` still reports 3 vulnerabilities (2 high, 1 critical) in the tree.
- `package-lock.json` carries a trivial npm-generated diff from an earlier
  `npm install`.

## Recently Completed
- Rebuilt login/register as a true full-bleed 50/50 split (`AuthHero` +
  per-page photos) instead of two floating cards on an empty page; mobile
  now gets a hero band + rising sheet instead of losing the photo entirely.
- Added the static `/calendar` screen (Rwanda holidays/Umuganda/culture/
  memorial) with a Calendar/List toggle, plus a header notification bell
  surfacing the same data.
- Cut the bespoke Rwanda map back to an ordinary one; rebuilt its side panel.
- Built the profile screen on a local demo account with real visit history.
- Fixed `/place/<unknown>` and `/city/<unknown>` returning 200 instead of 404.
- Built, then removed, the district map: polygons, mask, tiered labels,
  drill-down. Over-built for the product — see "The map" before rebuilding.
- Expanded to the 16-group taxonomy, category sidebar and fuller header.
- Redesigned Tembera into a discovery product.
- Verified the migrated Next.js + Prisma + Postgres app end to end.
- Migrated the legacy PHP/MySQL app to Next.js + Prisma + Postgres (5d4cf2a).
