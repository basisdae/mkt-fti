import { generateId } from "@/lib/generate-id";

export const AUTH_AUDIT_STORAGE_KEY = "mkt-fti-auth-audit";

export type AuthAuditAction =
  | "password_reset"
  | "user_updated"
  | "user_created"
  | "user_deleted"
  | "user_deactivated"
  | "user_activated"
  | "role_changed"
  | "permission_changed";

export interface AuthAuditEntry {
  id: string;
  action: AuthAuditAction;
  actorId: string;
  actorEmail: string;
  targetUserId: string;
  targetEmail: string;
  detail?: string;
  createdAt: string;
}

function canUseDom() {
  return typeof window !== "undefined";
}

export function listAuthAuditLog(): AuthAuditEntry[] {
  if (!canUseDom()) return [];
  try {
    const raw = localStorage.getItem(AUTH_AUDIT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is AuthAuditEntry =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as AuthAuditEntry).id === "string" &&
        typeof (item as AuthAuditEntry).action === "string",
    );
  } catch {
    return [];
  }
}

export function logAuthAudit(
  entry: Omit<AuthAuditEntry, "id" | "createdAt">,
): void {
  if (!canUseDom()) return;
  const next: AuthAuditEntry = {
    ...entry,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  const existing = listAuthAuditLog();
  localStorage.setItem(
    AUTH_AUDIT_STORAGE_KEY,
    JSON.stringify([next, ...existing].slice(0, 200)),
  );
}
