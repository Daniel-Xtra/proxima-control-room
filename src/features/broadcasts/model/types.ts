export const CHANNELS = ["push", "sms", "email"] as const;
export type Channel = (typeof CHANNELS)[number];

export type KycRule = "any" | "level1" | "level2";
export type FlagRule = "any" | "yes" | "no";
export type GenderRule = "any" | "male" | "female";

/** Who is in a segment. Every rule must match; "any" or empty means the rule is not used. */
export interface AudienceRules {
  kyc: KycRule;
  /** Whether the customer finished KYC. */
  kycCompleted: FlagRule;
  gender: GenderRule;
  /** Joined on or after this date (YYYY-MM-DD), or empty. */
  joinedFrom: string;
  /** Joined on or before this date (YYYY-MM-DD), or empty. */
  joinedTo: string;
  /** Has an active fixed deposit. */
  fixedDeposit: FlagRule;
  /** Has active target savings. */
  targetSavings: FlagRule;
}

export interface SegmentDraft {
  name: string;
  description: string;
  rules: AudienceRules;
}

export interface AudienceSegment extends SegmentDraft {
  id: string;
  /** The "everyone" option. It is not stored, and cannot be edited or deleted. */
  builtIn: boolean;
  /** Customers the rules reach right now. */
  size: number;
  updatedAt: string;
}

export interface SegmentFilters {
  search: string;
}

export const ALL_SEGMENT_ID = "segment-all";

export const EMPTY_RULES: AudienceRules = {
  kyc: "any",
  kycCompleted: "any",
  gender: "any",
  joinedFrom: "",
  joinedTo: "",
  fixedDeposit: "any",
  targetSavings: "any",
};

/** Sends to more people than this ask for a typed confirmation. */
export const LARGE_AUDIENCE = 10_000;

export const LIMITS = {
  pushTitle: 65,
  pushBody: 240,
  smsBody: 480,
  smsSegment: 160,
  emailSubject: 120,
  emailBody: 5000,
} as const;

export type BroadcastStatus =
  "pending_approval" | "scheduled" | "sending" | "sent" | "failed" | "rejected" | "cancelled";
/** "queued" means handed to the delivery queue: final delivery to the device is not tracked. */
export type DeliveryStatus = "queued" | "failed" | "skipped";

export interface DeliveryRecord {
  id: string;
  /** Already masked for display. */
  recipient: string;
  status: DeliveryStatus;
  reason?: string;
}

export interface Broadcast {
  id: string;
  name: string;
  channel: Channel;
  /** Push title or email subject. Empty for SMS. */
  subject: string;
  body: string;
  segmentId: string;
  /** The segment's name when the broadcast was written, so later edits or deletes do not change history. */
  segmentName: string;
  recipientCount: number;
  status: BroadcastStatus;
  /** ISO time to send at. Empty means right after approval. */
  scheduledFor?: string;
  createdBy: string;
  createdAt: string;
  reason: string;
  decidedBy?: string;
  decidedAt?: string;
  decisionComment?: string;
  delivered: number;
  failed: number;
  log: DeliveryRecord[];
}

export type BroadcastRow = Omit<Broadcast, "log">;

/** Message content that can be saved as a template and reused. */
export interface TemplateDraft {
  name: string;
  channel: Channel;
  /** Push title or email subject. Empty for SMS. */
  subject: string;
  body: string;
}

export interface BroadcastTemplate extends TemplateDraft {
  id: string;
  updatedAt: string;
}

export interface TemplateFilters {
  search: string;
  channel: string;
}

export interface BroadcastFilters {
  search: string;
  status: string;
  channel: string;
}

/** What the compose form collects before a broadcast is submitted. */
export interface BroadcastDraft {
  name: string;
  channel: Channel;
  segmentId: string;
  subject: string;
  body: string;
  timing: "now" | "scheduled";
  when: string;
}

export const EMPTY_BROADCAST: BroadcastDraft = {
  name: "",
  channel: "push",
  segmentId: ALL_SEGMENT_ID,
  subject: "",
  body: "",
  timing: "now",
  when: "",
};
