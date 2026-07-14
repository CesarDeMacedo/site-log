import Link from "next/link";
import { Notice, SetupNotice } from "@/components/notice";
import { Stamp, type StampTone } from "@/components/stamp";
import {
  activityTone,
  approvedDelta,
  approvedInMonth,
  avgOverdueDays,
  formatActivityTime,
  formatDaysUntil,
  upcomingDeadlines,
  type ActivityTone,
} from "@/lib/dashboard-logic";
import { todayISO } from "@/lib/dates";
import { getProjectOr404 } from "@/lib/get-project";
import {
  isClosedState,
  RFI_STATUS_LABELS,
  rfiDaysOpen,
  rfiDisplayStatus,
  rfiIsOverdue,
  type RfiDisplayStatus,
} from "@/lib/rfi-logic";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import type { ActivityEntry, Rfi } from "@/lib/types";

export const dynamic = "force-dynamic";

const RFI_TONE: Record<RfiDisplayStatus, StampTone> = {
  open: "open",
  in_review: "review",
  overdue: "overdue",
  answered: "approved",
  closed: "closed",
};
const DOT_CLASS: Record<ActivityTone, string> = {
  blue: "bg-blueprint",
  amber: "bg-amber",
  red: "bg-danger",
  green: "bg-success",
  muted: "bg-muted-2",
};

const TH_CLASS =
  "border-b border-line px-[18px] py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.6px] text-muted-2";
const TD_CLASS = "border-b border-line/60 px-[18px] py-[11px]";

function Kpi({
  label,
  value,
  valueSuffix,
  delta,
  deltaClass = "text-muted-2",
  accent,
}: {
  label: string;
  value: string;
  valueSuffix?: string;
  delta: string;
  deltaClass?: string;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-surface px-4 pb-3.5 pt-4">
      <span
        className="absolute left-0 top-0 h-full w-[3px]"
        style={{ background: accent }}
      />
      <div className="mb-2 text-[11px] uppercase tracking-[0.5px] text-muted">
        {label}
      </div>
      <div className="font-display text-3xl font-semibold leading-none">
        {value}
        {valueSuffix && (
          <small className="ml-1 font-sans text-[13px] font-normal text-muted">
            {valueSuffix}
          </small>
        )}
      </div>
      <div className={`mt-2 font-mono text-[11px] ${deltaClass}`}>{delta}</div>
    </div>
  );
}

function PanelHead({
  title,
  count,
  href,
}: {
  title: string;
  count: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-line px-[18px] pb-3 pt-4">
      <h2 className="font-display text-[15px] font-semibold tracking-[0.3px]">
        {title}
      </h2>
      <span className="font-mono text-[11px] text-muted">
        {count}
        {href && (
          <Link href={href} className="ml-3 text-blueprint hover:underline">
            View all →
          </Link>
        )}
      </span>
    </div>
  );
}

