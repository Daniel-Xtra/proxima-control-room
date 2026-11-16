import { isScheduleAllowed } from "@/shared/lib/schedule";
import { validateDrafts } from "./csv";
import { FEE_PER_PAYEE_KOBO, type PayeeDraft, type SourceAccount } from "./types";

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
  source: "settlement",
  timing: "now",
  when: "",
  payees: [],
};

export function renumber(payees: PayeeDraft[]): PayeeDraft[] {
  return validateDrafts(payees.map((payee, index) => ({ ...payee, row: index + 1 })));
}

export function draftTotals(payees: PayeeDraft[]) {
  const invalid = payees.filter((p) => p.errors.length > 0).length;
  const totalKobo = payees.reduce((sum, p) => sum + (p.amountKobo ?? 0), 0);
  const feeKobo = payees.length * FEE_PER_PAYEE_KOBO;
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

export const payeesComplete = (draft: BatchDraft) =>
  draft.payees.length > 0 && draft.payees.every((p) => p.errors.length === 0);
