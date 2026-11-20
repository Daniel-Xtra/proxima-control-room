import { BANKS, MAX_PAYEE_KOBO, type PayeeDraft } from "./types";

export const PAYEE_COLUMNS = ["account_name", "account_number", "bank", "amount", "narration"];

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
/** How many of them are real platform customers (internal accounts), when that many exist. */
export const TEMPLATE_INTERNAL_ROWS = 25;

/** A real platform customer, used for an internal row in the template. */
export interface TemplatePayee {
  name: string;
  accountNumber: string;
  bank: string;
}

/** Column widths for the template, in characters. */
export const TEMPLATE_WIDTHS = [26, 16, 28, 14, 22];

/**
 * The rows of the downloadable template: a header and 50 sample payees, ready to be overwritten with real ones. The first rows are
 * real platform customers (internal accounts, paid as credits inside the platform), the rest are accounts at other banks, so both
 * kinds can be tried. Pass the bank names the API knows, so every row names a bank it can match. Account numbers are text, so they
 * keep their leading zeros; amounts are numbers.
 */
export function templateRows(
  banks: readonly string[] = BANKS,
  internal: readonly TemplatePayee[] = [],
): (string | number)[][] {
  const platform = internal.slice(0, TEMPLATE_INTERNAL_ROWS);
  const rows = Array.from({ length: TEMPLATE_ROWS }, (_, i): (string | number)[] => {
    const amount = Number(((i + 1) * 2_500 + (i % 4) * 150.5).toFixed(2));
    const narration = `Sample payout ${i + 1}`;
    const real = platform[i];
    if (real) return [real.name, real.accountNumber, real.bank, amount, narration];
    const n = i - platform.length;
    const name = `${SAMPLE_FIRST[n % SAMPLE_FIRST.length]} ${SAMPLE_LAST[Math.floor(n / SAMPLE_FIRST.length) % SAMPLE_LAST.length]}`;
    // Ten digits, always starting with 0 or 1 to look like a real NUBAN, and different on every row.
    const account = String(1_000_000_000 + i * 7_919_003).padStart(10, "0");
    return [name, account, banks[n % banks.length] ?? "", amount, narration];
  });
  return [PAYEE_COLUMNS, ...rows];
}

/** A cell as read from an Excel sheet. */
export type Cell = string | number | boolean | Date | null | undefined;

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

const HEADER_WORDS = new Set([
  "account_name",
  "account_type",
  "name",
  "beneficiary",
  "account_number",
  "account_no",
  "bank",
  "bank_name",
  "amount",
  "narration",
]);

/** A header row names its columns: two or more cells are known column names. */
function isHeader(row: Cell[]): boolean {
  const matches = row.filter((cell) =>
    HEADER_WORDS.has(text(cell).toLowerCase().replace(/[s_]+/g, "_")),
  );
  return matches.length >= 2;
}

/** Turns sheet rows into payee drafts. A header row is skipped when present. */
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

/** Checks every draft and flags duplicates (same bank and account, whatever the amount) within the batch. */
export function validateDrafts(drafts: PayeeDraft[]): PayeeDraft[] {
  const seen = new Set<string>();
  return drafts.map((draft) => {
    const errors: PayeeDraft["errors"] = [];
    if (draft.accountName.length < 2) errors.push("bulk.err.name");
    if (!/^\d{10}$/.test(draft.accountNumber)) errors.push("bulk.err.account");
    // The bank name is matched to a bank code when the batch is submitted. It may be left blank for a platform customer,
    // which only the server can tell, so Verify accounts and Submit check it.
    if (draft.amountKobo === null || draft.amountKobo <= 0) errors.push("bulk.err.amount");
    else if (draft.amountKobo > MAX_PAYEE_KOBO) errors.push("bulk.err.amountMax");
    // The server's rule: one payee is one bank and account, whatever the amount.
    const key = `${draft.bank.toLowerCase().replace(/[^a-z0-9]/g, "")}:${draft.accountNumber}`;
    if (errors.length === 0 && seen.has(key)) errors.push("bulk.err.duplicate");
    seen.add(key);
    return { ...draft, errors };
  });
}
