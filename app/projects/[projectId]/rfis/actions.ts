"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase/server";
import { isClosedState, RFI_STATUS_FLOW, todayISO } from "@/lib/rfi-logic";
import type { RfiStatus } from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

interface RfiFormValues {
  description: string;
  discipline: string | null;
  assigned_to: string | null;
  date_submitted: string;
  due_date: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseRfiForm(
  formData: FormData,
): { values: RfiFormValues; error?: never } | { values?: never; error: string } {
  const description = String(formData.get("description") ?? "").trim();
  const discipline = String(formData.get("discipline") ?? "").trim();
  const assigned_to = String(formData.get("assigned_to") ?? "").trim();
  const date_submitted = String(formData.get("date_submitted") ?? "").trim();
  const due_date = String(formData.get("due_date") ?? "").trim();

  if (!description) return { error: "Description is required." };
  if (!DATE_RE.test(date_submitted))
    return { error: "Date submitted must be a valid date." };
  if (!DATE_RE.test(due_date)) return { error: "Due date must be a valid date." };
  if (due_date < date_submitted)
    return { error: "Due date cannot be before the date submitted." };

  return {
    values: {
      description,
      discipline: discipline || null,
      assigned_to: assigned_to || null,
      date_submitted,
      due_date,
    },
  };
}

export async function createRfi(formData: FormData): Promise<ActionResult> {
  const projectId = String(formData.get("project_id") ?? "");
  if (!projectId) return { ok: false, error: "Missing project." };

  const parsed = parseRfiForm(formData);
  if (parsed.error) return { ok: false, error: parsed.error };

  // rfi_number is intentionally omitted — assigned by the DB trigger (SPEC.md §4)
  const { error } = await getSupabase()
    .from("rfis")
    .insert({ project_id: projectId, ...parsed.values });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/projects/${projectId}/rfis`);
  return { ok: true };
}

export async function updateRfi(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing RFI id." };

  const parsed = parseRfiForm(formData);
  if (parsed.error) return { ok: false, error: parsed.error };

  const status = String(formData.get("status") ?? "") as RfiStatus;
  if (!RFI_STATUS_FLOW.includes(status))
    return { ok: false, error: "Invalid status." };

  const supabase = getSupabase();
  const { data: current, error: fetchError } = await supabase
    .from("rfis")
    .select("date_answered, project_id")
    .eq("id", id)
    .maybeSingle<{ date_answered: string | null; project_id: string }>();
  if (fetchError) return { ok: false, error: fetchError.message };
  if (!current) return { ok: false, error: "RFI not found." };

  // date_answered follows the status: stamped when the RFI reaches
  // answered/closed, cleared if it is reopened.
  let date_answered: string | null = current.date_answered;
  if (isClosedState(status)) {
    date_answered = date_answered ?? todayISO();
  } else {
    date_answered = null;
  }

  const { error } = await supabase
    .from("rfis")
    .update({ ...parsed.values, status, date_answered })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/projects/${current.project_id}/rfis`);
  return { ok: true };
}
