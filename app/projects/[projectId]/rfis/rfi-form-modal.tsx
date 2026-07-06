"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  daysBetween,
  RFI_DISCIPLINES,
  RFI_STATUS_FLOW,
  RFI_STATUS_LABELS,
  rfiDaysOpen,
  rfiIsOverdue,
} from "@/lib/rfi-logic";
import type { Rfi } from "@/lib/types";
import { createRfi, updateRfi } from "./actions";

const LABEL_CLASS =
  "block text-[10.5px] font-semibold uppercase tracking-[1.2px] text-muted-2 mb-1.5";
const INPUT_CLASS =
  "w-full rounded-md border border-line bg-surface-2 px-3 py-2 text-[13px] text-text placeholder:text-muted-2 focus:border-blueprint focus:outline-none";
const DATE_CLASS = `${INPUT_CLASS} font-mono text-xs [color-scheme:dark]`;

interface RfiFormModalProps {
  projectId: string;
  rfi: Rfi | null; // null = create
  today: string;
  onClose: () => void;
}

export function RfiFormModal({ projectId, rfi, today, onClose }: RfiFormModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = rfi ? await updateRfi(formData) : await createRfi(formData);
      if (result.ok) onClose();
      else setError(result.error ?? "Something went wrong.");
    });
  }

  const daysOpen = rfi ? rfiDaysOpen(rfi, today) : null;
  const overdueBy =
    rfi && rfiIsOverdue(rfi, today) ? daysBetween(rfi.due_date, today) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#040a12]/70 px-4 pt-[8vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={rfi ? `Edit ${rfi.rfi_number}` : "New RFI"}
        className="w-full max-w-[560px] rounded-lg border border-line bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <div className="font-mono text-[11px] tracking-[1px] text-blueprint">
              {rfi ? rfi.rfi_number : "NEW RFI · NUMBER AUTO-ASSIGNED"}
            </div>
            <h2 className="mt-0.5 font-display text-[17px] font-semibold tracking-[0.3px]">
              {rfi ? "Edit RFI" : "Create RFI"}
            </h2>
          </div>
          {rfi && (
            <div className="text-right font-mono text-[11px] leading-relaxed text-muted">
              {daysOpen !== null ? `${daysOpen} days open` : "resolved"}
              {overdueBy !== null && (
                <span className="block font-semibold text-danger">
                  overdue by {overdueBy} {overdueBy === 1 ? "day" : "days"}
                </span>
              )}
            </div>
          )}
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          {rfi ? (
            <input type="hidden" name="id" value={rfi.id} />
          ) : (
            <input type="hidden" name="project_id" value={projectId} />
          )}

          <div>
            <label htmlFor="rfi-description" className={LABEL_CLASS}>
              Description
            </label>
            <textarea
              id="rfi-description"
              name="description"
              required
              rows={2}
              defaultValue={rfi?.description ?? ""}
              placeholder="e.g. Expansion joint specification — Block B"
              className={`${INPUT_CLASS} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="rfi-discipline" className={LABEL_CLASS}>
                Discipline
              </label>
              <select
                id="rfi-discipline"
                name="discipline"
                defaultValue={rfi?.discipline ?? ""}
                className={INPUT_CLASS}
              >
                <option value="">—</option>
                {RFI_DISCIPLINES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
                {rfi?.discipline && !RFI_DISCIPLINES.includes(rfi.discipline) && (
                  <option value={rfi.discipline}>{rfi.discipline}</option>
                )}
              </select>
            </div>
            <div>
              <label htmlFor="rfi-assigned" className={LABEL_CLASS}>
                Assigned to
              </label>
              <input
                id="rfi-assigned"
                name="assigned_to"
                type="text"
                defaultValue={rfi?.assigned_to ?? ""}
                placeholder="e.g. Structural Eng."
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="rfi-submitted" className={LABEL_CLASS}>
                Date submitted
              </label>
              <input
                id="rfi-submitted"
                name="date_submitted"
                type="date"
                required
                defaultValue={rfi?.date_submitted ?? today}
                className={DATE_CLASS}
              />
            </div>
            <div>
              <label htmlFor="rfi-due" className={LABEL_CLASS}>
                Due date
              </label>
              <input
                id="rfi-due"
                name="due_date"
                type="date"
                required
                defaultValue={rfi?.due_date ?? ""}
                className={DATE_CLASS}
              />
            </div>
          </div>

          {rfi && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="rfi-status" className={LABEL_CLASS}>
                  Status
                </label>
                <select
                  id="rfi-status"
                  name="status"
                  defaultValue={rfi.status}
                  className={INPUT_CLASS}
                >
                  {RFI_STATUS_FLOW.map((s) => (
                    <option key={s} value={s}>
                      {RFI_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className={LABEL_CLASS}>Date answered</span>
                <div className="rounded-md border border-line/60 bg-surface-2/50 px-3 py-2 font-mono text-xs text-muted">
                  {rfi.date_answered ?? "set automatically on answer"}
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-[12.5px] text-danger">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2.5 border-t border-line pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-[13px] font-semibold text-muted hover:text-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-blueprint-dim px-4 py-2 text-[13px] font-semibold text-white hover:brightness-110 disabled:opacity-60"
            >
              {pending ? "Saving…" : rfi ? "Save changes" : "Create RFI"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
