import { NextResponse } from "next/server";
import { toCsv, type CsvValue } from "@/lib/csv";
import { todayISO } from "@/lib/dates";
import {
  CHANGE_ORDER_EXPORT_HEADERS,
  changeOrderExportRows,
  RFI_EXPORT_HEADERS,
  rfiExportRows,
  SUBMITTAL_EXPORT_HEADERS,
  submittalExportRows,
} from "@/lib/export-logic";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import type { ChangeOrder, Rfi, Submittal } from "@/lib/types";

export const dynamic = "force-dynamic";

const ENTITIES = {
  rfis: {
    table: "rfis",
    orderBy: "created_at",
    headers: RFI_EXPORT_HEADERS,
    toRows: (data: unknown[], today: string) => rfiExportRows(data as Rfi[], today),
  },
  submittals: {
    table: "submittals",
    orderBy: "created_at",
    headers: SUBMITTAL_EXPORT_HEADERS,
    toRows: (data: unknown[], today: string) =>
      submittalExportRows(data as Submittal[], today),
  },
  "change-orders": {
    table: "change_orders",
    orderBy: "created_at",
    headers: CHANGE_ORDER_EXPORT_HEADERS,
    toRows: (data: unknown[]) => changeOrderExportRows(data as ChangeOrder[]),
  },
} as const;

type EntityKey = keyof typeof ENTITIES;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entity: string }> },
) {
  const { entity } = await params;
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
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ id: string }>();
  if (projectError || !project) {
    return NextResponse.json(
      { error: projectError?.message ?? "No project found" },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from(config.table)
    .select("*")
    .eq("project_id", project.id)
    .order(config.orderBy, { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const today = todayISO();
  const rows: CsvValue[][] = config.toRows(data ?? [], today);
  const csv = toCsv([...config.headers], rows);
  const filename = `site-log-${entity}-${today}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
