export function csvCell(value: unknown) {
  let text = value == null ? "" : String(value);
  // Prevent spreadsheet formula execution from resident-supplied names and addresses.
  if (/^[\s\uFEFF]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
  return `"${text.replaceAll('"', '""')}"`;
}
export function csvRow(values: unknown[]) { return values.map(csvCell).join(",") + "\r\n"; }
