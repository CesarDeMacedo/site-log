import { redirect } from "next/navigation";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

/** The pre-multi-project flat routes (/rfis, /submittals, …) redirect into
 *  the equivalent sub-route of the only project when unambiguous, otherwise
 *  to the project list — keeps old bookmarks working. */
export async function redirectLegacyRoute(subRoute: string): Promise<never> {
  if (isSupabaseConfigured()) {
    const { data: projects } = await getSupabase()
      .from("projects")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(2);
    if (projects?.length === 1) {
      redirect(`/projects/${projects[0].id}${subRoute}`);
    }
  }
  redirect("/projects");
}
