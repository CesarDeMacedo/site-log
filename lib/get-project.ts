import { notFound } from "next/navigation";
import { getSupabase } from "./supabase/server";
import type { Project } from "./types";

/** Fetch the project scoping the current route, or 404. A malformed id
 *  (invalid uuid) produces a Postgres error and is treated as 404 too. */
export async function getProjectOr404(projectId: string): Promise<Project> {
  const { data, error } = await getSupabase()
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle<Project>();
  if (error || !data) notFound();
  return data;
}
