"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase/server";
import { SUBMITTAL_STATUS_FLOW } from "@/lib/submittal-logic";
import type { SubmittalStatus } from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

interface SubmittalFormValues {
  item: string;
  supplier: string | null;
  review_step: number;
  review_steps_total: number;
  due_date: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseSubmittalForm(
  formData: FormData,
):
  | { values: SubmittalFormValues; error?: never }
  | { values?: never; error: string } {
  const item = String(formData.get("item") ?? "").trim();
  const supplier = String(formData.get("supplier") ?? "").trim();
  const due_date = String(formData.get("due_date") ?? "").trim();
  const review_step = Number(formData.get("review_step") ?? "");
  const review_steps_total = Number(formData.get("review_steps_total") ?? "");

  if (!item) return { error: "Item description is required." };
  if (!DATE_RE.test(due_date)) return { error: "Due date must be a valid date." };
  if (!Number.isInteger(review_steps_total) || review_steps_total < 1 || review_steps_total > 20)
    return { error: "Total review steps must be between 1 and 20." };
  if (!Number.isInteger(review_step) || review_step < 0 || review_step > review_steps_total)
    return { error: "Current step must be between 0 and the total steps." };

  return {
    values: {
      item,
      supplier: supplier || null,
      review_step,
      review_steps_total,
      due_date,
    },
  };
}

export async function createSubmittal(formData: FormData): Promise<ActionResult> {
  const projectId = String(formData.get("project_id") ?? "");
  if (!projectId) return { ok: false, error: "Missing project." };

  const parsed = parseSubmittalForm(formData);
  if (parsed.error) return { ok: false, error: parsed.error };

  // submittal_number omitted — assigned by the DB trigger (SPEC.md §4)
  const { error } = await getSupabase()
    .from("submittals")
    .insert({ project_id: projectId, ...parsed.values });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/projects/${projectId}/submittals`);
  return { ok: true };
}

export async function updateSubmittal(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing submittal id." };

  const parsed = parseSubmittalForm(formData);
  if (parsed.error) return { ok: false, error: parsed.error };

  const status = String(formData.get("status") ?? "") as SubmittalStatus;
  if (!SUBMITTAL_STATUS_FLOW.includes(status))
    return { ok: false, error: "Invalid status." };

  const supabase = getSupabase();
  const { data: updated, error } = await supabase
    .from("submittals")
    .update({ ...parsed.values, status })
    .eq("id", id)
    .select("project_id")
    .maybeSingle<{ project_id: string }>();
  if (error) return { ok: false, error: error.message };
  if (!updated) return { ok: false, error: "Submittal not found." };

  revalidatePath(`/projects/${updated.project_id}/submittals`);
  return { ok: true };
}
