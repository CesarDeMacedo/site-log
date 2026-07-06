import { Notice, SetupNotice } from "@/components/notice";
import { getProjectOr404 } from "@/lib/get-project";
import { todayISO } from "@/lib/dates";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Submittal } from "@/lib/types";
import { SubmittalLog } from "./submittal-log";

export const dynamic = "force-dynamic";

export default async function SubmittalsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const { projectId } = await params;
  const project = await getProjectOr404(projectId);

  const { data: submittals, error } = await getSupabase()
    .from("submittals")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .returns<Submittal[]>();

  if (error) return <Notice title="Database error">{error.message}</Notice>;

  return (
    <>
      <div className="mb-[22px] flex flex-wrap items-start justify-between gap-3.5">
        <div>
          <div className="mb-1 font-mono text-[11px] tracking-[1px] text-blueprint">
            CONTRACT ADMINISTRATION · SUBMITTAL LOG
          </div>
          <h1 className="mb-1 font-display text-[26px] font-semibold tracking-[0.3px]">
            {project.name}
          </h1>
          <div className="text-[13px] text-muted">
            {[
              project.general_contractor && `General Contractor: ${project.general_contractor}`,
              project.pm_name && `PM: ${project.pm_name}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
      </div>

      <SubmittalLog
        projectId={project.id}
        submittals={submittals ?? []}
        today={todayISO()}
      />
    </>
  );
}
