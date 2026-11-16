import { daysAgo } from "@/shared/api/mockFixtures";
import { ALL_SEGMENT_ID, EMPTY_RULES, type AudienceRules } from "../model/types";

/** A segment as kept in the mock store. Size and usage are worked out when it is listed. */
export interface StoredSegment {
  id: string;
  name: string;
  description: string;
  rules: AudienceRules;
  builtIn: boolean;
  updatedBy: string;
  updatedAt: string;
}

export const SEGMENT_IDS = {
  kyc2: "00000000-0000-4000-8000-000a00000001",
  kyc1: "00000000-0000-4000-8000-000a00000002",
  noKyc: "00000000-0000-4000-8000-000a00000003",
  new30: "00000000-0000-4000-8000-000a00000004",
  inactive60: "00000000-0000-4000-8000-000a00000005",
  savings: "00000000-0000-4000-8000-000a00000006",
} as const;

function seed(
  id: string,
  name: string,
  description: string,
  rules: Partial<AudienceRules>,
  days: number,
  builtIn = false,
): StoredSegment {
  return {
    id,
    name,
    description,
    rules: { ...EMPTY_RULES, ...rules },
    builtIn,
    updatedBy: builtIn ? "System" : days % 2 ? "Seyi Martins" : "Tolu Adebayo",
    updatedAt: daysAgo(days, 11),
  };
}

let segments: StoredSegment[] | null = null;

export function allSegments(): StoredSegment[] {
  segments ??= [
    seed(ALL_SEGMENT_ID, "All customers", "Everyone with a Proxima account.", {}, 90, true),
    seed(
      SEGMENT_IDS.kyc2,
      "KYC level 2 customers",
      "Fully verified customers.",
      { kyc: "level2" },
      40,
    ),
    seed(
      SEGMENT_IDS.kyc1,
      "KYC level 1 customers",
      "Verified with NIN only. Good for upgrade nudges.",
      { kyc: "level1" },
      33,
    ),
    seed(
      SEGMENT_IDS.noKyc,
      "Customers without KYC",
      "Signed up but not verified yet.",
      { kyc: "none" },
      28,
    ),
    seed(
      SEGMENT_IDS.new30,
      "New customers (30 days)",
      "Joined in the last month.",
      { joinedWithinDays: 30 },
      15,
    ),
    seed(
      SEGMENT_IDS.inactive60,
      "Inactive for 60 days",
      "No activity for two months.",
      { inactiveDays: 60 },
      9,
    ),
    seed(
      SEGMENT_IDS.savings,
      "Customers with savings",
      "Hold a fixed deposit or target savings.",
      { savings: "yes" },
      5,
    ),
  ];
  return segments;
}

export function replaceSegments(next: StoredSegment[]) {
  segments = next;
}

export function findSegment(id: string): StoredSegment | undefined {
  return allSegments().find((segment) => segment.id === id);
}
