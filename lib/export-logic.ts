import type { CsvValue } from "./csv";
import { todayISO } from "./dates";
import { CHANGE_ORDER_STATUS_LABELS } from "./change-order-logic";
import {
  RFI_STATUS_LABELS,
  rfiDaysOpen,
  rfiIsOverdue,
} from "./rfi-logic";
import {
  SUBMITTAL_STATUS_LABELS,
  submittalIsOverdue,
} from "./submittal-logic";
import type { ChangeOrder, Rfi, Submittal } from "./types";

// Derived fields (days open, overdue) are included so an exported log is
// usable in a client update without recomputing anything (PRD G5/story 6).

export const RFI_EXPORT_HEADERS = [
  "RFI Number",
  "Description",
  "Discipline",
  "Assigned To",
  "Date Submitted",
  "Due Date",
  "Date Answered",
  "Status",
  "Days Open",
  "Overdue",
];

export function rfiExportRows(rfis: Rfi[], today: string = todayISO()): CsvValue[][] {
  return rfis.map((r) => {
    const daysOpen = rfiDaysOpen(r, today);
    return [
      r.rfi_number,
      r.description,
      r.discipline,
      r.assigned_to,
      r.date_submitted,
      r.due_date,
      r.date_answered,
      RFI_STATUS_LABELS[r.status],
      daysOpen,
      rfiIsOverdue(r, today) ? "Yes" : "No",
    ];
  });
}

export const SUBMITTAL_EXPORT_HEADERS = [
  "Submittal Number",
  "Item",
  "Supplier",
  "Review Step",
  "Total Review Steps",
  "Due Date",
  "Status",
  "Overdue",
];

export function submittalExportRows(
  submittals: Submittal[],
  today: string = todayISO(),
): CsvValue[][] {
  return submittals.map((s) => [
    s.submittal_number,
    s.item,
    s.supplier,
    s.review_step,
    s.review_steps_total,
    s.due_date,
    SUBMITTAL_STATUS_LABELS[s.status],
    submittalIsOverdue(s, today) ? "Yes" : "No",
  ]);
}

export const CHANGE_ORDER_EXPORT_HEADERS = [
  "PCO Number",
  "Description",
  "Estimated Cost (CAD)",
  "Status",
  "Created",
];

export function changeOrderExportRows(changeOrders: ChangeOrder[]): CsvValue[][] {
  return changeOrders.map((c) => [
    c.pco_number,
    c.description,
    c.estimated_cost === null ? null : Number(c.estimated_cost),
    CHANGE_ORDER_STATUS_LABELS[c.status],
    c.created_at.slice(0, 10),
  ]);
}
