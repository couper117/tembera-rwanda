# Tembera — Visit Rwanda

A production tourism directory for Rwanda: a searchable, map-aware catalog of
places (dining, stays, health, worship, nature, transport and more) with real
user accounts, saved/visited history, reviews, trip bookings, and a full admin
CMS. Built on **Next.js 15 (App Router) + TypeScript + Prisma + PostgreSQL**.

## Stack

- **Next.js 15** — App Router, React 19, server components + server actions
- **TypeScript** (strict)
- **Prisma ORM** → **PostgreSQL**
- **bcryptjs** for password hashing; signed, httpOnly session cookies (HMAC-SHA256)
- **zod** for input validation
- Bootstrap 5 grid/utilities + the app's own CSS

## Architecture

Nothing the UI renders is hardcoded — every listing, category, city and account
is a database row. The catalog domain logic (search, geo, ranking) is pure and
data-agnostic; the data comes from Postgres.

```
app/
  (site)/            Public app shell (nav, providers) + screens
    page.tsx         Home — DB-driven categories, near-you, top-rated, featured
    c/[category]/    Category browser (filter by subcategory)
    city/[city]/     City browser
    place/[id]/      Place detail + ratings & reviews
    search/ map/ explore/ saved/ profile/ settings/
    login/ register/ Public auth
    booking/         Trip booking (price computed server-side)
  admin/             Role-guarded CMS: places, categories, cities, bookings, users
  api/
    nearby/          Distance-ranked places for a coordinate
    place-image/[id] Serves inline (data-URI) images from the DB
components/          UI + app shell + screens (client)
lib/
  auth.ts            Sessions, password hashing, requireUser/requireAdmin
  prisma.ts          PrismaClient singleton
  data/              Server-only cached repositories (places, categories,
                     cities, user) — tag-revalidated on admin edits
  actions/           Server actions (auth, per-user state, reviews)
  client/            Client context providers (categories, saved, visited,
                     account, location) — DB-backed when signed in
  places/
    types.ts         The single Place shape every screen renders
    engine.ts        Pure logic: search index, ranking, summaries, geo grouping
    geo.ts search.ts District centres + query parsing/search
    catalog.ts       Legacy source assembly — used ONLY by the seed
    sources/         Original datasets — used ONLY by the seed
prisma/
  schema.prisma      users, categories, subcategories, cities, places,
                     saved_places, visited_places, reviews, bookings
  seed.ts            One-time migration of the original catalog into the DB
```

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start a database.** Any Postgres works. For local dev with Docker:

   ```bash
   docker run -d --name tembera-db -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_USER=postgres -e POSTGRES_DB=tourism_db \
     -p 5432:5432 postgres:16
   ```

3. **Configure environment** — copy the example and fill it in:

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL` — Postgres connection string
   - `ADMIN_SESSION_SECRET` — long random string
     (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `NEXT_PUBLIC_GOOGLE_MAPS_KEY` — optional, enables the live map

4. **Create the schema and seed the catalog**

   ```bash
   npm run db:push
   npm run db:seed
   ```

   The seed migrates the full catalog (~500 places, 16 categories, 30
   districts) into Postgres and creates the admin account:

   - **Admin:** `admin@tembera.rw`. The password is **generated and printed
     once** by the seed — save it then. Set `SEED_ADMIN_PASSWORD` (12+
     characters) beforehand to choose your own. There is deliberately no
     default password.
   - **Demo user:** only created when `SEED_DEMO_USER=true`
     (`demo@tembera.rw` / `demo12345`). Its password is published in this
     README, so it must never exist in production.

   To change a password later:

   ```bash
   npm run set-password -- admin@tembera.rw          # generates one
   npm run set-password -- admin@tembera.rw "chosen" # or set your own
   ```

   Signed-in users can also change their own password in Settings.

5. **Run**

   ```bash
   npm run dev        # http://localhost:3000
   ```

   The admin dashboard is at `/admin` (sign in with the admin account).

## Scripts

| Script                  | Purpose                                   |
| ----------------------- | ----------------------------------------- |
| `npm run dev`           | Dev server                                |
| `npm run build`         | Production build (runs `prisma generate`)  |
| `npm run start`         | Serve the production build                |
| `npm run lint`          | ESLint                                    |
| `npm run typecheck`     | `tsc --noEmit`                            |
| `npm test`              | Unit tests (`node:test`, no extra deps)   |
| `npm run db:push`       | Push schema to the database               |
| `npm run db:migrate`    | Create/apply a dev migration              |
| `npm run db:seed`       | Migrate the catalog + seed the admin      |
| `npm run db:studio`     | Prisma Studio                             |
| `npm run set-password`  | Reset any account's password from the CLI |

## Testing

```bash
npm test          # unit tests — pure logic, no database, ~1s
node scripts/e2e.cjs   # full browser pass; needs the dev server and a DB
```

`tests/` covers the pure domain layer — `lib/places/engine.ts`, `search.ts`,
`geo.ts` — and the rate limiter's counting logic. These take their data as
arguments, so the tests need neither a database nor a server. Anything needing
a real request (session cookies, `clientIp`) is covered by the e2e pass
instead.

CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests, a seeded
build against a real Postgres, an `npm audit`, and a scan for committed API
keys — on every push and PR, plus weekly so dependency rot surfaces on its own.

## Security notes

- **Sessions** are signed with HMAC-SHA256 and verified with
  `timingSafeEqual`. Expiry is enforced **server-side** from the timestamp in
  the cookie payload, not by trusting the browser to honour `maxAge`.
- **Sign-in is rate limited** per address and per account: 5 attempts per
  account per 15 minutes on both the public and admin login. The counters are
  in process memory — see the note in `lib/rate-limit-core.ts` before running
  more than one instance.
- **No default passwords.** The seed generates one and prints it once.
- `ADMIN_SESSION_SECRET` is required at runtime; the app throws without it.
- `NEXT_PUBLIC_GOOGLE_MAPS_KEY` ships to the browser by design. **Restrict it
  by HTTP referrer in the Google Cloud console** — that is its only real
  protection.

## Notes

- **Everything is editable at `/admin`** — places, the category taxonomy,
  cities/districts, bookings (status), and users (roles). Edits revalidate the
  cached data layer, so the public site reflects them on the next request.
- **User state is real** — saved places, visit history and reviews are per
  account and sync across devices. Signed-out visitors get a localStorage
  fallback so browsing still works before sign-up.
- The `legacy/` folder holds the original PHP app for reference only.
- `lib/places/catalog.ts` and `lib/places/sources/*` exist solely so the seed
  can import the original data once; they are not used at runtime.
