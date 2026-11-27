export interface Biller {
  id: number;
  name: string;
  enabled: boolean;
  /** False when the biller catalogue marks it inactive: the app does not show it either way. */
  listed: boolean;
}

export interface BillType extends Biller {
  billers: Biller[];
}

export interface BillServices {
  provider: string | null;
  /** False when the provider's payments cannot be traced to a biller, so a switch only hides it. */
  enforced: boolean;
  groups: BillType[];
}

/** A bill type stays whole when its own name matches; otherwise only its matching billers stay. */
export function searchBillTypes(groups: BillType[], query: string): BillType[] {
  const wanted = query.trim().toLowerCase();
  if (!wanted) return groups;
  const matches = (name: string) => name.toLowerCase().includes(wanted);
  return groups.flatMap((group) => {
    if (matches(group.name)) return [group];
    const billers = group.billers.filter((biller) => matches(biller.name));
    return billers.length > 0 ? [{ ...group, billers }] : [];
  });
}

export function searchBillers(billers: Biller[], query: string): Biller[] {
  const wanted = query.trim().toLowerCase();
  return billers.filter((biller) => biller.name.toLowerCase().includes(wanted));
}

/** Unsaved ticks, by biller id. Only billers ticked differently from what is saved are listed. */
export type BillerDraft = ReadonlyMap<number, boolean>;

export function selectBillers(draft: BillerDraft, billers: Biller[], enabled: boolean) {
  const next = new Map(draft);
  for (const biller of billers) {
    if (biller.enabled === enabled) next.delete(biller.id);
    else next.set(biller.id, enabled);
  }
  return next;
}

/** The billers a save would switch on and off. A tick the server already matches is left out. */
export function draftChanges(billers: Biller[], draft: BillerDraft) {
  const changed = billers.filter(
    (biller) => (draft.get(biller.id) ?? biller.enabled) !== biller.enabled,
  );
  return {
    enable: changed.filter((biller) => !biller.enabled),
    disable: changed.filter((biller) => biller.enabled),
  };
}

/** Switches an admin has turned off: whole bill types plus single billers. */
export function countSwitchedOff(groups: BillType[]) {
  return {
    types: groups.filter((group) => !group.enabled).length,
    billers: groups.flatMap((group) => group.billers).filter((biller) => !biller.enabled).length,
  };
}
