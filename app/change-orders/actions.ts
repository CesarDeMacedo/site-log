"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase/server";
import { CHANGE_ORDER_STATUS_FLOW } from "@/lib/change-order-logic";
import type { ChangeOrderStatus } from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

interface ChangeOrderFormValues {
  description: string;
  estimated_cost: number | null;
}

function parseChangeOrderForm(
  formData: FormData,
):
  | { values: ChangeOrderFormValues; error?: never }
  | { values?: never; error: string } {
  const description = String(formData.get("description") ?? "").trim();
  const costRaw = String(formData.get("estimated_cost") ?? "").trim();

  if (!description) return { error: "Description is required." };

  let estimated_cost: number | null = null;
  if (costRaw !== "") {
    const n = Number(costRaw);
    if (!Number.isFinite(n) || n < 0)
      return { error: "Estimated cost must be a non-negative number." };
    estimated_cost = Math.round(n * 100) / 100;
  }

  return { values: { description, estimated_cost } };
}

export async function createChangeOrder(formData: FormData): Promise<ActionResult> {
  const projectId = String(formData.get("project_id") ?? "");
  if (!projectId) return { ok: false, error: "Missing project." };

  const parsed = parseChangeOrderForm(formData);
  if (parsed.error) return { ok: false, error: parsed.error };

  // pco_number omitted — assigned by the DB trigger (SPEC.md §4)
  const { error } = await getSupabase()
    .from("change_orders")
    .insert({ project_id: projectId, ...parsed.values });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/change-orders");
  return { ok: true };
}

export async function updateChangeOrder(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing change order id." };

  const parsed = parseChangeOrderForm(formData);
  if (parsed.error) return { ok: false, error: parsed.error };

  const status = String(formData.get("status") ?? "") as ChangeOrderStatus;
  if (!CHANGE_ORDER_STATUS_FLOW.includes(status))
    return { ok: false, error: "Invalid status." };

  const { error } = await getSupabase()
    .from("change_orders")
    .update({ ...parsed.values, status })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/change-orders");
  return { ok: true };
}
