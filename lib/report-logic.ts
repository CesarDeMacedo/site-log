import { todayISO } from "./dates";
import { rfiDisplayStatus, type RfiDisplayStatus } from "./rfi-logic";
import type { Rfi } from "./types";

export const REPORT_STATUS_ORDER: RfiDisplayStatus[] = [
  "open",
  "in_review",
  "overdue",
  "answered",
  "closed",
];

/** Counts per display status (overdue is derived and overrides the stored
 *  status, matching the dashboard/log views). */
export function rfiStatusBreakdown(
  rfis: Pick<Rfi, "status" | "due_date">[],
  today: string = todayISO(),
): Record<RfiDisplayStatus, number> {
  const counts: Record<RfiDisplayStatus, number> = {
    open: 0,
    in_review: 0,
    overdue: 0,
    answered: 0,
    closed: 0,
  };
  for (const rfi of rfis) counts[rfiDisplayStatus(rfi, today)] += 1;
  return counts;
}

/** "{project-name}-RFI-Report-{yyyy-mm-dd}.pdf", with the name slugified so
 *  the filename is safe in Content-Disposition and on every OS. */
export function reportFilename(
  projectName: string,
  today: string = todayISO(),
): string {
  const slug =
    projectName
      .normalize("NFD")
      // strip combining diacritics left over from NFD (é -> e)
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "project";
  return `${slug}-RFI-Report-${today}.pdf`;
}
