# RFI Log — Construction Administration Tracker

Simple, direct RFI tracking for construction administration teams: numbered RFIs with automatic days-open/overdue tracking, contractor assignment, Design Package / Blue Bin links, client-ready PDF reports, and spreadsheet import/export — behind email/password auth.

See `PRD.md` for the original product vision and `SPEC.md` for the data model, routes, and business logic. The product was renamed from "Site Log" and narrowed to RFIs-only in the UI after industry feedback (WSP); the Submittals and Change Orders tables remain in the schema but have no UI.

**Stack:** Next.js (App Router) + TypeScript + Tailwind CSS v4 + Supabase (Postgres + Auth via `@supabase/ssr`) + `@react-pdf/renderer` (PDF report) + SheetJS `xlsx` (spreadsheet import/export — installed from the official SheetJS CDN tarball, not the frozen npm package).

## Setup

1. **Install dependencies**

   ```sh
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier is fine).

3. **Run the migrations** (`supabase/migrations/0001…0003`, in order) — paste them into the Supabase SQL editor, or use the CLI:

   ```sh
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```

4. **Seed sample data (optional)** — paste `supabase/seed.sql` into the SQL editor. It creates a demo project and sample RFIs with dates relative to today, so the overdue logic is visible immediately.

5. **Configure auth (manual dashboard step)** — in the Supabase dashboard, go to **Authentication → Sign In / Providers → Email** and turn **off** "Confirm email". Signups then get a session immediately; with it on, users must confirm by email before signing in (the UI handles both modes, but Supabase's built-in mailer is heavily rate-limited).

6. **Configure environment** — copy `.env.example` to `.env.local` and fill in your project URL and anon key (Supabase dashboard → Project Settings → API):

   ```
   NEXT_PUBLIC_SUPABASE_URL=…
   NEXT_PUBLIC_SUPABASE_ANON_KEY=…
   ```

   These two are also all the auth needs — the session lives in cookies managed by `@supabase/ssr`.

7. **Run**

   ```sh
   npm run dev
   ```

   Open http://localhost:3000 — public landing page; create an account at `/signup` and you land in `/projects`.

## What's implemented

- **Public landing page** at `/` (product pitch, sign-in CTA); everything else requires a session — `middleware.ts` redirects anonymous requests to `/login`
- **Auth**: email + password signup/login (Supabase Auth), sign-out in the sidebar, authenticated-only RLS on every table (any signed-in user has full access — no per-owner isolation yet)
- **Multi-project**: `/projects` portfolio list + create form, per-project routes, sidebar project selector
- **RFI Log** (`/projects/[id]/rfis`): full CRUD with filter tabs, per-project auto-numbering (RFI-119, …), automatic days-open/overdue, contractor dropdown (Contractor 1–5 + free-text "Other"), and optional Design Package / Blue Bin Section links shown in the log and edit modal
- **Overview dashboard** (`/projects/[id]`): RFI KPIs, log preview, Recent Activity (DB-trigger powered), Upcoming Deadlines, and the **Export Report** button
- **PDF report** (`/projects/[id]/report`): client-ready A4 landscape report — summary stat boxes, status breakdown, full RFI table with clickable links — rendered server-side with `@react-pdf/renderer`
- **Export / Import / Share** (`/projects/[id]/export`): CSV and XLSX downloads of the RFI log (derived days-open/overdue columns included) and **spreadsheet import** — upload `.xlsx`/`.csv` in the export format, get a per-row validation preview (errors, duplicates), and confirm before anything is written; imports are additive and never overwrite existing RFIs

Submittals and Change Orders: schema, triggers, and `lib/` logic are still in place, but the UI (routes, nav, dashboard cards, exports) was removed — re-enabling them is a UI-only task.

## End-to-end test

`scripts/e2e-multiproject.mjs` predates the auth phase and the RFIs-only UI (it still visits `/submittals` and `/change-orders` and assumes no login), so it is currently **stale** — kept for reference until it's rewritten.

## Deployment

Production runs on Vercel at **https://site-log-sage.vercel.app**, auto-deployed from pushes to `main`. Supabase migrations are also applied automatically on push via the Supabase GitHub integration — **do not run `supabase db push` manually against production**.

## Known limitations

- **Open signup, shared data**: anyone with the URL can create an account, and every authenticated user sees and edits all projects (no owner column, no invites, no roles — deliberate for the current evaluation phase; revisit before real client data goes in).
- No password recovery yet (future phase).
- Timestamps and "days open" are computed with the server clock (UTC on Vercel), so values near midnight can differ by one day from a viewer's local timezone.

## Phase history

1. **MVP (Site Log)** — scaffold, schema, RFI/Submittal/Change Order CRUD, dashboard, CSV export, multi-project
2. **WSP feedback round** — renamed to RFI Log, Submittals/Change Orders hidden from UI, contractor dropdown, Design Package / Blue Bin links (migration 0002)
3. **Product round** — PDF report, XLSX export + validated spreadsheet import, public landing page, Supabase Auth + authenticated-only RLS (migration 0003)
