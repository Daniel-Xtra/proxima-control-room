import type { Queue } from "../api/systemApi";

/**
 * - `stuck`: messages are waiting and nothing is consuming them
 * - `failures`: its failed-message queue holds messages
 * - `idle`: no consumer, but nothing waiting yet
 */
export type QueueState = "stuck" | "failures" | "idle" | "working" | "missing";

const ORDER: QueueState[] = ["stuck", "failures", "idle", "working", "missing"];

export function queueState(queue: Queue): QueueState {
  const failures = (queue.deadLetterWaiting ?? 0) > 0;
  if (!queue.exists) return failures ? "failures" : "missing";
  if (queue.consumers === 0 && (queue.waiting ?? 0) > 0) return "stuck";
  if (failures) return "failures";
  return queue.consumers === 0 ? "idle" : "working";
}

export function sortByAttention(queues: readonly Queue[]): Queue[] {
  return [...queues].sort(
    (a, b) =>
      ORDER.indexOf(queueState(a)) - ORDER.indexOf(queueState(b)) ||
      (b.waiting ?? 0) - (a.waiting ?? 0) ||
      a.name.localeCompare(b.name),
  );
}
