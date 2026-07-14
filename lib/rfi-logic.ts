import type { Rfi, RfiStatus } from "./types";

// Linear status path for MVP (SPEC.md §4): open → in_review → answered → closed
export const RFI_STATUS_FLOW: RfiStatus[] = [
  "open",
  "in_review",
  "answered",
  "closed",
];

export const RFI_CLOSED_STATES: RfiStatus[] = ["answered", "closed"];

export const RFI_STATUS_LABELS: Record<RfiStatus, string> = {
  open: "Open",
  in_review: "In review",
  answered: "Answered",
  closed: "Closed",
};

// Sentinel value for the form's contractor dropdown that reveals the
// free-text "Other" input.
export const OTHER_CONTRACTOR = "__other__";

export const RFI_CONTRACTORS = [
  "Contractor 1",
  "Contractor 2",
  "Contractor 3",
  "Contractor 4",
  "Contractor 5",
];

export const RFI_DISCIPLINES = [
  "Structural",
  "Mechanical",
  "Electrical",
  "Architecture",
  "Civil",
  "Survey",
  "PM / General",
];

export { todayISO, daysBetween } from "./dates";
import { todayISO, daysBetween } from "./dates";

export function isClosedState(status: RfiStatus): boolean {
  return RFI_CLOSED_STATES.includes(status);
}

/** SPEC.md §2: days_open = today − date_submitted, only while not answered/closed. */
export function rfiDaysOpen(
  rfi: Pick<Rfi, "status" | "date_submitted">,
  today: string = todayISO(),
): number | null {
  if (isClosedState(rfi.status)) return null;
  return Math.max(0, daysBetween(rfi.date_submitted, today));
}

/** SPEC.md §4: is_overdue = due_date < today AND status not in (answered, closed). */
export function rfiIsOverdue(
  rfi: Pick<Rfi, "status" | "due_date">,
  today: string = todayISO(),
): boolean {
  return !isClosedState(rfi.status) && rfi.due_date < today;
}

export type RfiDisplayStatus = RfiStatus | "overdue";

/** Overdue is derived, not stored — it overrides the stored status for display,
 *  matching the mockup (an overdue "open" RFI shows the OVERDUE stamp). */
export function rfiDisplayStatus(
  rfi: Pick<Rfi, "status" | "due_date">,
  today: string = todayISO(),
): RfiDisplayStatus {
  return rfiIsOverdue(rfi, today) ? "overdue" : rfi.status;
}
