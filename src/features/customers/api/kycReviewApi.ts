import { request } from "@/shared/api/client";

export type ReviewStatus = "pending_review" | "resubmitted" | "approved" | "rejected" | string;
export type SlotStatus = "approved" | "pending_review" | "rejected" | "missing";

export interface KycFile {
  reference: string;
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
}

export interface KycDocument {
  id: string;
  name: string;
  /** "identification" or "utility" (proof of address). */
  category: string;
  status: ReviewStatus;
  version: number;
  files: KycFile[];
  rejectionReason: string | null;
  reviewerNotes: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface KycReview {
  progress: {
    totalRequired: number;
    approved: number;
    pendingReview: number;
    rejected: number;
    missing: number;
    slots: { identification: SlotStatus; utility: SlotStatus };
  };
  documents: KycDocument[];
}

interface FileRow {
  reference: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
}

const toFile = (file: FileRow): KycFile => ({
  reference: file.reference,
  fileName: file.file_name,
  fileType: file.file_type,
  fileSize: file.file_size,
});

interface DocumentRow {
  document_id: string;
  name: string;
  category: string;
  status: ReviewStatus;
  version: number;
  files: FileRow[];
  rejection_reason: string | null;
  reviewer_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

interface ReviewResponse {
  progress: {
    total_required: number;
    approved: number;
    pending_review: number;
    rejected: number;
    missing: number;
    slots: { identification: SlotStatus; utility: SlotStatus };
  };
  documents: DocumentRow[];
}

const base = (userId: string) => `/admin/kyc/retail/${encodeURIComponent(userId)}`;

export async function getKycReview(userId: string): Promise<KycReview> {
  const data = await request<ReviewResponse>(`${base(userId)}/review`);
  return {
    progress: {
      totalRequired: data.progress.total_required,
      approved: data.progress.approved,
      pendingReview: data.progress.pending_review,
      rejected: data.progress.rejected,
      missing: data.progress.missing,
      slots: data.progress.slots,
    },
    documents: data.documents.map((row) => ({
      id: row.document_id,
      name: row.name,
      category: row.category,
      status: row.status,
      version: row.version,
      files: row.files.map(toFile),
      rejectionReason: row.rejection_reason,
      reviewerNotes: row.reviewer_notes,
      submittedAt: row.submitted_at,
      reviewedAt: row.reviewed_at,
      reviewedBy: row.reviewed_by,
    })),
  };
}

export interface KycActivity {
  id: string;
  at: string;
  description: string;
  documentName: string;
  actor: string;
  reason: string | null;
  /** Missing until the server is updated, and then the row's files cannot be opened. */
  documentId: string | null;
  /** The document's name without the version, for the file window's title. */
  name: string;
  version: number;
  /** True for the customer's own uploads, which are the rows that show a file. */
  isUpload: boolean;
  /** Empty once the version is too old for its file to still be stored. */
  files: KycFile[];
}

interface ActivityRow {
  activity_reference: string;
  document_id?: string;
  activity_type: string;
  timestamp: string;
  activity_description: string;
  document: { name: string; version: number; files?: FileRow[] };
  initiated_by: { name: string | null; role: string | null };
  rejection_reason: string | null;
}

export async function getKycActivity(userId: string): Promise<KycActivity[]> {
  const data = await request<{ logs: ActivityRow[] }>(`${base(userId)}/activity-logs`, {
    query: { limit: 50 },
  });
  return data.logs.map((log) => ({
    id: log.activity_reference,
    at: log.timestamp,
    description: log.activity_description,
    documentName: `${log.document.name} (v${log.document.version})`,
    actor: log.initiated_by.name ?? "",
    reason: log.rejection_reason,
    documentId: log.document_id ?? null,
    name: log.document.name,
    version: log.document.version,
    isUpload: log.activity_type === "submitted" || log.activity_type === "resubmitted",
    files: (log.document.files ?? []).map(toFile),
  }));
}

/** A fresh, short-lived link to one uploaded file. Opening a document is recorded in the audit log. */
export async function getDocumentLink(userId: string, documentId: string, reference: string) {
  const data = await request<{ files: { reference: string; view_url: string }[] }>(
    `${base(userId)}/documents/${encodeURIComponent(documentId)}/view-url`,
    { query: { reference } },
  );
  return (
    data.files.find((file) => file.reference === reference)?.view_url ?? data.files[0]?.view_url
  );
}

export async function approveDocument(userId: string, documentId: string, notes: string) {
  await request(`${base(userId)}/documents/${encodeURIComponent(documentId)}/approve`, {
    method: "POST",
    body: notes.trim() ? { reviewer_notes: notes.trim() } : {},
  });
}

export async function rejectDocument(
  userId: string,
  documentId: string,
  reason: string,
  notifyCustomer: boolean,
) {
  await request(`${base(userId)}/documents/${encodeURIComponent(documentId)}/reject`, {
    method: "POST",
    body: { reason, notify_customer: notifyCustomer },
  });
}

/** Sends the customer one message about every rejected document they have not been told about. */
export async function confirmRejections(userId: string) {
  await request(`${base(userId)}/documents/confirm-rejection`, { method: "POST" });
}
