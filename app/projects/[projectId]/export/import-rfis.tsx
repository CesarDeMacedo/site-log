"use client";

import { useRef, useState, useTransition } from "react";
import type { ImportRowResult } from "@/lib/import-logic";
import { confirmRfiImport, previewRfiImport } from "./import-actions";

const OUTCOME_STYLE: Record<ImportRowResult["outcome"], string> = {
  valid: "text-success",
  error: "text-danger",
  duplicate: "text-amber",
};
const OUTCOME_LABEL: Record<ImportRowResult["outcome"], string> = {
  valid: "OK",
  error: "ERROR",
  duplicate: "DUPLICATE",
};

const TH_CLASS =
  "border-b border-line px-[18px] py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.6px] text-muted-2";
const TD_CLASS = "border-b border-line/60 px-[18px] py-[9px] align-top";

export function ImportRfis({ projectId }: { projectId: string }) {
  const [rows, setRows] = useState<ImportRowResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const validRows = rows?.filter((r) => r.outcome === "valid") ?? [];
  const errorCount = rows?.filter((r) => r.outcome === "error").length ?? 0;
  const duplicateCount = rows?.filter((r) => r.outcome === "duplicate").length ?? 0;

  function reset() {
    setRows(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handlePreview() {
    const file = fileRef.current?.files?.[0];
    setDone(null);
    setError(null);
    if (!file) {
      setError("Choose a .xlsx or .csv file first.");
      return;
    }
    const formData = new FormData();
    formData.set("project_id", projectId);
    formData.set("file", file);
    startTransition(async () => {
      const result = await previewRfiImport(formData);
      if (result.ok && result.rows) setRows(result.rows);
      else setError(result.error ?? "Something went wrong.");
    });
  }

  function handleConfirm() {
    if (validRows.length === 0) return;
    setError(null);
    startTransition(async () => {
      const result = await confirmRfiImport(
        projectId,
        validRows.map((r) => r.values!),
      );
      if (result.ok) {
        setDone(
          `${result.imported} RFI${result.imported === 1 ? "" : "s"} imported.`,
        );
        reset();
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="mt-4 max-w-[720px] rounded-lg border border-line bg-surface">
      <div className="border-b border-line px-[18px] pb-3 pt-4">
        <h2 className="font-display text-[15px] font-semibold tracking-[0.3px]">
          Import RFIs
        </h2>
        <p className="mt-0.5 text-[12.5px] text-muted">
          Upload a .xlsx or .csv using the same columns as the RFI export.
          Rows are validated first — nothing is saved until you confirm.
          Existing RFIs are never overwritten.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 px-[18px] py-4">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx"
          aria-label="Spreadsheet file"
          onChange={() => {
            setRows(null);
            setDone(null);
            setError(null);
          }}
          className="text-[12.5px] text-muted file:mr-3 file:rounded-md file:border file:border-line file:bg-surface-2 file:px-3 file:py-1.5 file:text-[12.5px] file:font-semibold file:text-text hover:file:border-blueprint"
        />
        {!rows && (
          <button
            onClick={handlePreview}
            disabled={pending}
            className="rounded-md bg-blueprint-dim px-4 py-2 text-[13px] font-semibold text-white hover:brightness-110 disabled:opacity-60"
          >
            {pending ? "Checking…" : "Preview import"}
          </button>
        )}
      </div>

      {error && (
        <p className="mx-[18px] mb-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-[12.5px] text-danger">
          {error}
        </p>
      )}
      {done && (
        <p className="mx-[18px] mb-4 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-[12.5px] text-success">
          {done}
        </p>
      )}

      {rows && (
        <>
          <div className="flex items-center justify-between border-t border-line px-[18px] py-3">
            <span className="font-mono text-[11px] text-muted">
              <b className="text-success">{validRows.length} valid</b>
              {" · "}
              <b className={errorCount ? "text-danger" : ""}>{errorCount} errors</b>
              {" · "}
              <b className={duplicateCount ? "text-amber" : ""}>
                {duplicateCount} duplicates
              </b>
              {" — only valid rows are imported"}
            </span>
            <div className="flex gap-2.5">
              <button
                onClick={reset}
                disabled={pending}
                className="rounded-md px-3 py-1.5 text-[12.5px] font-semibold text-muted hover:text-text"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={pending || validRows.length === 0}
                className="rounded-md bg-blueprint-dim px-4 py-1.5 text-[12.5px] font-semibold text-white hover:brightness-110 disabled:opacity-50"
              >
                {pending
                  ? "Importing…"
                  : `Import ${validRows.length} RFI${validRows.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
          <div className="max-h-[340px] overflow-y-auto overflow-x-auto">
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr>
                  {["Row", "RFI Number", "Description", "Result"].map((h) => (
                    <th key={h} className={TH_CLASS}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="[&_tr:last-child_td]:border-b-0">
                {rows.map((row) => (
                  <tr key={row.rowNumber}>
                    <td className={`${TD_CLASS} font-mono text-xs text-muted`}>
                      {row.rowNumber}
                    </td>
                    <td className={`${TD_CLASS} font-mono text-xs text-blueprint`}>
                      {row.display.rfi_number ||
                        (row.outcome === "valid" ? "auto" : "—")}
                    </td>
                    <td className={`${TD_CLASS} text-xs text-muted`}>
                      {row.display.description}
                      {row.errors.length > 0 && (
                        <span className="block text-danger">
                          {row.errors.join(" ")}
                        </span>
                      )}
                    </td>
                    <td
                      className={`${TD_CLASS} font-mono text-[10.5px] font-semibold ${OUTCOME_STYLE[row.outcome]}`}
                    >
                      {OUTCOME_LABEL[row.outcome]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
