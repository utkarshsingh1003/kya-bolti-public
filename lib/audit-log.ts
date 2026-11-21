// Audit log for admin actions
type AuditAction =
  | "poll_approved"
  | "poll_rejected"
  | "poll_edited"
  | "poll_draft_saved"
  | "poll_published"
  | "poll_scheduled"
  | "poll_archived"
  | "poll_request_approved"
  | "poll_request_rejected"
  | "poll_request_published"
  | "poll_created";

type AuditActor = "admin" | "system";

interface AuditEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  actor: AuditActor;
  pollId?: string;
  pollRequestId?: string;
  details?: string;
  ip?: string;
  userAgent?: string;
}

// In-memory audit log (in production, this would be a database table)
const auditEntries: AuditEntry[] = [];

export function logAuditAction(entry: Omit<AuditEntry, "id" | "timestamp">): AuditEntry {
  const entryWithId: AuditEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  auditEntries.push(entryWithId);
  return entryWithId;
}

export function getAuditLog(): AuditEntry[] {
  return [...auditEntries];
}

export function getPollAuditHistory(pollId: string): AuditEntry[] {
  return auditEntries.filter((entry) => entry.pollId === pollId);
}

export function getPollRequestAuditHistory(pollRequestId: string): AuditEntry[] {
  return auditEntries.filter((entry) => entry.pollRequestId === pollRequestId);
}