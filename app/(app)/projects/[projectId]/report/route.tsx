import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { todayISO } from "@/lib/dates";
import { reportFilename } from "@/lib/report-logic";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Project, Rfi } from "@/lib/types";
import { RfiReportDocument } from "./rfi-report-pdf";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { projectId } = await params;
  const supabase = await getSupabase();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle<Project>();
  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: rfis, error } = await supabase
    .from("rfis")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: true })
    .returns<Rfi[]>();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const today = todayISO();
  const buffer = await renderToBuffer(
    <RfiReportDocument project={project} rfis={rfis ?? []} today={today} />,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${reportFilename(project.name, today)}"`,
      "Cache-Control": "no-store",
    },
  });
}
