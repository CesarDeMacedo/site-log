"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase/server";

export interface CreateProjectResult {
  ok: boolean;
  error?: string;
  projectId?: string;
}

export async function createProject(
  formData: FormData,
): Promise<CreateProjectResult> {
  const name = String(formData.get("name") ?? "").trim();
  const general_contractor = String(formData.get("general_contractor") ?? "").trim();
  const pm_name = String(formData.get("pm_name") ?? "").trim();

  if (!name) return { ok: false, error: "Project name is required." };

  const { data, error } = await (await getSupabase())
    .from("projects")
    .insert({
      name,
      general_contractor: general_contractor || null,
      pm_name: pm_name || null,
    })
    .select("id")
    .single<{ id: string }>();
  if (error) return { ok: false, error: error.message };

  // Refresh the project list page and the sidebar selector on every route
  revalidatePath("/projects");
  revalidatePath("/", "layout");
  return { ok: true, projectId: data.id };
}
