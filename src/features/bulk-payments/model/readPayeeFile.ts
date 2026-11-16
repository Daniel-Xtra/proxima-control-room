import { draftsFromRows, parseCsv } from "./csv";
import type { PayeeDraft } from "./types";

export type PayeeFileKind = "csv" | "xlsx";

export function payeeFileKind(file: File): PayeeFileKind | null {
  if (/\.csv$/i.test(file.name)) return "csv";
  if (/\.xlsx$/i.test(file.name)) return "xlsx";
  return null;
}

/** Reads payees from a CSV or an Excel (.xlsx) file. The first sheet is used for Excel. */
export async function readPayeeFile(file: File, kind: PayeeFileKind): Promise<PayeeDraft[]> {
  if (kind === "csv") return draftsFromRows(parseCsv(await file.text()));
  // Loaded on demand so the Excel reader stays out of the main bundle.
  const { readSheet } = await import("read-excel-file/browser");
  const sheet = await readSheet(file);
  // Only text and numbers carry payee data; dates and booleans are ignored.
  return draftsFromRows(
    sheet.map((row) =>
      row.map((cell) => (typeof cell === "string" || typeof cell === "number" ? cell : null)),
    ),
  );
}
