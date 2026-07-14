import Link from "next/link";
import { Notice, SetupNotice } from "@/components/notice";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";
import { ProjectCreateButton } from "./project-create-modal";

export const dynamic = "force-dynamic";

const TH_CLASS =
  "border-b border-line px-[18px] py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.6px] text-muted-2";
const TD_CLASS = "border-b border-line/60 px-[18px] py-[11px]";

export default async function ProjectsPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const { data: projects, error } = await (await getSupabase())
    .from("projects")
    .select("*")
    .order("created_at", { ascending: true })
    .returns<Project[]>();

  if (error) return <Notice title="Database error">{error.message}</Notice>;

  const list = projects ?? [];

  return (
    <>
      <div className="mb-[22px]">
        <div className="mb-1 font-mono text-[11px] tracking-[1px] text-blueprint">
          PORTFOLIO · ALL PROJECTS
        </div>
        <h1 className="mb-1 font-display text-[26px] font-semibold tracking-[0.3px]">
          Projects
        </h1>
        <div className="text-[13px] text-muted">
          Each project has its own RFI log.
        </div>
      </div>

      <div className="max-w-[900px] rounded-lg border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-[18px] pb-3 pt-4">
          <h2 className="font-display text-[15px] font-semibold tracking-[0.3px]">
            Project List
          </h2>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-muted">
              {list.length} {list.length === 1 ? "project" : "projects"}
            </span>
            <ProjectCreateButton />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                {["Project", "General contractor", "PM", "Created", ""].map((h, i) => (
                  <th key={i} className={TH_CLASS}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child_td]:border-b-0">
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-[18px] py-8 text-center text-muted">
                    No projects yet — create the first one.
                  </td>
                </tr>
              )}
              {list.map((project) => (
                <tr key={project.id} className="transition-colors hover:bg-blueprint/4">
                  <td className={`${TD_CLASS}`}>
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-semibold text-text hover:text-blueprint"
                    >
                      {project.name}
                    </Link>
                  </td>
                  <td className={`${TD_CLASS} text-xs text-muted`}>
                    {project.general_contractor ?? "—"}
                  </td>
                  <td className={`${TD_CLASS} text-xs text-muted`}>
                    {project.pm_name ?? "—"}
                  </td>
                  <td className={`${TD_CLASS} font-mono text-xs text-muted`}>
                    {project.created_at.slice(0, 10)}
                  </td>
                  <td className={`${TD_CLASS} text-right`}>
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-mono text-[11px] text-blueprint hover:underline"
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