function prevMonthKey(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function ProjectDashboardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const { projectId } = await params;
  const project = await getProjectOr404(projectId);
  const supabase = await getSupabase();

  const today = todayISO();
  const month = today.slice(0, 7);
  const prevMonth = prevMonthKey(month);

  const [rfisRes, recentActivityRes, monthActivityRes] =
    await Promise.all([
      supabase
        .from("rfis")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
        .returns<Rfi[]>(),
      supabase
        .from("activity_log")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
        .limit(8)
        .returns<ActivityEntry[]>(),
      supabase
        .from("activity_log")
        .select("message, created_at")
        .eq("project_id", project.id)
        .gte("created_at", `${prevMonth}-01`)
        .returns<Pick<ActivityEntry, "message" | "created_at">[]>(),
    ]);

  const firstError =
    rfisRes.error ?? recentActivityRes.error ?? monthActivityRes.error;
  if (firstError) return <Notice title="Database error">{firstError.message}</Notice>;

  const rfis = rfisRes.data ?? [];
  const recentActivity = recentActivityRes.data ?? [];
  const monthActivity = monthActivityRes.data ?? [];

  // KPIs
  const openRfis = rfis.filter((r) => !isClosedState(r.status));
  const overdueRfis = rfis.filter((r) => rfiIsOverdue(r, today));
  const pendingFivePlus = openRfis.filter(
    (r) => (rfiDaysOpen(r, today) ?? 0) >= 5,
  ).length;
  const avgDelay = avgOverdueDays(rfis, today);
  const approvedNow = approvedInMonth(monthActivity, month);
  const approvedPrev = approvedInMonth(monthActivity, prevMonth);

  const deadlines = upcomingDeadlines(rfis, [], today);
  const base = `/projects/${project.id}`;

  return (
    <>
      <div className="mb-[22px] flex flex-wrap items-start justify-between gap-3.5">
        <div>
          <div className="mb-1 font-mono text-[11px] tracking-[1px] text-blueprint">
            CONTRACT ADMINISTRATION · OVERVIEW
          </div>
          <h1 className="mb-1 font-display text-[26px] font-semibold tracking-[0.3px]">
            {project.name}
          </h1>
          <div className="text-[13px] text-muted">
            {[
              project.general_contractor && `General Contractor: ${project.general_contractor}`,
              project.pm_name && `PM: ${project.pm_name}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
        <a
          href={`/projects/${project.id}/report`}
          download
          className="rounded-md bg-blueprint-dim px-4 py-2 text-[13px] font-semibold text-white hover:brightness-110"
        >
          Export Report ↓
        </a>
      </div>

      <div className="mb-[22px] grid grid-cols-2 gap-3 xl:grid-cols-3">
        <Kpi
          label="Open RFIs"
          value={String(openRfis.length)}
          delta={
            pendingFivePlus > 0
              ? `${pendingFivePlus} pending for 5+ days`
              : "none pending 5+ days"
          }
          accent="var(--color-blueprint)"
        />
        <Kpi
          label="Overdue RFIs"
          value={String(overdueRfis.length)}
          delta={avgDelay !== null ? `▲ avg. delay: ${avgDelay} days` : "none overdue"}
          deltaClass={avgDelay !== null ? "text-danger" : "text-success"}
          accent="var(--color-danger)"
        />
        <Kpi
          label="Approved this month"
          value={String(approvedNow)}
          delta={approvedDelta(approvedNow, approvedPrev)}
          deltaClass={approvedNow >= approvedPrev ? "text-success" : "text-danger"}
          accent="var(--color-success)"
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-lg border border-line bg-surface">
            <PanelHead
              title="RFI Log"
              count={`${openRfis.length} open · ${rfis.length} total`}
              href={`${base}/rfis`}
            />
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr>
                    {["ID", "Description", "Contractor", "Days open", "Status"].map(
                      (h) => (
                        <th key={h} className={TH_CLASS}>
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child_td]:border-b-0">
                  {rfis.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-[18px] py-6 text-center text-muted">
                        No RFIs yet.
                      </td>
                    </tr>
                  )}
                  {rfis.slice(0, 6).map((rfi) => {
                    const overdue = rfiIsOverdue(rfi, today);
                    const daysOpen = rfiDaysOpen(rfi, today);
                    const display = rfiDisplayStatus(rfi, today);
                    return (
                      <tr key={rfi.id}>
                        <td className={`${TD_CLASS} font-mono text-xs text-blueprint`}>
                          {rfi.rfi_number}
                        </td>
                        <td className={`${TD_CLASS} text-text`}>{rfi.description}</td>
                        <td className={`${TD_CLASS} text-xs text-muted`}>
                          {rfi.contractor ?? "—"}
                        </td>
                        <td
                          className={`${TD_CLASS} font-mono text-xs ${
                            overdue ? "font-semibold text-danger" : ""
                          }`}
                        >
                          {daysOpen !== null
                            ? `${daysOpen} ${daysOpen === 1 ? "day" : "days"}`
                            : "—"}
                        </td>
                        <td className={TD_CLASS}>
                          <Stamp
                            tone={RFI_TONE[display]}
                            label={
                              display === "overdue"
                                ? "Overdue"
                                : RFI_STATUS_LABELS[display]
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-line bg-surface">
            <PanelHead title="Recent Activity" count="" />
            {recentActivity.length === 0 && (
              <div className="px-[18px] py-6 text-center text-[12.5px] text-muted">
                No activity yet.
              </div>
            )}
            {recentActivity.map((entry) => (
              <div
                key={entry.id}
                className="flex gap-2.5 border-b border-line/60 px-[18px] py-3 last:border-b-0"
              >
                <span
                  className={`mt-[5px] h-[7px] w-[7px] shrink-0 rounded-full ${DOT_CLASS[activityTone(entry.message)]}`}
                />
                <div>
                  <div className="text-[12.5px] leading-snug text-muted">
                    <b className="font-semibold text-text">{entry.entity_label}</b>{" "}
                    {entry.message}
                  </div>
                  <div className="mt-0.5 font-mono text-[10.5px] text-muted-2">
                    {formatActivityTime(entry.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-line bg-surface">
            <PanelHead title="Upcoming Deadlines" count="" />
            {deadlines.length === 0 && (
              <div className="px-[18px] py-6 text-center text-[12.5px] text-muted">
                No upcoming deadlines.
              </div>
            )}
            {deadlines.map((d) => (
              <Link
                key={`${d.label}`}
                href={`${base}${d.href}`}
                className="flex items-center justify-between border-b border-line/60 px-[18px] py-[11px] text-[12.5px] last:border-b-0 hover:bg-blueprint/4"
              >
                <span>{d.label}</span>
                <span
                  className={`font-mono text-xs ${
                    d.daysUntil <= 2 ? "font-semibold text-danger" : "text-muted"
                  }`}
                >
                  {formatDaysUntil(d.daysUntil)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 text-center font-mono text-[10.5px] text-muted-2">
        RFI LOG · CONSTRUCTION ADMINISTRATION TRACKER
      </div>
    </>
  );
}
