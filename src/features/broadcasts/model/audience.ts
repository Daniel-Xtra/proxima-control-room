import { t } from "@/shared/i18n/t";
import {
  EMPTY_RULES,
  type AudienceRules,
  type FlagRule,
  type KycRule,
  type SegmentDraft,
} from "./types";

/** The rules as the API takes them. */
export interface ApiRules {
  kyc_level?: 1 | 2;
  is_kyc_completed?: boolean;
  gender?: string[];
  joined_from?: string;
  joined_to?: string;
  has_active_fixed_deposit?: boolean;
  has_active_target_savings?: boolean;
}

const flag = (rule: FlagRule): boolean | undefined =>
  rule === "yes" ? true : rule === "no" ? false : undefined;

const fromFlag = (value: boolean | undefined): FlagRule =>
  value === true ? "yes" : value === false ? "no" : "any";

export function rulesToApi(rules: AudienceRules): ApiRules {
  const api: ApiRules = {};
  if (rules.kyc === "level1") api.kyc_level = 1;
  if (rules.kyc === "level2") api.kyc_level = 2;
  const completed = flag(rules.kycCompleted);
  if (completed !== undefined) api.is_kyc_completed = completed;
  if (rules.gender !== "any") api.gender = [rules.gender];
  if (rules.joinedFrom) api.joined_from = rules.joinedFrom;
  if (rules.joinedTo) api.joined_to = rules.joinedTo;
  const fixed = flag(rules.fixedDeposit);
  if (fixed !== undefined) api.has_active_fixed_deposit = fixed;
  const target = flag(rules.targetSavings);
  if (target !== undefined) api.has_active_target_savings = target;
  return api;
}

export function rulesFromApi(api: ApiRules | null | undefined): AudienceRules {
  const rules = api ?? {};
  const gender = rules.gender?.[0]?.toLowerCase();
  return {
    kyc: rules.kyc_level === 1 ? "level1" : rules.kyc_level === 2 ? "level2" : "any",
    kycCompleted: fromFlag(rules.is_kyc_completed),
    gender: gender === "male" || gender === "female" ? gender : "any",
    joinedFrom: rules.joined_from?.slice(0, 10) ?? "",
    joinedTo: rules.joined_to?.slice(0, 10) ?? "",
    fixedDeposit: fromFlag(rules.has_active_fixed_deposit),
    targetSavings: fromFlag(rules.has_active_target_savings),
  };
}

export function rulesAreEmpty(rules: AudienceRules): boolean {
  return Object.keys(rulesToApi(rules)).length === 0;
}

export type SegmentProblem = "segments.err.name" | "segments.err.dates" | "segments.err.rules";

/** The built-in segment is exempt from needing a rule: it means everyone. */
export function segmentProblems(draft: SegmentDraft, builtIn = false): SegmentProblem[] {
  const problems: SegmentProblem[] = [];
  if (draft.name.trim().length < 3) problems.push("segments.err.name");
  const { joinedFrom, joinedTo } = draft.rules;
  if (joinedFrom && joinedTo && joinedTo < joinedFrom) problems.push("segments.err.dates");
  if (!builtIn && rulesAreEmpty(draft.rules)) problems.push("segments.err.rules");
  return problems;
}

const KYC_KEYS: Record<KycRule, "segments.rule.kyc.level1" | "segments.rule.kyc.level2" | null> = {
  any: null,
  level1: "segments.rule.kyc.level1",
  level2: "segments.rule.kyc.level2",
};

/** The rules in plain words, for the list and the compose page. */
export function describeRules(rules: AudienceRules): string {
  const parts: string[] = [];
  const kyc = KYC_KEYS[rules.kyc];
  if (kyc) parts.push(t(kyc));
  if (rules.kycCompleted === "yes") parts.push(t("segments.rule.kycDone"));
  if (rules.kycCompleted === "no") parts.push(t("segments.rule.kycPending"));
  if (rules.gender !== "any") parts.push(t(`segments.gender.${rules.gender}`));
  if (rules.joinedFrom) parts.push(t("segments.rule.joinedFrom", { date: rules.joinedFrom }));
  if (rules.joinedTo) parts.push(t("segments.rule.joinedTo", { date: rules.joinedTo }));
  if (rules.fixedDeposit === "yes") parts.push(t("segments.rule.fixed.yes"));
  if (rules.fixedDeposit === "no") parts.push(t("segments.rule.fixed.no"));
  if (rules.targetSavings === "yes") parts.push(t("segments.rule.target.yes"));
  if (rules.targetSavings === "no") parts.push(t("segments.rule.target.no"));
  return parts.length > 0 ? parts.join(" · ") : t("segments.rule.everyone");
}

export { EMPTY_RULES };
