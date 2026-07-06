# PRD — Site Log: Construction Administration Tracker

## 1. Summary

Site Log is a lightweight web app that helps a Construction Administration (CA) project manager track RFIs (Requests for Information), Submittals, and Change Orders (PCOs) on a construction project, with a dashboard that surfaces what's open, what's overdue, and what's coming up next.

**One sentence:** A focused, purpose-built alternative to configuring a generic spreadsheet tool for RFI/Submittal/Change Order tracking on a construction project.

## 2. Problem

Construction Administration PMs need to track RFIs, Submittals, and Change Orders throughout a project. The default tool for this (e.g. Smartsheet, Excel) is generic — it has to be configured from a template, doesn't visually surface what's overdue at a glance, and often ends up as a manually maintained spreadsheet when the "proper" tool never gets set up.

This project was inspired by a real situation: a PM was promised a configured tracking tool by her firm's internal digital team, it was never delivered, and she built her own tracking in Excel out of necessity.

## 3. Target user

**Primary persona:** Construction Administration Project Manager at an infrastructure/engineering firm (e.g. WSP), managing contract administration for one active project at a time.

Needs:
- See at a glance what's overdue and what needs attention today
- Log and update RFIs, Submittals, and Change Orders without friction
- Have something reportable/exportable for client updates

**Secondary context:** This is also a portfolio project. It needs to be demonstrably real (working CRUD, real data persistence) — not just a static mockup — because it will be shown to industry contacts and used as a hiring portfolio piece for infrastructure Digital Advisory roles.

## 4. Goals (MVP)

- G1: Create, view, edit, and update status for RFIs
- G2: Create, view, edit, and update status for Submittals
- G3: Create, view, edit, and update status for Change Orders (PCOs)
- G4: Dashboard overview showing key counts (open, overdue, in review, approved) and upcoming deadlines
- G5: Automatic "days open" / "overdue" calculation based on due dates (no manual flagging)
- G6: Support multiple projects — all tracking data (RFIs, Submittals, Change Orders, activity) is scoped to a project, and the user can create new projects and switch between them
- G7: Import existing RFI/Submittal records from a CSV/Excel file, so a user migrating from a manual spreadsheet doesn't lose their history
- G8: Project list page ("portfolio" view) with quick project switching available from anywhere in the app, preserving the current screen when switching

## 5. Non-goals (explicitly out of scope for MVP)

- Multi-user roles/permissions (MVP can be single-user or simple shared access)
- File/drawing attachments per item
- Automated email notifications
- Mobile native app (responsive web is enough)
- Integration with external systems (Procore, Autodesk Construction Cloud, etc.)
- Custom report builder (a simple export is enough for MVP)

## 6. User stories

1. As a PM, I want to add a new RFI with a description, discipline, and due date, so I can start tracking it immediately.
2. As a PM, I want to see which RFIs are overdue without having to calculate it myself.
3. As a PM, I want to update an RFI's status (Open → In Review → Answered → Closed) as it progresses.
4. As a PM, I want a dashboard that shows me, at a glance, how many items need attention today.
5. As a PM, I want to see a log of recent activity so I know what changed since I last checked.
6. As a PM, I want to export the current log (CSV or PDF) so I can share it in a client update.
7. As a PM migrating from an existing spreadsheet, I want to import my current RFI/Submittal records from a CSV/Excel file, matching the columns I already use, so I don't have to re-enter everything by hand.

## 7. Success criteria

- The app is a real working product: data persists, CRUD operations work, status/overdue logic is calculated automatically — not hardcoded/mock data.
- A non-technical PM (Thais, or someone in a similar role) can look at it and understand what it does within seconds, without explanation.
- The tool is good enough to be a credible portfolio artifact in interviews for Digital Advisory / infrastructure digital roles.

## 8. Open questions (to confirm with end user before finalizing scope)

- Exact fields needed per RFI/Submittal beyond what's in the current mockup (spec number? discipline? cost impact?)
- Whether Change Orders need their own full log view (not just a summary card) in MVP
- Whether more than one person needs to see/edit the data (shared access) in MVP, or if single-user is fine for v1
