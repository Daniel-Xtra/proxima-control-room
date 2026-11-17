/**
 * Amounts from the admin API are expected in kobo, the unit the UI uses. Some responses (the
 * customer overview and the ledger) also carry an `amount_unit`; when it says "naira" the value
 * is converted, so the UI stays right whichever unit the API reports.
 */
export type ApiUnit = "kobo" | "naira" | string | undefined | null;

export const fromApiAmount = (amount: number | undefined | null, unit?: ApiUnit): number =>
  Math.round((amount ?? 0) * (unit === "naira" ? 100 : 1));

export const toApiAmount = (kobo: number, unit?: ApiUnit): number =>
  unit === "naira" ? Math.round(kobo) / 100 : Math.round(kobo);
