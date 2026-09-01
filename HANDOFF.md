# HANDOFF

## Current Task
Building the **Place Profile Engine** on branch `backend-rebuild`: category-aware
listing forms, semantic pricing, a real public place page, and a tabbed admin
review workspace. This sits on top of the finished Neon backend rebuild
(`~/.claude/plans/good-now-that-we-virtual-locket.md`, phases 0–6 done).

## Status
**In progress.** `/place/[id]` has been rebuilt as a full profile — that piece
is done and verified in a browser at both 390px and 1280px. The category
configuration system and the admin review workspace are not started.

## Progress
- [x] Backend phases 0–6: Neon + Prisma, `lib/data/*` on Postgres, Auth.js v5
      with four roles, public writes, admin CMS writes with an audit trail,
      business accounts and the submissions pipeline.
- [x] Mobile app-style chrome on every dashboard; admin top bar; business
      sidebar and header.
- [x] Dead submit button on the tabbed listing forms (`required` on a hidden
      tab silently blocks submit — the browser cannot show its bubble).
- [x] `FormFeedback` — names each bad field as a button that switches tab and
      focuses the input; rejected forms keep what was typed.
- [x] **Semantic pricing** (`lib/places/pricing.ts`) — replaces the universal
      "From $12,000 per night". Categories where a price is not a real concept
      never show one, whatever is stored.
- [x] **`/place/[id]` rebuilt** — see below.
- [ ] Category configuration system: `categoryFields.ts` + `Place.details Json`
      + a dynamic form renderer + category-determined page sections.
- [ ] Structured menu items for restaurants.
- [ ] `/admin/submissions/[id]` as a tabbed review workspace
      (Overview · Details · Media · Category Data · Location · History).
- [ ] Phases 7–9: richer business page fields, Resend email and password
      reset, analytics and `/admin/quality`.

## Working Notes

### The place page rebuild (just finished)
`app/(site)/place/[id]/page.tsx` now composes four new components. Order:
hero → quick facts → closure notice → About → Why visit → Things to do →
Photos → Opening hours → Where it is → Reviews → Nearby → Report.

- `components/place/PlaceHero.tsx` — the cover. Full-bleed on a phone, rounded
  from 768px. Carries the name, rating, open-state pill and the three actions
  a visitor arrives wanting (Directions / Call / Website). **The hero sizes
  itself from its content, not from an aspect ratio** — a fixed ratio broke the
  moment a long name wrapped and pushed the title block off the top of the
  photo. `min-height` sets the floor, the photo fills whatever height results.
- `components/place/OpeningHours.tsx` — the week, today marked. A day that was
  never filled in reads "Not known", never "Closed": sending somebody away from
  an open restaurant is the worse error. Falls back to the free-text `hours`
  line, which is all 495 imported rows have.
- `components/place/PlaceMap.tsx` — read-only Leaflet on OpenStreetMap tiles,
  no key. **Draws a 2.5km circle rather than a pin when the coordinates are
  only a district centre**, which is true of 478 of 495 listings. A pin there
  would be a precise claim the data cannot support.
- `components/place/WhyVisit.tsx` — reasons derived *only* from fields somebody
  filled in; returns null below three of them rather than padding.
- `openStateNow()` in `lib/places/hours.ts` — "Open until 10pm" /
  "Closed · opens 8am tomorrow", Kigali UTC+2, no DST, no timezone library.
  Returns `open: null` when the day was never recorded so the UI can say
  nothing instead of guessing.

The header on this page is an overlay: `PageHeader` gained an `overlay` prop
that floats the bar over the hero with no background of its own until the
reader scrolls, at which point it becomes an ordinary bordered bar so the
title stays readable. **The theme switch was removed from `PageHeader`
entirely** — it is a setting, not a page action, and it still lives in
`AppHeader` (the main tabs) and in Settings.

On a phone the sections are plain — whitespace and headings only. Boxing each
one was tried and rejected: it read as a stack of unrelated widgets. The
quick-facts strip (location / phone / website / price) stays a card because it
is reference data rather than prose. The hero's Directions button is hidden on
a phone because the sticky action bar already carries it, which stops Call and
Website wrapping to a second row.

