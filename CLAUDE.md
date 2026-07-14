# Project context for Claude Code

This is **RFI Log** (renamed from "Site Log"), an RFI tracker for construction administration teams. The UI is RFIs-only: Submittals and Change Orders still exist in the database schema and `lib/` logic but were removed from the UI after industry feedback — do not resurface them without asking.

Read `SPEC.md` for data model, routes, and business logic before making changes. `PRD.md` is the original product vision (pre-rename, three-entity scope) — treat it as historical context, not current scope.

**Stack:** Next.js (App Router) + TypeScript + Tailwind CSS v4 + Supabase (Postgres + Auth via `@supabase/ssr`) + `@react-pdf/renderer` (server-rendered PDF report) + SheetJS `xlsx` (spreadsheet import/export; installed from the SheetJS CDN tarball — the npm `xlsx` package is frozen with known CVEs).

**Current features:** public landing at `/`; email/password auth (all other routes gated by `middleware.ts`, sign-out in the sidebar); multi-project portfolio; RFI CRUD with contractor dropdown (Contractor 1–5 + "Other" free text) and optional Design Package / Blue Bin Section links; overview dashboard; client-ready PDF report (`/projects/[id]/report`); CSV/XLSX export and validated, additive spreadsheet import (`/projects/[id]/export`).

**Auth/RLS:** any authenticated user has full read/write on all data (no owner isolation, no roles — deliberate for this phase). RLS denies anonymous access entirely.

**Deployment:** Vercel (auto-deploy from `main`). Supabase migrations are applied automatically on push via the GitHub integration — **never run `supabase db push` manually against production**; just commit the migration file and push.

Keep the existing visual style: dark theme, blueprint-blue accent (#4FA6D8), "stamp" style status badges — see the `site-log-design` skill before touching any UI.
