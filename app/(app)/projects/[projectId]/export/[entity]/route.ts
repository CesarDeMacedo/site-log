import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
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
  request: Request,
  { params }: { params: Promise<{ projectId: string; entity: string }> },
) {
  const { projectId, entity } = await params;
  const format = new URL(request.url).searchParams.get("format") ?? "csv";
  if (format !== "csv" && format !== "xlsx") {
    return NextResponse.json({ error: "Unknown format" }, { status: 400 });
  }
  const config = ENTITIES[entity as EntityKey];
  if (!config) {
    return NextResponse.json({ error: "Unknown export" }, { status: 404 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const supabase = await getSupabase();
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
  const filename = `rfi-log-${entity}-${today}.${format}`;

  if (format === "xlsx") {
    const sheet = XLSX.utils.aoa_to_sheet([[...config.headers], ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "RFI Log");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const csv = toCsv([...config.headers], rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
