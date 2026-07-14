import { todayISO } from "./dates";
import { RFI_EXPORT_HEADERS } from "./export-logic";
import {
  isClosedState,
  parseOptionalHttpUrl,
  RFI_STATUS_FLOW,
  RFI_STATUS_LABELS,
} from "./rfi-logic";
import type { RfiStatus } from "./types";

// Import mirrors the export format: the same headers, with the derived
// columns (Days Open, Overdue) accepted but ignored.
export const IMPORT_MAX_FILE_BYTES = 2 * 1024 * 1024;
export const IMPORT_MAX_ROWS = 500;

/** A cell as SheetJS hands it to us (cellDates: true). */
export type ImportCell = string | number | boolean | Date | null | undefined;
export type ImportRawRow = Record<string, ImportCell>;

export interface ImportRfiValues {
  rfi_number: string | null; // null → DB trigger auto-assigns
  description: string;
  discipline: string | null;
  contractor: string | null;
  link_design_package: string | null;
  link_blue_bin_section: string | null;
  date_submitted: string;
  due_date: string;
  date_answered: string | null;
  status: RfiStatus;
}

export type ImportOutcome = "valid" | "error" | "duplicate";

export interface ImportRowResult {
  /** 1-based row number in the spreadsheet (header = row 1). */
  rowNumber: number;
  outcome: ImportOutcome;
  values: ImportRfiValues | null;
  errors: string[];
  /** Raw number/description for the preview table, present even on errors. */
  display: { rfi_number: string; description: string };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

const KNOWN_HEADERS = new Map(
  RFI_EXPORT_HEADERS.map((h) => [normalizeHeader(h), h]),
);
const REQUIRED_HEADERS = ["RFI Number", "Description", "Date Submitted", "Due Date"];

/** Checks the parsed sheet has the columns we need. Returns an error message
 *  for the whole file, or null when the headers are usable. */
export function validateImportHeaders(headers: string[]): string | null {
  const present = new Set(
    headers.map(normalizeHeader).filter((h) => KNOWN_HEADERS.has(h)),
  );
  const missing = REQUIRED_HEADERS.filter(
    (h) => !present.has(normalizeHeader(h)),
  );
  if (missing.length > 0) {
    return `Missing required column(s): ${missing.join(", ")}. Use the same headers as the RFI export.`;
  }
  return null;
}

/** Case-insensitive cell lookup by canonical export header. */
function cell(row: ImportRawRow, header: string): ImportCell {
  const want = normalizeHeader(header);
  for (const key of Object.keys(row)) {
    if (normalizeHeader(key) === want) return row[key];
  }
  return undefined;
}

function asTrimmedString(value: ImportCell): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return dateToISO(value);
  return String(value).trim();
}

function dateToISO(d: Date): string {
  // Excel date cells come back as Date at local/UTC midnight; use UTC parts
  // so the calendar date is never shifted by timezone.
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Accepts yyyy-mm-dd strings or Excel Date cells; "" when empty/invalid. */
function parseDateCell(value: ImportCell): string {
  const s = asTrimmedString(value);
  if (!s) return "";
  if (DATE_RE.test(s)) return s;
  return "invalid";
}

const STATUS_BY_INPUT = new Map<string, RfiStatus>([
  ...RFI_STATUS_FLOW.map((s) => [s.toLowerCase(), s] as const),
  ...RFI_STATUS_FLOW.map(
    (s) => [RFI_STATUS_LABELS[s].toLowerCase(), s] as const,
  ),
]);

export function validateImportRows(
  rawRows: ImportRawRow[],
  existingNumbers: Iterable<string>,
  today: string = todayISO(),
): ImportRowResult[] {
  const taken = new Set(
    Array.from(existingNumbers, (n) => n.trim().toLowerCase()),
  );

  return rawRows.map((row, i) => {
    const errors: string[] = [];
    let duplicate = false;

    const rfiNumber = asTrimmedString(cell(row, "RFI Number"));
    const description = asTrimmedString(cell(row, "Description"));
    const discipline = asTrimmedString(cell(row, "Discipline"));
    const contractor = asTrimmedString(cell(row, "Contractor"));
    const statusRaw = asTrimmedString(cell(row, "Status"));
    const dateSubmitted = parseDateCell(cell(row, "Date Submitted"));
    const dueDate = parseDateCell(cell(row, "Due Date"));
    const dateAnswered = parseDateCell(cell(row, "Date Answered"));

    if (!description) errors.push("Description is required.");

    if (!dateSubmitted) errors.push("Date Submitted is required.");
    else if (dateSubmitted === "invalid")
      errors.push("Date Submitted must be a date (yyyy-mm-dd).");

    if (!dueDate) errors.push("Due Date is required.");
    else if (dueDate === "invalid")
      errors.push("Due Date must be a date (yyyy-mm-dd).");

    if (
      DATE_RE.test(dateSubmitted) &&
      DATE_RE.test(dueDate) &&
      dueDate < dateSubmitted
    )
      errors.push("Due Date cannot be before Date Submitted.");

    if (dateAnswered === "invalid")
      errors.push("Date Answered must be a date (yyyy-mm-dd) or empty.");

    let status: RfiStatus = "open";
    if (statusRaw) {
      const matched = STATUS_BY_INPUT.get(statusRaw.toLowerCase());
      if (matched) status = matched;
      else
        errors.push(
          `Unknown status "${statusRaw}" (expected: ${RFI_STATUS_FLOW.map((s) => RFI_STATUS_LABELS[s]).join(", ")}).`,
        );
    }

    const designPackage = parseOptionalHttpUrl(
      asTrimmedString(cell(row, "Design Package Link")),
    );
    if (!designPackage.valid)
      errors.push("Design Package Link must be a valid http(s) URL.");
    const blueBin = parseOptionalHttpUrl(
      asTrimmedString(cell(row, "Blue Bin Section Link")),
    );
    if (!blueBin.valid)
      errors.push("Blue Bin Section Link must be a valid http(s) URL.");

    if (rfiNumber) {
      const key = rfiNumber.toLowerCase();
      if (taken.has(key)) {
        duplicate = true;
        errors.push(`RFI Number "${rfiNumber}" already exists in this project or file.`);
      } else {
        taken.add(key);
      }
    }

    const outcome: ImportOutcome =
      duplicate ? "duplicate" : errors.length > 0 ? "error" : "valid";

    // date_answered follows the status, mirroring updateRfi in the RFI form.
    const answered = DATE_RE.test(dateAnswered) ? dateAnswered : null;
    const values: ImportRfiValues | null =
      outcome === "valid"
        ? {
            rfi_number: rfiNumber || null,
            description,
            discipline: discipline || null,
            contractor: contractor || null,
            link_design_package: designPackage.url,
            link_blue_bin_section: blueBin.url,
            date_submitted: dateSubmitted,
            due_date: dueDate,
            date_answered: isClosedState(status) ? (answered ?? today) : null,
            status,
          }
        : null;

    return {
      rowNumber: i + 2,
      outcome,
      values,
      errors,
      display: { rfi_number: rfiNumber, description },
    };
  });
}