`ReadMore` clamps the About text to six lines with a Read more / Show less
toggle. It measures `scrollHeight` against `clientHeight` rather than counting
characters, because a four-line description at 390px is two lines at 1280px,
and re-measures on resize.

**"Directions" no longer leaves the product.** All three entry points (hero,
sticky bar, desktop panel) go to `/navigate/[id]`, via `lib/places/directions.ts`.
That screen routes on OSRM and needs no API key, so it gives real turn-by-turn
steps today. `/map` was the obvious-looking target and is the wrong one: it
draws its canvas with the Google Maps JS API, and with
`NEXT_PUBLIC_GOOGLE_MAPS_KEY` unset — which it is — it renders no map at all.
The external Google link survives only for a listing with no coordinates but a
`mapLink` from the source data.

Gotchas found while building it:
- `place.images` includes the hero shot on most rows, so the gallery showed the
  same photograph twice and claimed "2 photos" for one. It is filtered now.
- New tokens `--t-open` / `--t-open-soft` (light + dark). Deliberately not
  `--t-accent`: brand green means "Tembera", this green means "you can go there
  right now", and a reader must not have to tell two greens apart.
- `.t-detail__hero`, `.t-detail__floaters` and `.t-detail__metarow` were deleted
  — superseded by `.t-hero*`.
- Many source photos are blown-out interiors, so the scrim carries the text
  contrast on its own; its bottom stop is 0.9 black for that reason.
- **`PlaceImage` is `loading="lazy"` by default, which is wrong for a hero** —
  it is the LCP element, and the browser sometimes had not decoded it four
  seconds in. It now takes an `eager` prop, set on the hero only.
- **Leaflet gives its panes and controls z-indexes in the 400-1000 range**, so
  the zoom buttons painted straight over the sticky header and through the
  action bar. `.t-placemap { isolation: isolate }` boxes them in.

**Verified:** typecheck, lint and 132 tests pass; production build serves;
no horizontal overflow at 390px or 1280px; the memorial page renders zero
ratings in the hero or body (the five on it are nearby *other* places) and no
reviews section.


### Where things stand
- `.env` points at the **dev** Neon branch, which holds the whole catalog.
  The **production branch is still completely empty — no tables at all.** The
  dev branch was created before the first migration ran, so nothing has ever
  been applied to production. It gets `prisma migrate deploy` + seed only once
  the rebuild is proven out on dev.
- Connection strings: `DATABASE_URL` is the pooled host, `DIRECT_URL` the
  direct one. Migrations cannot run through Neon's pooler.
- **`backend-rebuild` is merged into `main`** (`a17cd60`). `main` is 24 commits
  ahead of `origin/main` and **nothing has been pushed yet.** `static-fallback`
  holds the pre-rebuild static state.
- The merge brought in the landing redesign and the For Business page that had
  landed on `origin/main` meanwhile. Three files conflicted:
  `prisma/schema.prisma` (both sides added an identical `BusinessClaim`, since
  the rebuild had cherry-picked `kenny/business` — the duplicate was dropped,
  no structural change, no new migration), the place page (kept both the new
  profile and `ClaimListing`, now gated on `!isSensitive`), and
  `app/components.css` (auto-merged cleanly). The redesigned landing page
  needed no changes to read Postgres — the `lib/data` seam did its job.

### RwandaPay is wired up (test keys)
`lib/business/rwandapay.ts` is the client. Keys live in `.env` (gitignored) as
`RWANDAPAY_PUBLIC_KEY` / `RWANDAPAY_SECRET_KEY` — **never `NEXT_PUBLIC_`**, that
prefix compiles a value into the browser bundle.

**Three things the docs do not tell you, all found by probing the live test
API:**
- `Idempotency-Key` is **mandatory** on financial calls. Without it you get a
  400 `IDEMPOTENCY_KEY_REQUIRED` before the body is even looked at. Our
  reference doubles as the key, so a resubmitted sign-up reuses its session
  instead of charging twice.
