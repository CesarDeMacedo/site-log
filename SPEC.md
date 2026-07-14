# Technical Spec — RFI Log: Construction Administration Tracker

Reference: see PRD.md for the original product vision (written pre-rename as "Site Log", with a three-entity scope). After industry feedback (WSP) the product was renamed **RFI Log** and the UI narrowed to RFIs only — Submittals and Change Orders remain in the schema with no UI. This document reflects the implementation as built.

## 1. Tech stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS v4
- **Database + Auth:** Supabase (Postgres; email/password auth via `@supabase/ssr` with cookie-bound sessions)
- **PDF report:** `@react-pdf/renderer` (server-side, in a route handler)
- **Spreadsheets:** SheetJS `xlsx` 0.20.x from the official SheetJS CDN tarball (the npm package is frozen at 0.18.5 with known CVEs)
- **Hosting:** Vercel (auto-deploy from `main`; Supabase GitHub integration applies migrations on push)

## 2. Data model

### `projects`
| Field | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | text | e.g. "Niagara WTP Upgrade — Phase 2" |
| general_contractor | text | |
| pm_name | text | |
| created_at | timestamptz | default now() |

### `rfis`
| Field | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| project_id | uuid, FK → projects.id | |
| rfi_number | text | e.g. "RFI-118" — auto-increment per project on insert |
| description | text | |
| discipline | text | e.g. Structural, Mechanical, Electrical, Architecture, Survey |
| contractor | text | dropdown "Contractor 1"–"Contractor 5" or free-text custom name (renamed from assigned_to in migration 0002) |
| link_design_package | text, nullable | optional http(s) URL |
| link_blue_bin_section | text, nullable | optional http(s) URL |
| date_submitted | date | |
| due_date | date | |
| date_answered | date, nullable | |
| status | enum | `open`, `in_review`, `answered`, `closed` |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now(), update on change |

**Derived (not stored):** `days_open` = today − date_submitted (if not closed/answered). `is_overdue` = status not in (`answered`,`closed`) AND due_date < today.

### `submittals` and `change_orders` (schema only — no UI)

Both tables, their triggers (auto-numbering, activity log), and the `lib/` logic remain in place, but every UI surface (routes, nav, dashboard cards, exports) was removed in the RFI-only refocus. Re-enabling them is a UI-only task.

### `submittals`
| Field | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| project_id | uuid, FK | |
| submittal_number | text | e.g. "SUB-042" |
| item | text | description of item |
| supplier | text | |
| review_step | int | current step, e.g. 2 |
| review_steps_total | int | e.g. 3 |
| due_date | date | |
| status | enum | `open`, `in_review`, `approved`, `rejected` |
| created_at / updated_at | timestamptz | |

### `change_orders`
| Field | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| project_id | uuid, FK | |
| pco_number | text | e.g. "PCO-009" |
| description | text | |
| estimated_cost | numeric | |
| status | enum | `draft`, `submitted`, `under_review`, `approved`, `rejected` |
| created_at / updated_at | timestamptz | |

### `activity_log`
| Field | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| project_id | uuid, FK | |
| entity_type | enum | `rfi`, `submittal`, `change_order` |
| entity_id | uuid | |
| entity_label | text | e.g. "RFI-118" — denormalized for easy display |
| message | text | e.g. "status changed to Overdue" |
| created_at | timestamptz | default now() |

Populate `activity_log` via a Postgres trigger or application-level insert on every create/update to RFIs, Submittals, and Change Orders — this powers the "Recent Activity" panel without extra client logic.

## 3. Screens / routes

All routes except `/`, `/login`, and `/signup` require a session — `middleware.ts` redirects anonymous requests to `/login`. The app screens live under the `(app)` route group, which provides the sidebar layout.

