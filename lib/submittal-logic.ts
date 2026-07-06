import type { Submittal, SubmittalStatus } from "./types";
import { todayISO } from "./dates";

// Linear path for MVP (SPEC.md §4): open → in_review → approved,
// or rejected (which loops back to open on resubmission).
export const SUBMITTAL_STATUS_FLOW: SubmittalStatus[] = [
  "open",
  "in_review",
  "approved",
  "rejected",
];

// Both end the current review cycle — no longer awaiting review action.
export const SUBMITTAL_RESOLVED_STATES: SubmittalStatus[] = [
  "approved",
  "rejected",
];

export const SUBMITTAL_STATUS_LABELS: Record<SubmittalStatus, string> = {
  open: "Open",
  in_review: "In review",
  approved: "Approved",
  rejected: "Rejected",
};

export function isResolvedSubmittal(status: SubmittalStatus): boolean {
  return SUBMITTAL_RESOLVED_STATES.includes(status);
}

/** SPEC.md §4: is_overdue = due_date < today AND status not in (closed states). */
export function submittalIsOverdue(
  submittal: Pick<Submittal, "status" | "due_date">,
  today: string = todayISO(),
): boolean {
  return !isResolvedSubmittal(submittal.status) && submittal.due_date < today;
}

export type SubmittalDisplayStatus = SubmittalStatus | "overdue";

/** Overdue is derived and overrides the stored status for display, like RFIs. */
export function submittalDisplayStatus(
  submittal: Pick<Submittal, "status" | "due_date">,
  today: string = todayISO(),
): SubmittalDisplayStatus {
  return submittalIsOverdue(submittal, today) ? "overdue" : submittal.status;
}

/** Review progress as 0–100, clamped so bad data can't break the bar. */
export function reviewProgressPercent(step: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((step / total) * 100)));
}
