# Tembera — Visit Rwanda

A tourism directory for Rwanda: a searchable, map-aware catalog of places
(dining, stays, health, worship, nature, transport and more), with saved and
visited history, a trip-booking screen, and a full admin dashboard. Built on
**Next.js 15 (App Router) + TypeScript**.

> **This build has no backend.** There is no database, no accounts and no
> sessions. Everything the public site shows comes from a static dataset
> committed to the repo, so it deploys to Vercel with no environment variables
> and nothing to provision. The account and admin screens are kept as finished
> UI — see [What is and isn't wired](#what-is-and-isnt-wired).

## Stack

- **Next.js 15** — App Router, React 19, server components
- **TypeScript** (strict)
- **zod** for form validation
- Bootstrap 5 grid/utilities + the app's own CSS

## Architecture

The catalog is a static dataset. `lib/places/sources/*` holds the raw data,
`lib/places/catalog.ts` assembles it into one `Place[]`, and `lib/data/*` is
the async read layer every screen calls. That layer is deliberately still
`async` and still shaped like a repository, so a real backend can be dropped in
behind it without touching a single screen.

The domain logic — search, ranking, geo grouping — is pure and data-agnostic:
it takes places as an argument and returns places, which is why it is unit
tested without a database or a server.

```
app/
  (site)/            Public app shell (nav, providers) + screens
    page.tsx         Home — categories, near-you, top-rated, featured
    c/[category]/    Category browser (filter by subcategory)
    city/[city]/     City browser
    place/[id]/      Place detail
    search/ map/ explore/ saved/ profile/ settings/
    login/ register/ Account screens — UI only, see below
    booking/         Trip booking screen — UI only, see below
  admin/             Admin dashboard: read-only in this build
  api/
    nearby/          Distance-ranked places for a coordinate
    place-image/[id] Serves the catalog's inline (data-URI) images
components/          UI + app shell + screens (client)
lib/
  auth.ts            Stub: always "signed out". No sessions exist.
  data/              The async read layer over the static catalog
  actions/           Server actions — validate, then decline to write
  admin/
    placeholder.ts   Sample rows for the admin screens
    readonly.ts      The one message every admin write returns
  client/            Client context providers (categories, saved, visited,
                     account, location) — localStorage-backed
  places/
    types.ts         The single Place shape every screen renders
    engine.ts        Pure logic: search index, ranking, summaries, geo grouping
    geo.ts search.ts District centres + query parsing/search
    catalog.ts       Assembles the catalog from sources/
    sources/         The datasets themselves
  rwanda/            Umuganda + public holidays, derived not stored
```

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

That is the whole setup. No database, no `.env` required, no seed step.

The admin dashboard is at `/admin` and needs no sign-in — there is nothing to
sign in with, and nothing behind it to protect.

### Optional environment variables

| Variable                | Effect when unset                              |
| ----------------------- | ---------------------------------------------- |
| `PRIVACY_CONTACT_EMAIL` | The privacy page says no address is configured  |

**There is no map key.** `/map`, `/navigate/[id]` and the map on a place page
all draw with Leaflet over OpenStreetMap tiles, and routing comes from the
public OSRM server — open data, no account, nothing to restrict or rotate.

Before this gets busy, move the tiles off OSM's donated infrastructure: their
usage policy is written for modest traffic. Point `TILE_URL` in
`components/map/rwandaMap.ts` at a paid host (MapTiler, Thunderforest, Stadia)
or your own; nothing else changes.

## What is and isn't wired

**Fully working**, with no backend needed:

- The whole public catalog: browse, search, filter, map, place detail, nearby
- **Saved and visited places** — these live in `localStorage`, per browser
- The Rwandan calendar and closure warnings, which are *calculated*, not stored

**UI only.** These screens are finished and render exactly as designed, but
every write validates its input and then stops, telling the user plainly that
nothing was saved:

- Sign in, register, profile, settings, and posting a review
- Booking a trip
- Every admin create/edit/delete
- Admin sign-in — `/admin` is simply open

**Sample data.** Admin screens with no static source (users, bookings,
reports, reviews, submissions, businesses, activity) render hardcoded rows from
`lib/admin/placeholder.ts`. Each one shows a `<SampleNotice>` so the figures are
never mistaken for live ones.

### Putting a backend back

The seams are deliberate and small:

1. `lib/data/*` — replace the function bodies. Signatures already return
   promises, so no screen changes.
2. `lib/auth.ts` — return a real user from `getCurrentUser()`. The `User`
   interface is already the shape the app shell consumes.
3. `lib/actions/*` and `app/**/actions.ts` — replace the bodies that currently
   return `READ_ONLY_MESSAGE`. The forms, validation schemas, error styling and
   pending states are all already wired.
4. **Put the admin guard back in `app/admin/(dash)/layout.tsx`** — one place
   covers the whole dashboard. Until then `/admin` is public.

## Scripts

| Script              | Purpose                                 |
| ------------------- | --------------------------------------- |
| `npm run dev`       | Dev server                              |
| `npm run build`     | Production build                        |
| `npm run start`     | Serve the production build              |
| `npm run lint`      | ESLint                                  |
| `npm run typecheck` | `tsc --noEmit`                          |
| `npm test`          | Unit tests (`node:test`, no extra deps) |

## Testing

```bash
npm test    # 112 unit tests — pure logic, no database, no server, ~1s
```

`tests/` covers `lib/places/engine.ts`, `search.ts`, `geo.ts` and the Rwandan
calendar. These take their data as arguments, so they need no fixtures.

CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests, a build, an
`npm audit`, and a scan for committed API keys — on every push and PR, plus
weekly so dependency rot surfaces on its own.

## Notes

- The `legacy/` folder holds the original PHP app for reference only.
- `/admin` is unauthenticated in this build. It exposes only sample data and
  the public catalog, and can change nothing — but it must be closed before any
  real deployment.
