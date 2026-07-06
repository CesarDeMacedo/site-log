# Site Log — Construction Administration Tracker

Track RFIs, Submittals, and Change Orders on a construction project. See `PRD.md` for product scope and `SPEC.md` for the data model and business logic.

**Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + Supabase.

## Setup

1. **Install dependencies**

   ```sh
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier is fine).

3. **Run the schema migration** — either paste `supabase/migrations/0001_initial_schema.sql` into the Supabase SQL editor, or use the CLI:

   ```sh
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```

4. **Seed sample data (optional but recommended)** — paste `supabase/seed.sql` into the SQL editor. It creates the demo project and sample RFIs/Submittals/Change Orders with dates relative to today, so the overdue logic is visible immediately.

5. **Configure environment** — copy `.env.example` to `.env.local` and fill in your project URL and anon key (Supabase dashboard → Project Settings → API).

6. **Run**

   ```sh
   npm run dev
   ```

   Open http://localhost:3000/rfis.

## What's implemented so far

- Full scaffold (Next.js App Router, Tailwind v4 design tokens, Supabase client)
- Database schema as a reproducible SQL migration, with triggers for per-project auto-numbering (RFI-119, SUB-043, …), `updated_at` maintenance, and the activity log
- `/rfis` — full RFI CRUD: create, list with filter tabs (All / Open / Overdue / Closed), edit, and status updates, with automatic days-open and overdue calculation
- `/submittals` — full Submittal CRUD with review-step progress (e.g. 2/3), overdue calculation, and auto-numbering (SUB-XXX)
- `/change-orders` — full Change Order CRUD with estimated cost (CAD) and auto-numbering (PCO-XXX)
- Multi-project support: `/projects` portfolio list + create form, per-project routes (`/projects/[projectId]/...`), and a sidebar project selector that preserves the current screen when switching
- `/projects/[projectId]` — Overview dashboard: KPI cards, log previews, Recent Activity, Upcoming Deadlines
- `/projects/[projectId]/export` — on-demand CSV downloads of the project's logs, with derived days-open/overdue columns

## End-to-end test

`scripts/e2e-multiproject.mjs` drives the running app (port 3789) with Playwright against the system Edge browser and verifies project creation, per-project numbering, and data isolation across all screens:

```sh
npm run start -- -p 3789   # in one terminal
node scripts/e2e-multiproject.mjs
```

## Deployment

Production runs on Vercel at **https://site-log-sage.vercel.app**, auto-deployed from pushes to `main`. Supabase migrations are also applied automatically on push via the Supabase GitHub integration — do not run `supabase db push` manually against production.

## Known limitations (accepted for the seed-data demo)

- **No auth + permissive RLS**: the MVP has no login (per SPEC §5), and all tables have permissive Row Level Security policies for the `anon` key — anyone with the public URL can read *and write* all data. This is acceptable for a portfolio demo running seed data, but **must be revisited (real auth + owner-scoped RLS policies) before any real client data goes in**.
- Timestamps and "days open" are computed with the server clock (UTC on Vercel), so values near midnight can differ by one day from a viewer's local timezone.

## Build order (SPEC.md §6)

1. ✅ Scaffold + Supabase connection
2. ✅ Schema migration
3. ✅ RFI Log (validates the pattern)
4. ✅ Submittal Log and Change Order Log
5. ✅ Overview dashboard
6. ✅ CSV export (⬜ spreadsheet import — post-MVP phase next)
