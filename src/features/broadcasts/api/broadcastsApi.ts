import { getAuditActor, recordAudit } from "@/shared/api/auditStore";
import { ApiError, simulate } from "@/shared/api/client";
import { FIXTURE_CUSTOMERS, daysAgo } from "@/shared/api/mockFixtures";
import { maskEmail, maskTail } from "@/shared/lib/format";
import { MAX_SCHEDULE_DAYS, isScheduleAllowed } from "@/shared/lib/schedule";
import { contentProblems, draftProblems } from "../model/message";
import { estimateSize } from "../model/audience";
import { SEGMENT_IDS, findSegment } from "./segmentsStore";
import {
  ALL_SEGMENT_ID,
  type Broadcast,
  type BroadcastDraft,
  type BroadcastFilters,
  type BroadcastRow,
  type BroadcastStatus,
  type BroadcastTemplate,
  type Channel,
  type TemplateDraft,
  type TemplateFilters,
  type DeliveryRecord,
} from "../model/types";

const FAILURE_REASONS = ["Number not reachable", "Device token expired", "Mailbox full"];

function buildLog(seed: number, channel: Channel, failedShare: number): DeliveryRecord[] {
  return Array.from({ length: 30 }, (_, i) => {
    const customer = FIXTURE_CUSTOMERS[(seed * 5 + i) % FIXTURE_CUSTOMERS.length]!;
    const failed = (i * 7 + seed) % 100 < failedShare * 100;
    return {
      id: `log-${seed}-${i}`,
      recipient: channel === "email" ? maskEmail(customer.email) : maskTail(customer.phone, 3),
      status: failed ? "failed" : "delivered",
      reason: failed ? FAILURE_REASONS[i % FAILURE_REASONS.length] : undefined,
    };
  });
}

function seed(
  index: number,
  fields: Pick<Broadcast, "name" | "channel" | "subject" | "body" | "segmentId">,
  status: BroadcastStatus,
  createdBy: string,
  days: number,
): Broadcast {
  const segment = findSegment(fields.segmentId)!;
  const recipientCount = estimateSize(segment.rules);
  const sent = status === "sent";
  const failedShare = 0.04;
  const failed = sent ? Math.round(recipientCount * failedShare) : 0;
  const decided = status !== "pending_approval";
  return {
    id: `00000000-0000-4000-8000-0008${index.toString(16).padStart(8, "0")}`,
    ...fields,
    segmentName: segment.name,
    recipientCount,
    status,
    scheduledFor: status === "scheduled" ? daysAgo(-2, 9) : undefined,
    createdBy,
    createdAt: daysAgo(days, 10),
    reason: "Planned customer communication.",
    ...(decided
      ? {
          decidedBy: "Chuka Obi",
          decidedAt: daysAgo(days, 12),
          decisionComment: status === "rejected" ? "Wording needs compliance review." : "Approved.",
        }
      : {}),
    delivered: sent ? recipientCount - failed : 0,
    failed,
    log: sent ? buildLog(index, fields.channel, failedShare) : [],
  };
}

let store: Broadcast[] | null = null;

function all(): Broadcast[] {
  store ??= [
    seed(
      1,
      {
        name: "Weekend maintenance notice",
        channel: "push",
        subject: "Scheduled maintenance",
        body: "Hi {first_name}, transfers pause Sunday 1am to 3am while we upgrade. Thanks for your patience.",
        segmentId: ALL_SEGMENT_ID,
      },
      "pending_approval",
      "Seyi Martins",
      0,
    ),
    seed(
      2,
      {
        name: "Finish your verification",
        channel: "sms",
        subject: "",
        body: "Hi {first_name}, finish your Proxima verification to raise your limits. Open the app to continue.",
        segmentId: SEGMENT_IDS.kyc1,
      },
      "scheduled",
      "Seyi Martins",
      1,
    ),
    seed(
      3,
      {
        name: "Fixed deposit promo",
        channel: "email",
        subject: "Earn up to 14% on your savings",
        body: "Hi {first_name}, lock away savings for 90 days or more and earn up to 14% a year. Open a fixed deposit in the app.",
        segmentId: SEGMENT_IDS.savings,
      },
      "sent",
      "Seyi Martins",
      6,
    ),
    seed(
      4,
      {
        name: "Welcome back",
        channel: "push",
        subject: "We missed you",
        body: "Hi {first_name}, your wallet is ready when you are. Top up in seconds from the app.",
        segmentId: SEGMENT_IDS.inactive60,
      },
      "sent",
      "Tolu Adebayo",
      12,
    ),
    seed(
      5,
      {
        name: "Referral reminder",
        channel: "sms",
        subject: "",
        body: "Hi {first_name}, invite a friend and you both earn a reward after their first transfer.",
        segmentId: SEGMENT_IDS.new30,
      },
      "rejected",
      "Seyi Martins",
      18,
    ),
  ];
  return store;
}

