import { redirect } from "next/navigation";
import { SetupNotice } from "@/components/notice";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Single-project setups land straight on their dashboard (as fast as the old
// single-project home); everything else goes to the project list.
export default async function HomePage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const { data: projects } = await getSupabase()
    .from("projects")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(2);

  if (projects?.length === 1) redirect(`/projects/${projects[0].id}`);
  redirect("/projects");
}