| Route | Purpose |
|---|---|
| `/` | Public product landing page (hero, feature cards, sign-in CTA) |
| `/login`, `/signup` | Email/password auth (Supabase Auth); signed-in users are redirected to `/projects` |
| `/projects` | Project list ("portfolio") + create-new-project form (name, general contractor, PM name) |
| `/projects/[projectId]` | Overview dashboard — RFI KPI cards, RFI log preview, Recent Activity, Upcoming Deadlines, Export Report button |
| `/projects/[projectId]/rfis` | Full RFI Log — table with filter tabs (All / Open / Overdue / Closed), Links column, create/edit modal (contractor dropdown + URL fields) |
| `/projects/[projectId]/export` | Export / Import / Share — CSV + XLSX downloads, PDF report row, and the spreadsheet import flow (preview → confirm) |
| `/projects/[projectId]/export/rfis` | CSV download route; `?format=xlsx` for Excel |
| `/projects/[projectId]/report` | Client-ready PDF report (server-rendered) |
| `/rfis`, `/export`, … | Legacy flat routes redirect into the single project when unambiguous, else `/projects` |

A project selector in the sidebar allows switching projects from anywhere, preserving the current sub-route (e.g. switching projects while on the RFI Log lands on the other project's RFI Log). Every entity query filters by the `projectId` from the URL — data from different projects must never mix.

## 3b. Spreadsheet import (RFI Log)

Two-phase approach:

**Phase 1 — fixed-format import (✅ implemented, RFIs only):**
- The import format is the export format: the same headers the CSV/XLSX export produces (derived columns like "Days Open" are accepted and ignored), so a downloaded export is the template.
- Upload on `/projects/[projectId]/export` ("Import RFIs" card, `.xlsx` or `.csv`).
- Parsed and validated **server-side** (SheetJS in a server action — `lib/import-logic.ts`): required fields, valid dates (ISO strings or Excel date cells), valid status (label or key), http(s) links, duplicate RFI numbers against the project and within the file. Per-row preview (valid / error / duplicate) before anything is written.
- On explicit confirm, rows are re-validated server-side and bulk-inserted. Imports are additive — duplicates are skipped, never overwritten. Limits: 2 MB, 500 rows.

**Phase 2 (post-MVP) — flexible column mapping:**
- User uploads their own spreadsheet as-is, with whatever column headers they already use.
- Read the header row, and use an LLM call (Claude) to propose a mapping from their columns to our schema fields (e.g. "Data Envio" → `date_submitted`).
- Show the proposed mapping to the user for confirmation/correction before import — never auto-commit an unconfirmed mapping.
- Reuse the same validation and bulk-insert logic from Phase 1 once mapping is confirmed.

Do not build Phase 2 until Phase 1 (manual CRUD + fixed-template import) is working end-to-end.

## 4. Business logic notes

- **Overdue calculation:** compute server-side (or in a shared utility function) so it's consistent everywhere: `is_overdue = due_date < today AND status NOT IN (closed_states for that entity)`.
- **RFI/Submittal/PCO numbering:** auto-generate the next number per project (e.g. `RFI-119`) on insert — don't require the user to type it manually.
- **Status transitions:** simple linear paths (no workflow engine):
  - RFI: `open → in_review → answered → closed`
  - Submittal / Change Order: enums remain in the schema but have no UI (see §2)

## 5. Non-functional requirements

- Responsive down to tablet width at minimum (construction PMs often use tablets on site); mobile-friendly is a bonus, not required for MVP.
- Auth: Supabase Auth with email + password (migration 0003). All app routes require a session (middleware redirects to /login); the landing page is public. RLS policies allow any authenticated user full read/write — no per-owner isolation, no roles, and signup is open to anyone with the URL (invites/password recovery are a future phase). "Confirm email" should be disabled in the Supabase dashboard (manual step; the signup UI handles both modes).
- Keep the visual language from the existing mockup (dark theme, blueprint-blue accent, "stamp" style status badges) — this is already validated and should carry into the real build.

## 6. Build history

1. ✅ Scaffold + Supabase connection, schema migration (0001), RFI/Submittal/Change Order CRUD, Overview dashboard, CSV export, multi-project support
2. ✅ WSP feedback round: rename to RFI Log, Submittals/Change Orders removed from UI, contractor dropdown + Design Package / Blue Bin links (migration 0002)
3. ✅ Product round: PDF report, XLSX export + validated spreadsheet import, public landing page, Supabase Auth + authenticated-only RLS (migration 0003)

## 7. `CLAUDE.md`

The repo-root `CLAUDE.md` is the maintained version of the agent context (the draft that used to live here is superseded).
