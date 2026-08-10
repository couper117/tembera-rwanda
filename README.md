# NGA Tourism Project — Visit Rwanda / Tembera

A tourism guide for Rwanda, migrated from a PHP + MySQL app to **Next.js (App
Router) + TypeScript + Prisma + PostgreSQL**.

## Stack

- **Next.js 15** (App Router, React 19, server components + server actions)
- **TypeScript** (strict)
- **Prisma ORM** → **PostgreSQL**
- Bootstrap 5 grid/utilities + the original custom CSS (under `public/assets/css`)

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment** — copy the example and fill in your values:

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL` — your Postgres connection string
   - `ADMIN_SESSION_SECRET` — a long random string (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `NEXT_PUBLIC_GOOGLE_MAPS_KEY` — optional, enables the live map on `/map`

3. **Create the schema and seed data**

   ```bash
   npm run db:push     # push the Prisma schema to Postgres
   npm run db:seed     # seed homepage categories + a default admin user
   ```

   The seed creates an admin login: `admin@visitrwanda.local` / `changeme123`
   — **change this password after first login.**

4. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

## Scripts

| Script            | Purpose                                    |
| ----------------- | ------------------------------------------ |
| `npm run dev`     | Start the dev server                       |
| `npm run build`   | Production build (runs `prisma generate`)  |
| `npm run start`   | Serve the production build                 |
| `npm run lint`    | ESLint                                     |
| `npm run db:push` | Push schema to the database                |
| `npm run db:migrate` | Create/apply a dev migration            |
| `npm run db:seed` | Seed categories + default admin            |
| `npm run db:studio` | Open Prisma Studio                       |

## Project structure

```
app/
  layout.tsx            Root layout (html/body, global CSS, FontAwesome)
  (site)/               Public pages — share Nav / Footer / Preloader
    layout.tsx
    page.tsx            Home (category grid is DB-driven)
    historics/  homes/  churches/  restaurants/  gyms/
    wonders/  map/  shops/  playground/  about/  booking/
  admin/                Admin dashboard (outside the public chrome)
    page.tsx            CRUD for travel categories (auth-guarded)
    login/page.tsx
    actions.ts          Server actions (login, logout, save/delete category)
  not-found.tsx         404 (replaces legacy error.php)
components/             Nav, Footer, Preloader
lib/                    prisma.ts (client singleton), auth.ts (session)
prisma/                 schema.prisma, seed.ts
public/                 Static assets (CSS, JS, images, bootstrap, uploads)
legacy/                 The original PHP app, kept for reference only
```

## Notes on the migration

The following problems in the original PHP were fixed during the port:

- **Leaked DB credentials** — the old `include/db_connect.php` committed a live
  MySQL username/password. Credentials now live only in `.env` (gitignored).
  **The old InfinityFree DB password should be rotated.**
- **SQL injection** — `admin.php` concatenated `$_POST`/`$_GET` straight into
  queries. All DB access now goes through Prisma with parameterized queries.
- **No admin auth** — the admin panel was fully public. It now requires a
  hashed-password login with a signed, httpOnly session cookie.
- **Arbitrary `.php` file generation / deletion (RCE)** — saving a category used
  to write and `unlink` `.php` files on disk from user input. Removed entirely;
  categories are plain database rows and the homepage renders them dynamically.
- **Hard-coded Google Maps key** — moved to `NEXT_PUBLIC_GOOGLE_MAPS_KEY`. The
  old key should be revoked.
- **Broken/typo'd links** — `restuarants` → `/restaurants`, `book.php` →
  `/booking`, footer `.html` links repointed to real routes.

The `legacy/` folder contains the original PHP for reference and can be deleted
once you're satisfied with the port.
