import type { ChangeOrderStatus } from "./types";

// Linear path for MVP (SPEC.md §4): draft → submitted → under_review →
// approved (or rejected).
export const CHANGE_ORDER_STATUS_FLOW: ChangeOrderStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
];

export const CHANGE_ORDER_RESOLVED_STATES: ChangeOrderStatus[] = [
  "approved",
  "rejected",
];

export const CHANGE_ORDER_STATUS_LABELS: Record<ChangeOrderStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
};

export function isResolvedChangeOrder(status: ChangeOrderStatus): boolean {
  return CHANGE_ORDER_RESOLVED_STATES.includes(status);
}

/** "CAD $186,400" per the mockup; cents shown only when present.
 *  Accepts string too — PostgREST may serialize numeric either way. */
export function formatCost(value: number | string | null): string {
  if (value === null || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "—";
  const decimals = Number.isInteger(n) ? 0 : 2;
  return `CAD $${n.toLocaleString("en-CA", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
