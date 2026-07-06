# Technical Spec — Site Log: Construction Administration Tracker

Reference: see PRD.md for product context and scope. This document defines the technical implementation for the MVP.

## 1. Tech stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Database + Auth:** Supabase (Postgres)
- **Hosting:** Vercel (free tier is sufficient for MVP/portfolio use)
- **Charts (if needed for dashboard):** Recharts

Rationale: this stack has generous free tiers, is well-documented for AI coding agents (Claude Code has strong familiarity with Next.js + Supabase patterns), and matches what's covered in the vibe coding course already in progress.

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
| assigned_to | text | free text for MVP |
| date_submitted | date | |
| due_date | date | |
| date_answered | date, nullable | |
| status | enum | `open`, `in_review`, `answered`, `closed` |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now(), update on change |

**Derived (not stored):** `days_open` = today − date_submitted (if not closed/answered). `is_overdue` = status not in (`answered`,`closed`) AND due_date < today.

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

| Route | Purpose |
|---|---|
| `/` | Overview dashboard — KPI cards, RFI log preview, Submittal log preview, Recent Activity, Upcoming Deadlines |
| `/rfis` | Full RFI Log — table with filter tabs (All / Open / Overdue / Closed), create/edit modal |
| `/submittals` | Full Submittal Log — table + create/edit modal |
| `/change-orders` | Change Order log — table + create/edit modal |
| `/export` | Simple CSV export of current logs |

## 3b. Spreadsheet import (RFI Log and Submittal Log)

Two-phase approach:

**Phase 1 (MVP) — fixed-template import:**
- Provide a downloadable CSV/XLSX template matching the exact column names used in the `rfis` / `submittals` tables (see Section 2).
- User uploads a file in that format on `/rfis` or `/submittals`.
- Parse with SheetJS (`xlsx` npm package) client-side, validate rows (required fields present, valid dates, valid status values), show a preview with any rows that failed validation flagged before committing.
- On confirm, bulk-insert valid rows into Supabase.

**Phase 2 (post-MVP) — flexible column mapping:**
- User uploads their own spreadsheet as-is, with whatever column headers they already use.
- Read the header row, and use an LLM call (Claude) to propose a mapping from their columns to our schema fields (e.g. "Data Envio" → `date_submitted`).
- Show the proposed mapping to the user for confirmation/correction before import — never auto-commit an unconfirmed mapping.
- Reuse the same validation and bulk-insert logic from Phase 1 once mapping is confirmed.

Do not build Phase 2 until Phase 1 (manual CRUD + fixed-template import) is working end-to-end.

## 4. Business logic notes

- **Overdue calculation:** compute server-side (or in a shared utility function) so it's consistent everywhere: `is_overdue = due_date < today AND status NOT IN (closed_states for that entity)`.
- **RFI/Submittal/PCO numbering:** auto-generate the next number per project (e.g. `RFI-119`) on insert — don't require the user to type it manually.
- **Status transitions:** keep them simple linear paths for MVP (no complex workflow engine):
  - RFI: `open → in_review → answered → closed`
  - Submittal: `open → in_review → approved` (or `rejected`, which loops back to `open`)
  - Change Order: `draft → submitted → under_review → approved` (or `rejected`)

## 5. Non-functional requirements

- Responsive down to tablet width at minimum (construction PMs often use tablets on site); mobile-friendly is a bonus, not required for MVP.
- No auth complexity needed for MVP demo — Supabase magic-link auth or even a single shared password is enough; skip building full role-based permissions.
- Keep the visual language from the existing mockup (dark theme, blueprint-blue accent, "stamp" style status badges) — this is already validated and should carry into the real build.

## 6. Suggested build order (for Claude Code sessions)

1. Scaffold Next.js + Tailwind + Supabase connection.
2. Create Supabase tables per the schema above (as a SQL migration file, not manual dashboard clicks — keeps it reproducible).
3. Build the RFI Log page first (full CRUD) — it's the most complex entity and validates the pattern for the other two.
4. Build Submittal Log and Change Order log reusing the same patterns.
5. Build the Overview dashboard last, since it aggregates data from all three entities.
6. Add CSV export.

## 7. Suggested `CLAUDE.md` for the repo root

```markdown
# Project context for Claude Code

This is Site Log, a Construction Administration tracker (RFIs, Submittals, Change Orders).
Read PRD.md for product scope and SPEC.md for data model, routes, and business logic before making changes.
Stack: Next.js (App Router) + TypeScript + Tailwind + Supabase.
Keep the existing visual style: dark theme, blueprint-blue accent (#4FA6D8), "stamp" style status badges.
Do not add features outside PRD.md's MVP scope without asking first.
```
