import { draftsFromRows } from "./payeeRows";
import type { PayeeDraft } from "./types";

/** Only Excel (.xlsx) files are read. */
export const isPayeeFile = (file: File) => /\.xlsx$/i.test(file.name);

/** Reads payees from an Excel (.xlsx) file. The first sheet is used. */
export async function readPayeeFile(file: File): Promise<PayeeDraft[]> {
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
