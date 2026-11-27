import { request } from "@/shared/api/client";

/** "stuck" is worked out by the server: waiting for delivery with no news for 15 minutes. */
export type DeliveryStatus =
  "pending" | "publishing" | "published" | "stuck" | "delivered" | "failed" | "dead";
export type DeliveryChannel = "merchant_progress" | "funding_webhook";

export interface Delivery {
  id: string;
  channel: DeliveryChannel;
  destination: string;
  reference: string | null;
  status: DeliveryStatus;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  deliveredAt: string | null;
}

export interface DeliveryFilters {
  status?: DeliveryStatus;
  channel?: DeliveryChannel;
  search?: string;
  page: number;
  limit: number;
}

interface DeliveryRow {
  id: string;
  channel: DeliveryChannel;
  destination: string;
  reference: string | null;
  status: Exclude<DeliveryStatus, "stuck">;
  stuck: boolean;
  attempt_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
}

export async function listDeliveries(filters: DeliveryFilters) {
  const result = await request<{
    data: DeliveryRow[];
    total: number;
    counts: Record<DeliveryStatus, number>;
  }>("/admin/system/outbound-events", { query: { ...filters } });
  const rows: Delivery[] = result.data.map((row) => ({
    id: row.id,
    channel: row.channel,
    destination: row.destination,
    reference: row.reference,
    status: row.stuck ? "stuck" : row.status,
    attempts: row.attempt_count,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deliveredAt: row.delivered_at,
  }));
  return { rows, total: result.total, counts: result.counts };
}

/** What was queued for one delivery, already masked by the server. Viewing it is recorded in the audit log. */
export async function getDeliveryPayload(id: string) {
  const data = await request<{ payload: unknown }>(
    `/admin/system/outbound-events/${encodeURIComponent(id)}/payload`,
  );
  return data.payload;
}

/** Queues a failed or stuck delivery to be sent again. Needs a fresh authenticator code first. */
export async function resendDelivery(id: string, reason: string) {
  await request<unknown>(`/admin/system/outbound-events/${encodeURIComponent(id)}/resend`, {
    method: "POST",
    body: { reason },
  });
}

export interface Queue {
  name: string;
  exists: boolean;
  waiting: number | null;
  consumers: number | null;
  /** Null when the queue has no failed-message queue beside it. */
  deadLetterWaiting: number | null;
}

export async function getQueues() {
  const result = await request<{
    checked_at: string;
    queues: {
      name: string;
      exists: boolean;
      waiting: number | null;
      consumers: number | null;
      dead_letter_waiting: number | null;
    }[];
  }>("/admin/system/queues");
  const queues: Queue[] = result.queues.map(({ dead_letter_waiting, ...queue }) => ({
    ...queue,
    deadLetterWaiting: dead_letter_waiting,
  }));
  return { checkedAt: result.checked_at, queues };
}

export type JobStatus = "never" | "running" | "completed" | "failed";

export interface ScheduledJob {
  key: string;
  name: string;
  schedule: string;
  status: JobStatus;
  lastStartedAt: string | null;
  lastDurationMs: number | null;
  lastError: string | null;
  lastSucceededAt: string | null;
}

export async function getScheduledJobs() {
  const result = await request<{
    timezone: string;
    jobs: {
      key: string;
      name: string;
      schedule: string;
      status: JobStatus;
      last_started_at: string | null;
      last_duration_ms: number | null;
      last_error: string | null;
      last_succeeded_at: string | null;
    }[];
  }>("/admin/system/cron");
  const jobs: ScheduledJob[] = result.jobs.map((job) => ({
    key: job.key,
    name: job.name,
    schedule: job.schedule,
    status: job.status,
    lastStartedAt: job.last_started_at,
    lastDurationMs: job.last_duration_ms,
    lastError: job.last_error,
    lastSucceededAt: job.last_succeeded_at,
  }));
  return { timezone: result.timezone, jobs };
}
