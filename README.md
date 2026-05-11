# Beauty Connect

Beauty Connect is a mobile-first beauty workforce platform where salon owners can discover verified professionals and request complete beauty teams by role, experience, and availability.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn-style UI primitives
- Framer Motion
- Supabase-ready schema and client helpers

## Included V1 surfaces

- `/`
- `/workers`
- `/workers/[id]`
- `/team-builder`
- `/admin`
- `/admin/workers`
- `/admin/team-requests`

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment placeholders from `.env.example` and add your Supabase values.

3. Start the development server:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

## Supabase setup

- Schema: `supabase/schema.sql`
- Starter seed data: `supabase/seed.sql`
- Browser/server helpers: `src/lib/supabase`

The UI works out of the box with normalized seeded mock data in `src/lib/mock-data.ts`, so you can iterate on the product before wiring live tables and storage.

## Admin access

- Bootstrap admin emails live in `supabase/seed.sql` under `public.admin_email_whitelist`.
- After signing in, assign or deactivate admins from `/admin/admins`.
- `ADMIN_BOOTSTRAP_EMAILS` can hold comma-separated emergency admin emails for first access.
- Set `SUPABASE_SERVICE_ROLE_KEY` on the server/Vercel so admin whitelist reads and writes do not depend on public table permissions.
- Admin login uses Supabase magic links, so `NEXT_PUBLIC_APP_URL` must match the deployed URL allowed in Supabase Auth redirect settings.

## Project structure

- `src/app`: route segments and page entry points
- `src/components`: reusable layout, admin, team-builder, worker, and UI pieces
- `src/lib`: types, seed data, selectors, utilities, and Supabase helpers
- `supabase`: SQL schema and starter seed script

## Verification

Run these before deployment:

```bash
npm run lint
npm run build
```
