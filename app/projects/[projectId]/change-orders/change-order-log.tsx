"use client";

import { useMemo, useState } from "react";
import { Stamp, type StampTone } from "@/components/stamp";
import {
  CHANGE_ORDER_STATUS_LABELS,
  formatCost,
  isResolvedChangeOrder,
} from "@/lib/change-order-logic";
import type { ChangeOrder, ChangeOrderStatus } from "@/lib/types";
import { ChangeOrderFormModal } from "./change-order-form-modal";

const TABS = ["All", "Active", "Approved", "Rejected"] as const;
type Tab = (typeof TABS)[number];

const STATUS_TONE: Record<ChangeOrderStatus, StampTone> = {
  draft: "closed",
  submitted: "open",
  under_review: "review",
  approved: "approved",
  rejected: "closed",
};

interface ChangeOrderLogProps {
  projectId: string;
  changeOrders: ChangeOrder[];
}

export function ChangeOrderLog({ projectId, changeOrders }: ChangeOrderLogProps) {
  const [tab, setTab] = useState<Tab>("All");
  const [modal, setModal] = useState<{
    open: boolean;
    changeOrder: ChangeOrder | null;
  }>({ open: false, changeOrder: null });

  const filtered = useMemo(() => {
    switch (tab) {
      case "Active":
        return changeOrders.filter((c) => !isResolvedChangeOrder(c.status));
      case "Approved":
        return changeOrders.filter((c) => c.status === "approved");
      case "Rejected":
        return changeOrders.filter((c) => c.status === "rejected");
      default:
        return changeOrders;
    }
  }, [changeOrders, tab]);

  const activeCount = changeOrders.filter(
    (c) => !isResolvedChangeOrder(c.status),
  ).length;

  return (
    <>
      <div className="rounded-lg border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-[18px] pb-3 pt-4">
          <h2 className="font-display text-[15px] font-semibold tracking-[0.3px]">
            Change Orders (PCO)
          </h2>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-muted">
              {activeCount} active · {changeOrders.length} total
            </span>
            <button
              onClick={() => setModal({ open: true, changeOrder: null })}
              className="rounded-md bg-blueprint-dim px-4 py-[7px] text-[13px] font-semibold text-white hover:brightness-110"
            >
              + New Change Order
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
                {["ID", "Description", "Estimated cost", "Created", "Status"].map(
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
                  <td colSpan={5} className="px-[18px] py-8 text-center text-muted">
                    {changeOrders.length === 0
                      ? "No change orders yet — create the first one."
                      : `No ${tab.toLowerCase()} change orders.`}
                  </td>
                </tr>
              )}
              {filtered.map((changeOrder) => (
                <tr
                  key={changeOrder.id}
                  onClick={() => setModal({ open: true, changeOrder })}
                  className="cursor-pointer transition-colors hover:bg-blueprint/4"
                  title={`Edit ${changeOrder.pco_number}`}
                >
                  <td className="border-b border-line/60 px-[18px] py-[11px] font-mono text-xs text-blueprint">
                    {changeOrder.pco_number}
                  </td>
                  <td className="border-b border-line/60 px-[18px] py-[11px] text-text">
                    {changeOrder.description}
                  </td>
                  <td className="border-b border-line/60 px-[18px] py-[11px] font-mono text-xs">
                    {formatCost(changeOrder.estimated_cost)}
                  </td>
                  <td className="border-b border-line/60 px-[18px] py-[11px] font-mono text-xs text-muted">
                    {changeOrder.created_at.slice(0, 10)}
                  </td>
                  <td className="border-b border-line/60 px-[18px] py-[11px]">
                    <Stamp
                      tone={STATUS_TONE[changeOrder.status]}
                      label={CHANGE_ORDER_STATUS_LABELS[changeOrder.status]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal.open && (
        <ChangeOrderFormModal
          projectId={projectId}
          changeOrder={modal.changeOrder}
          onClose={() => setModal({ open: false, changeOrder: null })}
        />
      )}
    </>
  );
}
