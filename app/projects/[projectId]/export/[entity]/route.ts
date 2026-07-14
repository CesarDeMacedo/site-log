import { NextResponse } from "next/server";
import { toCsv, type CsvValue } from "@/lib/csv";
import { todayISO } from "@/lib/dates";
import { RFI_EXPORT_HEADERS, rfiExportRows } from "@/lib/export-logic";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Rfi } from "@/lib/types";

export const dynamic = "force-dynamic";

const ENTITIES = {
  rfis: {
    table: "rfis",
    headers: RFI_EXPORT_HEADERS,
    toRows: (data: unknown[], today: string) => rfiExportRows(data as Rfi[], today),
  },
} as const;

type EntityKey = keyof typeof ENTITIES;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; entity: string }> },
) {
  const { projectId, entity } = await params;
  const config = ENTITIES[entity as EntityKey];
  if (!config) {
    return NextResponse.json({ error: "Unknown export" }, { status: 404 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const supabase = getSupabase();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle<{ id: string }>();
  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from(config.table)
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const today = todayISO();
  const rows: CsvValue[][] = config.toRows(data ?? [], today);
  const csv = toCsv([...config.headers], rows);
  const filename = `rfi-log-${entity}-${today}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
