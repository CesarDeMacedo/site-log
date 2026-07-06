"use client";

import { useEffect, useState, useTransition } from "react";
import { daysBetween } from "@/lib/dates";
import {
  SUBMITTAL_STATUS_FLOW,
  SUBMITTAL_STATUS_LABELS,
  submittalIsOverdue,
} from "@/lib/submittal-logic";
import type { Submittal } from "@/lib/types";
import { createSubmittal, updateSubmittal } from "./actions";

const LABEL_CLASS =
  "block text-[10.5px] font-semibold uppercase tracking-[1.2px] text-muted-2 mb-1.5";
const INPUT_CLASS =
  "w-full rounded-md border border-line bg-surface-2 px-3 py-2 text-[13px] text-text placeholder:text-muted-2 focus:border-blueprint focus:outline-none";
const DATE_CLASS = `${INPUT_CLASS} font-mono text-xs [color-scheme:dark]`;

interface SubmittalFormModalProps {
  projectId: string;
  submittal: Submittal | null; // null = create
  today: string;
  onClose: () => void;
}

export function SubmittalFormModal({
  projectId,
  submittal,
  today,
  onClose,
}: SubmittalFormModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
      const result = submittal
        ? await updateSubmittal(formData)
        : await createSubmittal(formData);
      if (result.ok) onClose();
      else setError(result.error ?? "Something went wrong.");
    });
  }

  const overdueBy =
    submittal && submittalIsOverdue(submittal, today)
      ? daysBetween(submittal.due_date, today)
      : null;

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
        aria-label={submittal ? `Edit ${submittal.submittal_number}` : "New submittal"}
        className="w-full max-w-[560px] rounded-lg border border-line bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <div className="font-mono text-[11px] tracking-[1px] text-blueprint">
              {submittal
                ? submittal.submittal_number
                : "NEW SUBMITTAL · NUMBER AUTO-ASSIGNED"}
            </div>
            <h2 className="mt-0.5 font-display text-[17px] font-semibold tracking-[0.3px]">
              {submittal ? "Edit Submittal" : "Create Submittal"}
            </h2>
          </div>
          {overdueBy !== null && (
            <div className="text-right font-mono text-[11px] font-semibold text-danger">
              overdue by {overdueBy} {overdueBy === 1 ? "day" : "days"}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          {submittal ? (
            <input type="hidden" name="id" value={submittal.id} />
          ) : (
            <input type="hidden" name="project_id" value={projectId} />
          )}

          <div>
            <label htmlFor="sub-item" className={LABEL_CLASS}>
              Item
            </label>
            <textarea
              id="sub-item"
              name="item"
              required
              rows={2}
              defaultValue={submittal?.item ?? ""}
              placeholder="e.g. Centrifugal pumps — data sheet"
              className={`${INPUT_CLASS} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sub-supplier" className={LABEL_CLASS}>
                Supplier
              </label>
              <input
                id="sub-supplier"
                name="supplier"
                type="text"
                defaultValue={submittal?.supplier ?? ""}
                placeholder="e.g. HydroTech Supply"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="sub-due" className={LABEL_CLASS}>
                Due date
              </label>
              <input
                id="sub-due"
                name="due_date"
                type="date"
                required
                defaultValue={submittal?.due_date ?? ""}
                className={DATE_CLASS}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sub-step" className={LABEL_CLASS}>
                Current review step
              </label>
              <input
                id="sub-step"
                name="review_step"
                type="number"
                min={0}
                max={20}
                required
                defaultValue={submittal?.review_step ?? 1}
                className={`${INPUT_CLASS} font-mono text-xs`}
              />
            </div>
            <div>
              <label htmlFor="sub-total" className={LABEL_CLASS}>
                Total review steps
              </label>
              <input
                id="sub-total"
                name="review_steps_total"
                type="number"
                min={1}
                max={20}
                required
                defaultValue={submittal?.review_steps_total ?? 3}
                className={`${INPUT_CLASS} font-mono text-xs`}
              />
            </div>
          </div>

          {submittal && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="sub-status" className={LABEL_CLASS}>
                  Status
                </label>
                <select
                  id="sub-status"
                  name="status"
                  defaultValue={submittal.status}
                  className={INPUT_CLASS}
                >
                  {SUBMITTAL_STATUS_FLOW.map((s) => (
                    <option key={s} value={s}>
                      {SUBMITTAL_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
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
              {pending ? "Saving…" : submittal ? "Save changes" : "Create submittal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