export function listBroadcasts(filters: BroadcastFilters): Promise<BroadcastRow[]> {
  return simulate(() => {
    const needle = filters.search.trim().toLowerCase();
    return all()
      .filter((b) => filters.status === "all" || b.status === filters.status)
      .filter((b) => filters.channel === "all" || b.channel === filters.channel)
      .filter((b) => !needle || `${b.name} ${b.createdBy}`.toLowerCase().includes(needle))
      .map(({ log, ...row }) => {
        void log;
        return row;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });
}

export function getBroadcast(id: string): Promise<Broadcast> {
  return simulate(() => {
    const found = all().find((b) => b.id === id);
    if (!found) throw new ApiError(404, "Broadcast not found.");
    return { ...found, log: found.log.map((r) => ({ ...r })) };
  });
}

let templates: BroadcastTemplate[] | null = null;

function allTemplates(): BroadcastTemplate[] {
  const make = (
    index: number,
    name: string,
    channel: Channel,
    subject: string,
    body: string,
    usedCount: number,
    days: number,
  ): BroadcastTemplate => ({
    id: `00000000-0000-4000-8000-0009${index.toString(16).padStart(8, "0")}`,
    name,
    channel,
    subject,
    body,
    usedCount,
    updatedBy: index % 2 ? "Seyi Martins" : "Tolu Adebayo",
    updatedAt: daysAgo(days, 11),
  });
  templates ??= [
    make(
      1,
      "Maintenance notice",
      "push",
      "Scheduled maintenance",
      "Hi {first_name}, some features will be unavailable briefly while we upgrade our systems. Your money stays safe. Thanks for your patience.",
      4,
      30,
    ),
    make(
      2,
      "Maintenance notice (email)",
      "email",
      "Scheduled maintenance on our platform",
      "Hi {first_name}, some features will be unavailable briefly while we upgrade our systems. Your money stays safe and your balance is unaffected. Thanks for your patience.",
      2,
      30,
    ),
    make(
      3,
      "Verification reminder",
      "sms",
      "",
      "Hi {first_name}, finish verifying your Proxima account to raise your limits. It only takes a few minutes in the app.",
      7,
      21,
    ),
    make(
      4,
      "Verification reminder (push)",
      "push",
      "Finish your verification",
      "Hi {first_name}, finish verifying your account to raise your limits. It only takes a few minutes in the app.",
      3,
      21,
    ),
    make(
      5,
      "Savings promotion",
      "email",
      "Put your money to work",
      "Hi {first_name}, lock away savings for 90 days or more and earn up to 14% a year. Open a fixed deposit in the app.",
      5,
      9,
    ),
    make(
      6,
      "Welcome back",
      "push",
      "We missed you",
      "Hi {first_name}, your wallet is ready when you are. Top up in seconds from the app.",
      1,
      4,
    ),
  ];
  return templates;
}

export function listTemplates(filters: TemplateFilters): Promise<BroadcastTemplate[]> {
  return simulate(() => {
    const needle = filters.search.trim().toLowerCase();
    return allTemplates()
      .filter((tpl) => filters.channel === "all" || tpl.channel === filters.channel)
      .filter((tpl) => !needle || `${tpl.name} ${tpl.subject}`.toLowerCase().includes(needle))
      .map((tpl) => ({ ...tpl }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });
}

export function saveTemplate(
  draft: TemplateDraft,
  id: string | null,
  reason: string,
): Promise<BroadcastTemplate> {
  return simulate(() => {
    if (contentProblems(draft).length > 0) {
      throw new ApiError(422, "Fix the template before saving it.");
    }
    const actor = getAuditActor();
    const content = {
      name: draft.name.trim(),
      channel: draft.channel,
      subject: draft.channel === "sms" ? "" : draft.subject.trim(),
      body: draft.body.trim(),
    };
    if (id) {
      const existing = allTemplates().find((tpl) => tpl.id === id);
      if (!existing) throw new ApiError(404, "Template not found.");
      Object.assign(existing, content, { updatedBy: actor, updatedAt: new Date().toISOString() });
      recordAudit({ action: "broadcast_template.update", target: existing.name, reason });
      return { ...existing };
    }
    const created: BroadcastTemplate = {
      id: crypto.randomUUID(),
      ...content,
      usedCount: 0,
      updatedBy: actor,
      updatedAt: new Date().toISOString(),
    };
    allTemplates().push(created);
    recordAudit({ action: "broadcast_template.create", target: created.name, reason });
    return { ...created };
  });
}

export function deleteTemplate(id: string, reason: string): Promise<void> {
  return simulate(() => {
    const existing = allTemplates().find((tpl) => tpl.id === id);
    if (!existing) throw new ApiError(404, "Template not found.");
    templates = allTemplates().filter((tpl) => tpl.id !== id);
    recordAudit({ action: "broadcast_template.delete", target: existing.name, reason });
  });
}

/** How many broadcasts used each segment, and how many of those have not gone out yet. */
export function broadcastUsage(): Record<string, { total: number; open: number }> {
  const usage: Record<string, { total: number; open: number }> = {};
  for (const broadcast of all()) {
    const entry = (usage[broadcast.segmentId] ??= { total: 0, open: 0 });
    entry.total += 1;
    if (broadcast.status === "pending_approval" || broadcast.status === "scheduled")
      entry.open += 1;
  }
  return usage;
}

export function createBroadcast(
  draft: BroadcastDraft,
  reason: string,
  templateId?: string,
): Promise<Broadcast> {
  return simulate(() => {
    if (draftProblems(draft, new Date()).length > 0) {
      throw new ApiError(422, "Fix the message before submitting it.");
    }
    const segment = findSegment(draft.segmentId);
    if (!segment) throw new ApiError(422, "That audience segment no longer exists.");
    if (draft.timing === "scheduled" && !isScheduleAllowed(new Date(draft.when), new Date())) {
      throw new ApiError(
        422,
        `The send time must be in the future and within ${MAX_SCHEDULE_DAYS} days.`,
      );
    }
    const broadcast: Broadcast = {
      id: crypto.randomUUID(),
      name: draft.name.trim(),
      channel: draft.channel,
      subject: draft.channel === "sms" ? "" : draft.subject.trim(),
      body: draft.body.trim(),
      segmentId: segment.id,
      segmentName: segment.name,
      recipientCount: estimateSize(segment.rules),
      status: "pending_approval",
      scheduledFor: draft.timing === "scheduled" ? new Date(draft.when).toISOString() : undefined,
      createdBy: getAuditActor(),
      createdAt: new Date().toISOString(),
      reason,
      delivered: 0,
      failed: 0,
      log: [],
    };
    all().unshift(broadcast);
    const used = allTemplates().find((tpl) => tpl.id === templateId);
    if (used && used.channel === draft.channel) used.usedCount += 1;
    recordAudit({
      action: "broadcast.submit",
      target: broadcast.name,
      reason,
      after: `${broadcast.channel} to ${broadcast.recipientCount} customers`,
    });
    return broadcast;
  }, 600);
}

export function decideBroadcast(input: {
  id: string;
  decision: "approved" | "rejected";
  comment: string;
}): Promise<Broadcast> {
  return simulate(() => {
    const broadcast = all().find((b) => b.id === input.id);
    if (!broadcast) throw new ApiError(404, "Broadcast not found.");
    if (broadcast.status !== "pending_approval") {
      throw new ApiError(409, "This broadcast has already been decided.");
    }
    const actor = getAuditActor();
    if (broadcast.createdBy === actor) {
      throw new ApiError(403, "You cannot decide a broadcast you created.");
    }
    broadcast.decidedBy = actor;
    broadcast.decidedAt = new Date().toISOString();
    broadcast.decisionComment = input.comment;
    if (input.decision === "rejected") {
      broadcast.status = "rejected";
    } else if (broadcast.scheduledFor && new Date(broadcast.scheduledFor).getTime() > Date.now()) {
      broadcast.status = "scheduled";
    } else {
      broadcast.status = "sent";
      broadcast.failed = Math.round(broadcast.recipientCount * 0.04);
      broadcast.delivered = broadcast.recipientCount - broadcast.failed;
      broadcast.log = buildLog(7, broadcast.channel, 0.04);
    }
    recordAudit({
      action: `broadcast.${input.decision}`,
      target: broadcast.name,
      reason: input.comment,
      before: "pending_approval",
      after: broadcast.status,
    });
    return broadcast;
  }, 700);
}
