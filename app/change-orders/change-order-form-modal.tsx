"use client";

import { useEffect, useState, useTransition } from "react";
import {
  CHANGE_ORDER_STATUS_FLOW,
  CHANGE_ORDER_STATUS_LABELS,
} from "@/lib/change-order-logic";
import type { ChangeOrder } from "@/lib/types";
import { createChangeOrder, updateChangeOrder } from "./actions";

const LABEL_CLASS =
  "block text-[10.5px] font-semibold uppercase tracking-[1.2px] text-muted-2 mb-1.5";
const INPUT_CLASS =
  "w-full rounded-md border border-line bg-surface-2 px-3 py-2 text-[13px] text-text placeholder:text-muted-2 focus:border-blueprint focus:outline-none";

interface ChangeOrderFormModalProps {
  projectId: string;
  changeOrder: ChangeOrder | null; // null = create
  onClose: () => void;
}

export function ChangeOrderFormModal({
  projectId,
  changeOrder,
  onClose,
}: ChangeOrderFormModalProps) {
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
      const result = changeOrder
        ? await updateChangeOrder(formData)
        : await createChangeOrder(formData);
      if (result.ok) onClose();
      else setError(result.error ?? "Something went wrong.");
    });
  }

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
        aria-label={
          changeOrder ? `Edit ${changeOrder.pco_number}` : "New change order"
        }
        className="w-full max-w-[560px] rounded-lg border border-line bg-surface shadow-2xl"
      >
        <div className="border-b border-line px-5 py-4">
          <div className="font-mono text-[11px] tracking-[1px] text-blueprint">
            {changeOrder
              ? changeOrder.pco_number
              : "NEW CHANGE ORDER · NUMBER AUTO-ASSIGNED"}
          </div>
          <h2 className="mt-0.5 font-display text-[17px] font-semibold tracking-[0.3px]">
            {changeOrder ? "Edit Change Order" : "Create Change Order"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          {changeOrder ? (
            <input type="hidden" name="id" value={changeOrder.id} />
          ) : (
            <input type="hidden" name="project_id" value={projectId} />
          )}

          <div>
            <label htmlFor="pco-description" className={LABEL_CLASS}>
              Description
            </label>
            <textarea
              id="pco-description"
              name="description"
              required
              rows={2}
              defaultValue={changeOrder?.description ?? ""}
              placeholder="e.g. Additional dewatering — east excavation"
              className={`${INPUT_CLASS} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="pco-cost" className={LABEL_CLASS}>
                Estimated cost (CAD)
              </label>
              <input
                id="pco-cost"
                name="estimated_cost"
                type="number"
                min={0}
                step="0.01"
                defaultValue={changeOrder?.estimated_cost ?? ""}
                placeholder="e.g. 186400"
                className={`${INPUT_CLASS} font-mono text-xs`}
              />
            </div>
            {changeOrder && (
              <div>
                <label htmlFor="pco-status" className={LABEL_CLASS}>
                  Status
                </label>
                <select
                  id="pco-status"
                  name="status"
                  defaultValue={changeOrder.status}
                  className={INPUT_CLASS}
                >
                  {CHANGE_ORDER_STATUS_FLOW.map((s) => (
                    <option key={s} value={s}>
                      {CHANGE_ORDER_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

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
              {pending
                ? "Saving…"
                : changeOrder
                  ? "Save changes"
                  : "Create change order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
