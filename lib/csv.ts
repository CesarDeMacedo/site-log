export type CsvValue = string | number | null;

const UTF8_BOM = String.fromCharCode(0xfeff);

function escapeField(value: CsvValue): string {
  if (value === null) return "";
  const s = String(value);
  // Quote when the field contains a delimiter, quote, or line break (RFC 4180)
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** RFC 4180 CSV with CRLF line endings and a UTF-8 BOM so Excel opens
 *  accented characters and em dashes correctly. */
export function toCsv(headers: string[], rows: CsvValue[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeField).join(","));
  return UTF8_BOM + lines.join("\r\n") + "\r\n";
}
