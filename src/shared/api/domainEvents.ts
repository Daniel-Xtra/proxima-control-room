/**
 * Tiny pub/sub so mock APIs in different features can react to each other
 * (for example an approved freeze request updating the customer record)
 * without importing one another. Replaced by the real backend later.
 */
export type DomainEvent =
  | { type: "account.frozen"; customerId: string; by: string; reason: string }
  | { type: "account.unfrozen"; customerId: string; by: string; reason: string }
  | {
      type: "limits.changed";
      customerId: string;
      dailyLimitKobo: number;
      perTransactionLimitKobo: number;
    };

type Handler = (event: DomainEvent) => void;
const handlers = new Set<Handler>();

export function onDomainEvent(handler: Handler) {
  handlers.add(handler);
}

export function emitDomainEvent(event: DomainEvent) {
  handlers.forEach((handler) => handler(event));
}