- Phone numbers must be **local ten-digit** (`0788123456`). The international
  form the sign-up form asks for is rejected with a 422. `lib/business/phone.ts`
  normalises it — pure and unit-tested, deliberately free of `server-only` so
  the test runner can import it.
- `verify` returns **200 with `"Transaction not found"`** for a reference nobody
  has paid, not a 404. A not-found is "no", not an error.
- **`/checkout/{x}/verify` is keyed on RwandaPay's own `PAY-…` reference, not
  on our `tx_ref`** — and initialize echoing our `tx_ref` back as
  `data.reference` makes it look otherwise. Verifying on our own reference
  returns "Transaction not found" *forever*, including after the money lands,
  so every real payment would have gone unconfirmed. A paid transaction carries
  no field pointing back at our reference either: the only carriers that
  survive the checkout are `description` and `metadata`, which is why
  `initializeCheckout` writes the reference into both and `verifyPayment` falls
  back to scanning `/transactions` for a successful row carrying it. Matching
  proven against a real successful transaction on the account.

Flow: sign-up creates the registration → `initializeCheckout` opens a hosted
session and stores `sessionId` / `paymentUrl` → payer goes to RwandaPay →
`/business/register/return` and `/api/webhooks/rwandapay` both come back.

**Neither of those trusts what it is handed.** The return page proves only that
a browser followed a link; the webhook body is attacker-controllable. Both call
`verifyPayment` server-to-server and only an explicit paid answer creates
anything. A forged webhook claiming `status: successful` was tested and
correctly refused.

`lib/business/activate.ts` is the **only** function that turns a registration
into an account, called by the return page, the webhook and the admin confirm.
It is idempotent by conditional `updateMany` — the redirect and the webhook
race each other constantly, and a `findUnique` then `update` would let both
through and make two accounts for one payment.

`/business/register/return` renders `PaymentSuccess` once a registration is
active: a tick that draws itself, then a visible countdown to `/login` with the
email prefilled. The auto-redirect follows three rules, because a page that
moves on its own is hostile if it breaks any of them — the countdown is
visible, there is a button to go immediately, and the destination is a real
link so it works without JavaScript. `prefers-reduced-motion` gets the finished
tick rather than a shorter animation.

**Still to do:** nobody has completed an actual test payment through the hosted
checkout, so the paid branch of `verify` is unexercised. Set
`RWANDAPAY_WEBHOOK_SECRET` and `PUBLIC_SITE_URL` before production — webhooks
cannot reach localhost.

### Paid sign-ups no longer hand out accounts
**The hole:** `registerBusinessAction` read the plan off a dropdown and created
a live User + Business with it. Picking "Top" gave somebody the verified tick
and the Recommended slot for free — the entire paid product, to anyone who
could type.

**The fix**, in `lib/actions/business.ts`:
- **Free** still creates the account, the business and the membership in one
  transaction and signs the person in. Nothing is owed.
- **Checked and Top create nothing.** They write a `BusinessRegistration`
  (`awaiting_payment`) holding the form plus a bcrypt hash of the chosen
  password, and hand back a payment reference. No User, no Business, no login.
- `decideRegistrationAction` in `app/admin/(dash)/businesses/actions.ts` is the
  only path that turns one into an account, and it creates the Business
  `verified` in the same transaction. ADMIN only — confirming a payment is a
  financial assertion.

**There is no payment provider.** `lib/business/payments.ts` is the honest
version: the payer sends mobile money quoting the reference, and staff match it
on `/admin/businesses`, where the queue sits above the account list. That needs
no merchant account and is how a lot of Rwandan business already works. The
seam is documented in that file — a provider webhook calls the same confirm
path, and `reference` becomes its transaction id. `TEMBERA_MOMO_NUMBER` and
`TEMBERA_MOMO_NAME` are read as a pair; with neither set the screen says it
will email the number rather than inventing one.

**The verified tick** is `Place.verified`, derived in `lib/data/places.ts` from
two facts that must both hold: the owning business is `verified` AND its plan
has `verifiedTick`. It is stripped from sensitive categories at the source
alongside ratings and prices — a tick on a memorial is promotion.

