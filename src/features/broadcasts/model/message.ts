import { isScheduleAllowed } from "@/shared/lib/schedule";
import { LIMITS, type BroadcastDraft, type Channel, type TemplateDraft } from "./types";

/** The variable customers' names fill in. Previews show a sample name. */
export const NAME_VARIABLE = "{{first_name}}";
export const SAMPLE_NAME = "Ada";

export function fillSample(text: string): string {
  return text.split(NAME_VARIABLE).join(SAMPLE_NAME);
}

export function usesSubject(channel: Channel): boolean {
  return channel !== "sms";
}

export function bodyLimit(channel: Channel): number {
  return channel === "push"
    ? LIMITS.pushBody
    : channel === "sms"
      ? LIMITS.smsBody
      : LIMITS.emailBody;
}

export function subjectLimit(channel: Channel): number {
  return channel === "push" ? LIMITS.pushTitle : LIMITS.emailSubject;
}

/** An SMS is billed per 160-character segment. */
export function smsSegments(length: number): number {
  return Math.max(1, Math.ceil(length / LIMITS.smsSegment));
}

export type ContentProblem =
  "broadcasts.err.name" | "broadcasts.err.subject" | "broadcasts.err.body";

export type DraftProblem = ContentProblem | "broadcasts.err.time";

/** Checks the name, title or subject, and message. Shared by broadcasts and templates. */
export function contentProblems(draft: TemplateDraft): ContentProblem[] {
  const problems: ContentProblem[] = [];
  if (draft.name.trim().length < 3) problems.push("broadcasts.err.name");
  if (usesSubject(draft.channel)) {
    const length = draft.subject.trim().length;
    if (length < 3 || length > subjectLimit(draft.channel)) problems.push("broadcasts.err.subject");
  }
  const bodyLength = draft.body.trim().length;
  if (bodyLength < 10 || draft.body.length > bodyLimit(draft.channel)) {
    problems.push("broadcasts.err.body");
  }
  return problems;
}

export function draftProblems(draft: BroadcastDraft, now: Date): DraftProblem[] {
  const problems: DraftProblem[] = contentProblems(draft);
  if (draft.timing === "scheduled") {
    const date = draft.when ? new Date(draft.when) : null;
    if (!date || Number.isNaN(date.getTime()) || !isScheduleAllowed(date, now)) {
      problems.push("broadcasts.err.time");
    }
  }
  return problems;
}
