"use client";

import { useMemo, useState } from "react";
import { Stamp, type StampTone } from "@/components/stamp";
import {
  isClosedState,
  RFI_STATUS_LABELS,
  rfiDaysOpen,
  rfiDisplayStatus,
  rfiIsOverdue,
  type RfiDisplayStatus,
} from "@/lib/rfi-logic";
import type { Rfi } from "@/lib/types";
import { RfiFormModal } from "./rfi-form-modal";

const TABS = ["All", "Open", "Overdue", "Closed"] as const;
type Tab = (typeof TABS)[number];

const STATUS_TONE: Record<RfiDisplayStatus, StampTone> = {
  open: "open",
  in_review: "review",
  overdue: "overdue",
  answered: "approved",
  closed: "closed",
};

function statusLabel(status: RfiDisplayStatus): string {
  return status === "overdue" ? "Overdue" : RFI_STATUS_LABELS[status];
}

interface RfiLogProps {
  projectId: string;
  rfis: Rfi[];
  today: string;
}

export function RfiLog({ projectId, rfis, today }: RfiLogProps) {
  const [tab, setTab] = useState<Tab>("All");
  const [modal, setModal] = useState<{ open: boolean; rfi: Rfi | null }>({
    open: false,
    rfi: null,
  });

  const filtered = useMemo(() => {
    switch (tab) {
      case "Open":
        return rfis.filter((r) => !isClosedState(r.status));
      case "Overdue":
        return rfis.filter((r) => rfiIsOverdue(r, today));
      case "Closed":
        return rfis.filter((r) => isClosedState(r.status));
      default:
        return rfis;
    }
  }, [rfis, tab, today]);

  const openCount = rfis.filter((r) => !isClosedState(r.status)).length;

  return (
    <>
      <div className="rounded-lg border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-[18px] pb-3 pt-4">
          <h2 className="font-display text-[15px] font-semibold tracking-[0.3px]">
            RFI Log
          </h2>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-muted">
              {openCount} open · {rfis.length} total
            </span>
            <button
              onClick={() => setModal({ open: true, rfi: null })}
              className="rounded-md bg-blueprint-dim px-4 py-[7px] text-[13px] font-semibold text-white hover:brightness-110"
            >
              + New RFI
            </button>
          </div>
        </div>

        <div className="flex gap-1 px-[18px] pt-2.5" role="tablist">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-t-[5px] border-b-2 px-3 py-1.5 text-xs transition-colors ${
                tab === t
                  ? "border-blueprint bg-blueprint/6 text-text"
                  : "border-transparent text-muted hover:text-text"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                {["ID", "Description", "Discipline", "Assigned to", "Due date", "Days open", "Status"].map(
                  (h) => (
                    <th
                      key={h}
                      className="border-b border-line px-[18px] py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.6px] text-muted-2"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child_td]:border-b-0">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-[18px] py-8 text-center text-muted">
                    {rfis.length === 0
                      ? "No RFIs yet — create the first one."
                      : `No ${tab.toLowerCase()} RFIs.`}
                  </td>
                </tr>
              )}
              {filtered.map((rfi) => {
                const overdue = rfiIsOverdue(rfi, today);
                const daysOpen = rfiDaysOpen(rfi, today);
                const display = rfiDisplayStatus(rfi, today);
                return (
                  <tr
                    key={rfi.id}
                    onClick={() => setModal({ open: true, rfi })}
                    className="cursor-pointer transition-colors hover:bg-blueprint/4"
                    title={`Edit ${rfi.rfi_number}`}
                  >
                    <td className="border-b border-line/60 px-[18px] py-[11px] font-mono text-xs text-blueprint">
                      {rfi.rfi_number}
                    </td>
                    <td className="border-b border-line/60 px-[18px] py-[11px] text-text">
                      {rfi.description}
                    </td>
                    <td className="border-b border-line/60 px-[18px] py-[11px] text-xs text-muted">
                      {rfi.discipline ?? "—"}
                    </td>
                    <td className="border-b border-line/60 px-[18px] py-[11px] text-xs text-muted">
                      {rfi.assigned_to ?? "—"}
                    </td>
                    <td
                      className={`border-b border-line/60 px-[18px] py-[11px] font-mono text-xs ${
                        overdue ? "font-semibold text-danger" : "text-muted"
                      }`}
                    >
                      {rfi.due_date}
                    </td>
                    <td
                      className={`border-b border-line/60 px-[18px] py-[11px] font-mono text-xs ${
                        overdue ? "font-semibold text-danger" : ""
                      }`}
                    >
                      {daysOpen !== null
                        ? `${daysOpen} ${daysOpen === 1 ? "day" : "days"}`
                        : "—"}
                    </td>
                    <td className="border-b border-line/60 px-[18px] py-[11px]">
                      <Stamp tone={STATUS_TONE[display]} label={statusLabel(display)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal.open && (
        <RfiFormModal
          projectId={projectId}
          rfi={modal.rfi}
          today={today}
          onClose={() => setModal({ open: false, rfi: null })}
        />
      )}
    </>
  );
}
