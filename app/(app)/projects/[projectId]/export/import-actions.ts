"use server";

import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { todayISO } from "@/lib/dates";
import {
  IMPORT_MAX_FILE_BYTES,
  IMPORT_MAX_ROWS,
  validateImportHeaders,
  validateImportRows,
  type ImportRawRow,
  type ImportRfiValues,
  type ImportRowResult,
} from "@/lib/import-logic";
import { getSupabase } from "@/lib/supabase/server";

export interface ImportPreview {
  ok: boolean;
  error?: string;
  rows?: ImportRowResult[];
}

export interface ImportResult {
  ok: boolean;
  error?: string;
  imported?: number;
  skipped?: number;
}

async function fetchExistingNumbers(projectId: string): Promise<string[]> {
  const { data, error } = await getSupabase()
    .from("rfis")
    .select("rfi_number")
    .eq("project_id", projectId)
    .returns<{ rfi_number: string }[]>();
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.rfi_number);
}

function parseSpreadsheet(
  buffer: ArrayBuffer,
): { rows: ImportRawRow[]; headers: string[]; error?: never } | { error: string } {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { cellDates: true });
  } catch {
    return { error: "Could not read the file. Upload a .xlsx or .csv file." };
  }
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { error: "The file has no sheets." };
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<ImportRawRow>(sheet, { defval: null });
  const headerMatrix = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    range: 0,
  });
  const headers = (headerMatrix[0] ?? []).map((h) => String(h ?? ""));
  return { rows, headers };
}

export async function previewRfiImport(formData: FormData): Promise<ImportPreview> {
  const projectId = String(formData.get("project_id") ?? "");
  if (!projectId) return { ok: false, error: "Missing project." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "Choose a .xlsx or .csv file first." };
  if (file.size > IMPORT_MAX_FILE_BYTES)
    return { ok: false, error: "File is too large (max 2 MB)." };

  const parsed = parseSpreadsheet(await file.arrayBuffer());
  if ("error" in parsed) return { ok: false, error: parsed.error };
  if (parsed.rows.length === 0)
    return { ok: false, error: "The file has no data rows." };
  if (parsed.rows.length > IMPORT_MAX_ROWS)
    return { ok: false, error: `Too many rows (max ${IMPORT_MAX_ROWS}).` };

  const headerError = validateImportHeaders(parsed.headers);
  if (headerError) return { ok: false, error: headerError };

  try {
    const existing = await fetchExistingNumbers(projectId);
    const rows = validateImportRows(parsed.rows, existing, todayISO());
    return { ok: true, rows };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Database error." };
  }
}

/** Inserts the rows the user confirmed. The client sends the normalized
 *  values from the preview, but nothing is trusted: rows are mapped back to
 *  the import format and re-run through the exact same validation, with
 *  duplicates re-checked against fresh numbers — covering RFIs created
 *  between preview and confirm. */
export async function confirmRfiImport(
  projectId: string,
  rows: ImportRfiValues[],
): Promise<ImportResult> {
  if (!projectId) return { ok: false, error: "Missing project." };
  if (!Array.isArray(rows) || rows.length === 0)
    return { ok: false, error: "Nothing to import." };
  if (rows.length > IMPORT_MAX_ROWS)
    return { ok: false, error: `Too many rows (max ${IMPORT_MAX_ROWS}).` };

  const rawRows: ImportRawRow[] = rows.map((v) => ({
    "RFI Number": v.rfi_number,
    Description: v.description,
    Discipline: v.discipline,
    Contractor: v.contractor,
    "Design Package Link": v.link_design_package,
    "Blue Bin Section Link": v.link_blue_bin_section,
    "Date Submitted": v.date_submitted,
    "Due Date": v.due_date,
    "Date Answered": v.date_answered,
    Status: v.status,
  }));

  try {
    const existing = await fetchExistingNumbers(projectId);
    const results = validateImportRows(rawRows, existing, todayISO());
    const valid = results.filter((r) => r.outcome === "valid" && r.values);
    if (valid.length === 0)
      return { ok: false, error: "No valid rows left to import." };

    const { error } = await getSupabase()
      .from("rfis")
      .insert(valid.map((r) => ({ project_id: projectId, ...r.values })));
    if (error) return { ok: false, error: error.message };

    revalidatePath(`/projects/${projectId}/rfis`);
    revalidatePath(`/projects/${projectId}`);
    return { ok: true, imported: valid.length, skipped: rows.length - valid.length };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Database error." };
  }
}
