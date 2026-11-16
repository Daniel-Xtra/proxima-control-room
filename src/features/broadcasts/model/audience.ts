import type { MessageKey } from "@/shared/i18n/t";
import { t } from "@/shared/i18n/t";
import { EMPTY_RULES, type AudienceRules, type SegmentDraft } from "./types";

/** Total customers the estimate starts from. The backend will count real segments. */
export const TOTAL_CUSTOMERS = 12_480;
export const MAX_RULE_DAYS = 365;

const KYC_SHARE = { any: 1, none: 0.28, level1: 0.23, level2: 0.49 } as const;
const SAVINGS_SHARE = { any: 1, yes: 0.33, no: 0.67 } as const;

/** A rough size for a set of rules, until the backend can count a segment. */
export function estimateSize(rules: AudienceRules): number {
  let share = KYC_SHARE[rules.kyc] * SAVINGS_SHARE[rules.savings];
  if (rules.joinedWithinDays !== null) share *= Math.min(1, rules.joinedWithinDays / 150);
  if (rules.inactiveDays !== null) share *= Math.max(0.05, 0.45 - rules.inactiveDays / 200);
  return Math.max(1, Math.round(TOTAL_CUSTOMERS * share));
}

export function rulesAreEmpty(rules: AudienceRules): boolean {
  return (
    rules.kyc === EMPTY_RULES.kyc &&
    rules.savings === EMPTY_RULES.savings &&
    rules.joinedWithinDays === null &&
    rules.inactiveDays === null
  );
}

export type SegmentProblem = "segments.err.name" | "segments.err.days" | "segments.err.rules";

const validDays = (days: number | null) =>
  days === null || (Number.isInteger(days) && days >= 1 && days <= MAX_RULE_DAYS);

/** The built-in segment is exempt from needing a rule: it means everyone. */
export function segmentProblems(draft: SegmentDraft, builtIn = false): SegmentProblem[] {
  const problems: SegmentProblem[] = [];
  if (draft.name.trim().length < 3) problems.push("segments.err.name");
  if (!validDays(draft.rules.joinedWithinDays) || !validDays(draft.rules.inactiveDays)) {
    problems.push("segments.err.days");
  }
  if (!builtIn && rulesAreEmpty(draft.rules)) problems.push("segments.err.rules");
  return problems;
}

const KYC_KEYS: Record<AudienceRules["kyc"], MessageKey | null> = {
  any: null,
  none: "segments.rule.kyc.none",
  level1: "segments.rule.kyc.level1",
  level2: "segments.rule.kyc.level2",
};

const SAVINGS_KEYS: Record<AudienceRules["savings"], MessageKey | null> = {
  any: null,
  yes: "segments.rule.savings.yes",
  no: "segments.rule.savings.no",
};

/** The rules in plain words, for the list and the compose page. */
export function describeRules(rules: AudienceRules): string {
  const parts: string[] = [];
  const kyc = KYC_KEYS[rules.kyc];
  if (kyc) parts.push(t(kyc));
  if (rules.joinedWithinDays !== null) {
    parts.push(t("segments.rule.joined", { days: rules.joinedWithinDays }));
  }
  if (rules.inactiveDays !== null) {
    parts.push(t("segments.rule.inactive", { days: rules.inactiveDays }));
  }
  const savings = SAVINGS_KEYS[rules.savings];
  if (savings) parts.push(t(savings));
  return parts.length > 0 ? parts.join(" · ") : t("segments.rule.everyone");
}