**`/business` and `/business/pricing` now `permanentRedirect` to
`/business/register`,** which is a four-step flow (benefits → plans → details →
payment; free skips the last) living in the `(business)` route group so it has
no desktop rail and no tab bar. Two pages arguing the same case, one of which
you had to leave to act, was a leak.

Verified end to end: a Checked sign-up produced a registration row with no user
and no business, sign-in with those details was refused, the admin confirm
created a BUSINESS user and a `verified` business in one go, and the tick then
rendered on that business's listing but not on a memorial or an unowned place.

### The admin dashboard was rebuilt
Four things were actually wrong, all in `app/admin/(dash)/page.tsx` and
`app/admin/admin.css`:

- `.a-stats` was `repeat(6, 1fr)` while every row on the dashboard holds four
  cards, so two columns' worth of screen sat empty to the right of each row.
  Column counts are declared per row now (`.a-stats--4`).
- Eight identically-weighted cards said nothing about where to start. The four
  queues (`Stat attention`) now tint when they hold work and recede at zero;
  the four catalogue counts moved to a quiet `CountStrip` at the bottom.
- `.a-cols` split 1.6/1, which stranded a two-item queue beside a taller
  column with the screen empty underneath. `.a-cols--even` puts Awaiting review
  and Recent activity side by side at equal weight.
- Below 600px `.a-stats` collapsed to one column, turning four short numbers
  into four full-width cards. Two per row now.

Also: form labels (`.a-label`) and stat labels are sentence case — uppercase is
kept only for table column headers, where it is structure rather than prose;
`.a-hint` help text was the smallest size in the palest ink, and is now
readable; the sparkline dropped from 140px to 56px and moved into the panel it
describes.

### Maps need no API key
`/map`, `/navigate/[id]` and the place-page map all draw with **Leaflet over
OpenStreetMap tiles**, and routing comes from the public **OSRM** server. There
is no Google Maps key anywhere, `NEXT_PUBLIC_GOOGLE_MAPS_KEY` is gone from
`.env.example` and the README, and the "Map view isn't switched on" /
"key was rejected" product states are deleted — they cannot happen.

Before this gets busy, **move the tiles off OSM's donated infrastructure**:
their usage policy is written for modest traffic. It is a one-line change to
`TILE_URL` in `components/map/rwandaMap.ts` (MapTiler, Thunderforest, Stadia,
or self-hosted). Nothing else has to change.

This also settles the long-standing "the Google Maps key is in git history and
must be revoked" item: the key is no longer used by anything, so revoking it
now costs nothing. **It still has to be revoked.**

### Never build into `.next` while a dev server is up
`scripts/serve.sh` builds into **`.next-serve`** (`NEXT_DIST_DIR`, read by
`next.config.mjs`). It used to share `.next` with `npm run dev`, which broke a
running dev server in a way that looks nothing like a build problem: the dev
server keeps its old routing manifest and server-action ids in memory while
serving freshly built client chunks off disk, so the browser reports

  - `Server Action "60de…" was not found on the server`
  - a 404 on a route that plainly exists
  - `Failed to read a RSC payload created by a development version of React on
    the server while using a production version on the client`

Three errors, all of which read as application bugs, none of which are. If you
see any of them, check whether two servers are sharing a build directory before
touching the code.

Its process cleanup also silently did nothing: `wmic` no longer ships on
current Windows and a `tr -d ''` typo was a no-op, so every run leaked a server.
Thirty-two had accumulated. It uses PowerShell now and matches only its own
processes.

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
- `/place/[id]` rebuilt as a full profile: hero, hours, map, why-visit.
- Semantic per-category pricing; the universal "$12,000 per night" is gone.
- Form feedback that names the bad fields and keeps what was typed.
- Business accounts, submissions and the third dashboard.
- Admin CMS writes with an audit trail; archive instead of delete.
- Auth.js v5, four roles, and the admin door closed.
- Catalog reads from Postgres; `catalog.ts` demoted to seed-only input.
- Schema, Neon client and the guarded one-way seed; 495 ids frozen.
- Bookings and experiences removed from the product entirely.
- Backend stripped to a static build (preserved on `static-fallback`).
