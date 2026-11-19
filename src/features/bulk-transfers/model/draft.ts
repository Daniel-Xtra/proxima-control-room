import { isScheduleAllowed } from "@/shared/lib/schedule";
import { validateDrafts } from "./payeeRows";
import type { PayeeDraft, SourceAccount } from "./types";

export { isScheduleAllowed, scheduleWindow, toLocalInput } from "@/shared/lib/schedule";

export type Timing = "now" | "scheduled";

/** Everything the create flow collects before the batch is submitted. */
export interface BatchDraft {
  name: string;
  source: SourceAccount;
  timing: Timing;
  /** Local `datetime-local` value, used when timing is "scheduled". */
  when: string;
  payees: PayeeDraft[];
}

export const EMPTY_DRAFT: BatchDraft = {
  name: "",
  source: "",
  timing: "now",
  when: "",
  payees: [],
};

export function renumber(payees: PayeeDraft[]): PayeeDraft[] {
  return validateDrafts(payees.map((payee, index) => ({ ...payee, row: index + 1 })));
}

/** A row that cannot be paid: it has a format error, or verification found it is not payable. */
export const needsFixing = (payee: PayeeDraft) =>
  payee.errors.length > 0 || payee.check?.status === "invalid";

export function draftTotals(payees: PayeeDraft[], feeKobo: number) {
  const invalid = payees.filter(needsFixing).length;
  const totalKobo = payees.reduce((sum, p) => sum + (p.amountKobo ?? 0), 0);
  return {
    count: payees.length,
    valid: payees.length - invalid,
    invalid,
    totalKobo,
    feeKobo,
    debitKobo: totalKobo + feeKobo,
  };
}

export function scheduledDate(draft: BatchDraft): Date | null {
  if (draft.timing !== "scheduled" || !draft.when) return null;
  const date = new Date(draft.when);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isTimingValid(draft: BatchDraft, now: Date): boolean {
  if (draft.timing === "now") return true;
  const date = scheduledDate(draft);
  return date !== null && isScheduleAllowed(date, now);
}

export const detailsComplete = (draft: BatchDraft, now: Date) =>
  draft.name.trim().length >= 3 && isTimingValid(draft, now);

/** Rows that have not been checked against the accounts yet. Rows with a format error are counted under needsFixing instead. */
export const unverifiedCount = (payees: PayeeDraft[]) =>
  payees.filter((p) => p.errors.length === 0 && !p.check).length;

/** The list can go on only when every row is verified and none needs fixing. */
export const payeesComplete = (draft: BatchDraft) =>
  draft.payees.length > 0 &&
  draft.payees.every((p) => !needsFixing(p)) &&
  unverifiedCount(draft.payees) === 0;
