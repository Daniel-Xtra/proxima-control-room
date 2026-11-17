import { BANKS, MAX_PAYEE_KOBO, type PayeeDraft } from "./types";

export const CSV_HEADERS = ["account_name", "account_number", "bank", "amount", "narration"];

const SAMPLE_FIRST = [
  "Ada",
  "Tunde",
  "Ngozi",
  "Ibrahim",
  "Funke",
  "Chinedu",
  "Zainab",
  "Emeka",
  "Halima",
  "Kemi",
];
const SAMPLE_LAST = [
  "Obi",
  "Bello",
  "Eze",
  "Lawal",
  "Adeyemi",
  "Okafor",
  "Nwosu",
  "Balogun",
  "Umar",
  "Salami",
];

/** Number of sample payees in the downloadable template. */
export const TEMPLATE_ROWS = 50;

/** A CSV with a header and 50 valid sample payees, ready to be overwritten with real ones. */
export function csvTemplate(): string {
  const rows = Array.from({ length: TEMPLATE_ROWS }, (_, i) => {
    const name = `${SAMPLE_FIRST[i % SAMPLE_FIRST.length]} ${SAMPLE_LAST[Math.floor(i / SAMPLE_FIRST.length) % SAMPLE_LAST.length]}`;
    // Ten digits, always starting with 0 or 1 to look like a real NUBAN, and different on every row.
    const account = String(1_000_000_000 + i * 7_919_003).padStart(10, "0");
    const bank = BANKS[i % BANKS.length];
    const amount = ((i + 1) * 2_500 + (i % 4) * 150.5).toFixed(2);
    return `${name},${account},${bank},${amount},Sample payout ${i + 1}`;
  });
  return [CSV_HEADERS.join(","), ...rows].join("\n");
}

/** A cell as read from a CSV or an Excel sheet. */
export type Cell = string | number | boolean | Date | null | undefined;

/** Splits CSV text into rows of cells. Handles quoted cells that contain commas or quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
    } else cell += char;
  }
  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

function toKobo(raw: string): number | null {
  const cleaned = raw.replace(/[₦,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

function text(cell: Cell): string {
  if (cell === null || cell === undefined || cell instanceof Date) return "";
  return String(cell).trim();
}

/** Excel keeps account numbers as numbers, which drops leading zeros. Put them back. */
function accountNumber(cell: Cell): string {
  return typeof cell === "number" ? String(cell).padStart(10, "0") : text(cell);
}

function amount(cell: Cell): string {
  return typeof cell === "number" ? cell.toFixed(2) : text(cell);
}

function isHeader(row: Cell[]): boolean {
  const first = text(row[0])
    .toLowerCase()
    .replace(/[\s_]+/g, "_");
  return first === CSV_HEADERS[0];
}

/** Turns sheet rows (from CSV or Excel) into payee drafts. A header row is skipped when present. */
export function draftsFromRows(rows: Cell[][]): PayeeDraft[] {
  const body = rows[0] && isHeader(rows[0]) ? rows.slice(1) : rows;
  return validateDrafts(
    body
      .filter((cells) => cells.some((cell) => text(cell) !== ""))
      .map((cells, index) => ({
        row: index + 1,
        accountName: text(cells[0]),
        accountNumber: accountNumber(cells[1]),
        bank: text(cells[2]),
        amountKobo: toKobo(amount(cells[3])),
        narration: text(cells[4]),
        errors: [],
      })),
  );
}

/** Checks every draft and flags duplicates (same account and amount) within the batch. */
export function validateDrafts(drafts: PayeeDraft[]): PayeeDraft[] {
  const seen = new Set<string>();
  return drafts.map((draft) => {
    const errors: PayeeDraft["errors"] = [];
    if (draft.accountName.length < 2) errors.push("bulk.err.name");
    if (!/^\d{10}$/.test(draft.accountNumber)) errors.push("bulk.err.account");
    // The bank name is matched to a bank code when the batch is submitted.
    if (draft.bank.trim() === "") errors.push("bulk.err.bank");
    if (draft.amountKobo === null || draft.amountKobo <= 0) errors.push("bulk.err.amount");
    else if (draft.amountKobo > MAX_PAYEE_KOBO) errors.push("bulk.err.amountMax");
    const key = `${draft.accountNumber}:${draft.amountKobo}`;
    if (errors.length === 0 && seen.has(key)) errors.push("bulk.err.duplicate");
    seen.add(key);
    return { ...draft, errors };
  });
}
