import { Sidebar } from "@/components/sidebar";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";

// Data is fetched fresh on every request (no caching yet).
export const dynamic = "force-dynamic";

async function fetchProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data } = await getSupabase()
      .from("projects")
      .select("*")
      .order("created_at", { ascending: true })
      .returns<Project[]>();
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const projects = await fetchProjects();
  return (
    <div className="flex min-h-screen">
      <Sidebar projects={projects} />
      <main className="max-w-[1360px] flex-1 px-[30px] pb-10 pt-6">
        {children}
      </main>
    </div>
  );
}
