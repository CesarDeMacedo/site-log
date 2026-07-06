---
name: site-log-design-system
description: Visual design system for the Site Log construction administration tracker (colors, typography, component patterns, the "stamp" status motif). Use whenever creating or editing any UI screen, component, or style in this project.
---

# Site Log — Design System

## Visual identity

Industrial / technical aesthetic inspired by blueprint drawings and engineering documentation — not a generic consumer SaaS look. This is a tool for construction administration professionals; it should read as credible and precise, not playful.

## Color tokens

```css
--bg: #0B141F;            /* app background */
--surface: #101C2C;       /* card / panel background */
--surface-2: #16243A;     /* nested surface */
--line: #223549;          /* borders, dividers */
--blueprint: #4FA6D8;     /* primary accent — links, active states, primary data */
--blueprint-dim: #2E6F9E; /* primary buttons */
--amber: #E8A23A;         /* "in review" / attention state */
--danger: #E0603F;        /* overdue / rejected */
--success: #4FB27E;       /* approved / closed positively */
--text: #E7EDF3;          /* primary text */
--muted: #7C8CA0;         /* secondary text */
--muted-2: #56687D;       /* tertiary / labels */
```

Background uses a faint blueprint-grid pattern (very low opacity repeating lines at 32px intervals) — do not remove this, it's a signature texture of the product, but keep it subtle enough not to interfere with reading data.

## Typography

- **Display / headings:** Oswald (condensed, technical, evokes stamped drawing titles) — weight 600.
- **Body text:** IBM Plex Sans.
- **Data / IDs / numbers / timestamps:** IBM Plex Mono — always use monospace for RFI numbers (e.g. "RFI-118"), dates, and quantitative values so they align visually in tables.

## Signature component: the "stamp" status badge

Status badges (Open, In Review, Overdue, Approved, Closed) are styled to look like a physical review stamp on a construction document: bordered, uppercase, condensed font, slightly rotated (-3deg), with a small solid dot before the label. This is a deliberate nod to the real-world practice of physically stamping RFIs and submittals during review. Always use this pattern for status — never a plain colored pill/badge.

```css
.stamp{
  display:inline-flex; align-items:center; gap:6px;
  font-family:'Oswald'; font-weight:600; font-size:10.5px; letter-spacing:1.4px;
  padding:4px 10px 4px 8px; border:1.5px solid currentColor; border-radius:3px;
  transform: rotate(-3deg); text-transform:uppercase;
}
.stamp::before{ content:''; width:6px; height:6px; border-radius:50%; background:currentColor; }
```

Color mapping: `open` → blueprint, `in_review` → amber, `overdue` → danger, `approved`/`answered` → success, `closed`/`rejected` → muted-2.

## Layout patterns

- Left sidebar navigation (fixed width ~232px), dark surface, grouped by section (e.g. "Project" / "Reports").
- KPI summary cards in a row at the top of dashboard-style pages: label (uppercase, small, muted) → large value (Oswald) → delta/context line (mono, small).
- Data tables: uppercase muted column headers, generous row padding (~11px vertical), subtle row hover highlight, no heavy borders — rely on faint horizontal dividers only.
- Two-column layout for dashboard-style pages: main content (tables/logs) at ~1.55fr, secondary panels (activity feed, deadlines) at 1fr.

## Component library

Build UI components on top of shadcn/ui, restyled with the tokens above — do not use shadcn's default theme as-is. Icons: Lucide (already used in the validated mockup as inline SVGs).

## What NOT to do

- Do not switch to a generic light-mode SaaS look, purple/gradient branding, or rounded "friendly" illustration style — this contradicts the technical/credible positioning of the product.
- Do not replace the stamp motif with plain colored badges/pills.
- Do not remove the monospace treatment for IDs, dates, and numeric data.
