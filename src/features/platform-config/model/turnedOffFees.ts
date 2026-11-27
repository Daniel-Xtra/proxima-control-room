/** The parts of a rule that decide which charges it covers. */
interface Coverage {
  id: number;
  code: string;
  transaction_type: string | null;
  channel: string | null;
  customer_segment: string | null;
  biller_code: string | null;
  business_id: string | null;
  product_code: string | null;
  min_transaction_amount: number | null;
  max_transaction_amount: number | null;
}

const SCOPE = [
  "code",
  "transaction_type",
  "channel",
  "customer_segment",
  "biller_code",
  "business_id",
  "product_code",
] as const;

/** Same charge and overlapping amount bands. A missing end of a band has no limit. */
function sameCharge(a: Coverage, b: Coverage) {
  if (SCOPE.some((field) => (a[field] ?? "") !== (b[field] ?? ""))) return false;
  const low = Math.max(
    a.min_transaction_amount ?? -Infinity,
    b.min_transaction_amount ?? -Infinity,
  );
  const high = Math.min(a.max_transaction_amount ?? Infinity, b.max_transaction_amount ?? Infinity);
  return low <= high;
}

/**
 * Inactive rules that are really off. Changing a fee also leaves the old version inactive, so a rule is left out when
 * an active rule covers the same charge, and only the newest version of each charge is kept.
 */
export function turnedOff<T extends Coverage>(inactive: T[], active: Coverage[]): T[] {
  const kept: T[] = [];
  for (const rule of [...inactive].sort((a, b) => b.id - a.id)) {
    if (![...active, ...kept].some((other) => sameCharge(rule, other))) kept.push(rule);
  }
  return kept;
}
