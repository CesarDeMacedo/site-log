"use client";

import { useMemo, useState } from "react";
import { Stamp, type StampTone } from "@/components/stamp";
import {
  isResolvedSubmittal,
  reviewProgressPercent,
  SUBMITTAL_STATUS_LABELS,
  submittalDisplayStatus,
  submittalIsOverdue,
  type SubmittalDisplayStatus,
} from "@/lib/submittal-logic";
import type { Submittal } from "@/lib/types";
import { SubmittalFormModal } from "./submittal-form-modal";

const TABS = ["All", "Open", "Overdue", "Resolved"] as const;
type Tab = (typeof TABS)[number];

const STATUS_TONE: Record<SubmittalDisplayStatus, StampTone> = {
  open: "open",
  in_review: "review",
  overdue: "overdue",
  approved: "approved",
  rejected: "closed",
};

function statusLabel(status: SubmittalDisplayStatus): string {
  return status === "overdue" ? "Overdue" : SUBMITTAL_STATUS_LABELS[status];
}

interface SubmittalLogProps {
  projectId: string;
  submittals: Submittal[];
  today: string;
}

export function SubmittalLog({ projectId, submittals, today }: SubmittalLogProps) {
  const [tab, setTab] = useState<Tab>("All");
  const [modal, setModal] = useState<{ open: boolean; submittal: Submittal | null }>(
    { open: false, submittal: null },
  );

  const filtered = useMemo(() => {
    switch (tab) {
      case "Open":
        return submittals.filter((s) => !isResolvedSubmittal(s.status));
      case "Overdue":
        return submittals.filter((s) => submittalIsOverdue(s, today));
      case "Resolved":
        return submittals.filter((s) => isResolvedSubmittal(s.status));
      default:
        return submittals;
    }
  }, [submittals, tab, today]);

  const inReviewCount = submittals.filter((s) => s.status === "in_review").length;

  return (
    <>
      <div className="rounded-lg border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-[18px] pb-3 pt-4">
          <h2 className="font-display text-[15px] font-semibold tracking-[0.3px]">
            Submittal Log
          </h2>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-muted">
              {inReviewCount} in review · {submittals.length} total
            </span>
            <button
              onClick={() => setModal({ open: true, submittal: null })}
              className="rounded-md bg-blueprint-dim px-4 py-[7px] text-[13px] font-semibold text-white hover:brightness-110"
            >
              + New Submittal
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
                {["ID", "Item", "Supplier", "Progress", "Due date", "Status"].map(
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
                  <td colSpan={6} className="px-[18px] py-8 text-center text-muted">
                    {submittals.length === 0
                      ? "No submittals yet — create the first one."
                      : `No ${tab.toLowerCase()} submittals.`}
                  </td>
                </tr>
              )}
              {filtered.map((submittal) => {
                const overdue = submittalIsOverdue(submittal, today);
                const display = submittalDisplayStatus(submittal, today);
                const pct = reviewProgressPercent(
                  submittal.review_step,
                  submittal.review_steps_total,
                );
                return (
                  <tr
                    key={submittal.id}
                    onClick={() => setModal({ open: true, submittal })}
                    className="cursor-pointer transition-colors hover:bg-blueprint/4"
                    title={`Edit ${submittal.submittal_number}`}
                  >
                    <td className="border-b border-line/60 px-[18px] py-[11px] font-mono text-xs text-blueprint">
                      {submittal.submittal_number}
                    </td>
                    <td className="border-b border-line/60 px-[18px] py-[11px] text-text">
                      {submittal.item}
                    </td>
                    <td className="border-b border-line/60 px-[18px] py-[11px] text-xs text-muted">
                      {submittal.supplier ?? "—"}
                    </td>
                    <td className="border-b border-line/60 px-[18px] py-[11px]">
                      <span className="mr-1.5 inline-block h-[5px] w-[60px] overflow-hidden rounded-[3px] bg-line align-middle">
                        <span
                          className="block h-full bg-blueprint"
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span className="font-mono text-xs align-middle">
                        {submittal.review_step}/{submittal.review_steps_total}
                      </span>
                    </td>
                    <td
                      className={`border-b border-line/60 px-[18px] py-[11px] font-mono text-xs ${
                        overdue ? "font-semibold text-danger" : "text-muted"
                      }`}
                    >
                      {submittal.due_date}
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
        <SubmittalFormModal
          projectId={projectId}
          submittal={modal.submittal}
          today={today}
          onClose={() => setModal({ open: false, submittal: null })}
        />
      )}
    </>
  );
}
