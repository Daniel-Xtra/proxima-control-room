/**
 * Every amount the admin API returns is in kobo, the unit the UI uses, so nothing is converted.
 *
 * Several responses (customer overview, ledger, overview, savings, bulk, tier limits) carry
 * `amount_unit: "naira"`, but the values themselves are kobo: a customer's daily limit arrives as
 * 500000000, which is ₦5,000,000, and a tier-one daily limit as 20000000, which is ₦200,000. The
 * `unit` argument is therefore ignored. It stays so call sites show where the API names a unit.
 * If the backend ever really changes unit, this is the one place to convert.
 */
export type ApiUnit = string | undefined | null;

export const fromApiAmount = (amount: number | undefined | null, _unit?: ApiUnit): number =>
  Math.round(amount ?? 0);

export const toApiAmount = (kobo: number, _unit?: ApiUnit): number => Math.round(kobo);
