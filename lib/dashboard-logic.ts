import { daysBetween, todayISO } from "./dates";
import { isClosedState, rfiIsOverdue } from "./rfi-logic";
import { isResolvedSubmittal } from "./submittal-logic";
import type { ActivityEntry, Rfi, Submittal } from "./types";

/** Average days past due across currently overdue RFIs (1 decimal), or null. */
export function avgOverdueDays(
  rfis: Pick<Rfi, "status" | "due_date">[],
  today: string = todayISO(),
): number | null {
  const overdue = rfis.filter((r) => rfiIsOverdue(r, today));
  if (overdue.length === 0) return null;
  const total = overdue.reduce((sum, r) => sum + daysBetween(r.due_date, today), 0);
  return Math.round((total / overdue.length) * 10) / 10;
}

/** Days until the nearest upcoming due date among unresolved submittals, or null. */
export function nextSubmittalDeadlineDays(
  submittals: Pick<Submittal, "status" | "due_date">[],
  today: string = todayISO(),
): number | null {
  const upcoming = submittals
    .filter((s) => !isResolvedSubmittal(s.status) && s.due_date >= today)
    .map((s) => daysBetween(today, s.due_date));
  return upcoming.length ? Math.min(...upcoming) : null;
}

/** Approvals recorded in the activity log for a given month ("yyyy-mm").
 *  Counts approved submittals/change orders and answered RFIs. */
export function approvedInMonth(
  activity: Pick<ActivityEntry, "message" | "created_at">[],
  month: string,
): number {
  return activity.filter(
    (a) =>
      a.created_at.slice(0, 7) === month &&
      (a.message === "status changed to approved" ||
        a.message === "status changed to answered"),
  ).length;
}

/** Delta line for the approved KPI: percentage vs the previous month. */
export function approvedDelta(current: number, previous: number): string {
  if (previous === 0) {
    return current > 0 ? "▲ none last month" : "no approvals yet";
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  return pct >= 0 ? `▲ ${pct}% vs. last month` : `▼ ${Math.abs(pct)}% vs. last month`;
}

export interface DeadlineItem {
  label: string;
  daysUntil: number;
  href: string;
}

/** Upcoming due dates across RFIs and submittals (change orders have no due
 *  date in the schema), nearest first. Includes items due today. */
export function upcomingDeadlines(
  rfis: Pick<Rfi, "rfi_number" | "status" | "due_date">[],
  submittals: Pick<Submittal, "submittal_number" | "status" | "due_date">[],
  today: string = todayISO(),
  limit = 5,
): DeadlineItem[] {
  const items: DeadlineItem[] = [
    ...rfis
      .filter((r) => !isClosedState(r.status) && r.due_date >= today)
      .map((r) => ({
        label: `${r.rfi_number} — response due`,
        daysUntil: daysBetween(today, r.due_date),
        href: "/rfis",
      })),
    ...submittals
      .filter((s) => !isResolvedSubmittal(s.status) && s.due_date >= today)
      .map((s) => ({
        label: `${s.submittal_number} — review due`,
        daysUntil: daysBetween(today, s.due_date),
        href: "/submittals",
      })),
  ];
  return items.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, limit);
}

export function formatDaysUntil(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "in 1 day";
  return `in ${days} days`;
}

export type ActivityTone = "blue" | "amber" | "red" | "green" | "muted";

/** Dot color for the Recent Activity feed, derived from the trigger-written
 *  message text (see the activity-log triggers in the schema migration). */
export function activityTone(message: string): ActivityTone {
  if (message.includes("approved") || message.includes("answered")) return "green";
  if (message.includes("rejected")) return "red";
  if (
    message.includes("in review") ||
    message.includes("under review") ||
    message.includes("submitted")
  )
    return "amber";
  if (message.includes("closed")) return "muted";
  return "blue"; // created / details updated
}

/** "Today, 8:12 AM" / "Yesterday, 4:40 PM" / "N days ago" */
export function formatActivityTime(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfThat = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfThat.getTime()) / 86_400_000,
  );
  const time = d.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
  if (dayDiff <= 0) return `Today, ${time}`;
  if (dayDiff === 1) return `Yesterday, ${time}`;
  return `${dayDiff} days ago`;
}
