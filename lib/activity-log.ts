/**
 * Activity audit trail — reuses existing `auth_audit_logs` table (no migration).
 *
 * Field mapping:
 * - action: activity type (e.g. product.created)
 * - actor_id / actor_email: current user
 * - target_user_id: entity id
 * - target_email: entity name (repurposed)
 * - detail: JSON metadata { entityType, ... }
 *
 * Logging never throws to callers; failures are console.error only.
 */
import { readSessionFromStorage } from "@/lib/auth/session";
import { generateId } from "@/lib/generate-id";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type ActivityEntityType = "product" | "supplier" | "export";

export type ActivityAction =
  | "product.created"
  | "product.updated"
  | "product.archived"
  | "product.deleted"
  | "supplier.created"
  | "supplier.updated"
  | "supplier.deleted"
  | "export.backup"
  | "export.product_master"
  | "export.suppliers"
  | "export.sales_plan";

export interface ActivityLogEntry {
  id: string;
  action: ActivityAction | string;
  entityType: ActivityEntityType | string;
  entityId: string;
  entityName: string;
  userEmail: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

const ACTIVITY_ACTIONS = new Set<string>([
  "product.created",
  "product.updated",
  "product.archived",
  "product.deleted",
  "supplier.created",
  "supplier.updated",
  "supplier.deleted",
  "export.backup",
  "export.product_master",
  "export.suppliers",
  "export.sales_plan",
]);

function currentActor(): { id: string; email: string } {
  const session = readSessionFromStorage();
  return {
    id: session?.user?.id ?? "",
    email: session?.user?.email ?? "",
  };
}

export async function logActivity(input: {
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  entityName?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const actor = currentActor();
    const detail = JSON.stringify({
      entityType: input.entityType,
      ...(input.metadata ?? {}),
    });

    const supabase = createClient();
    const { error } = await supabase.from("auth_audit_logs").insert({
      id: generateId(),
      action: input.action,
      actor_id: actor.id,
      actor_email: actor.email,
      target_user_id: input.entityId,
      target_email: (input.entityName ?? "").slice(0, 200),
      detail,
    });

    if (error) {
      console.error("[activity-log] insert failed", error);
    }
  } catch (err) {
    console.error("[activity-log] insert failed", err);
  }
}

function parseDetail(
  detail: string | undefined,
): { entityType?: string; metadata?: Record<string, unknown> } {
  if (!detail) return {};
  try {
    const parsed = JSON.parse(detail) as Record<string, unknown>;
    const { entityType, ...rest } = parsed;
    return {
      entityType: typeof entityType === "string" ? entityType : undefined,
      metadata: rest,
    };
  } catch {
    return { metadata: { detail } };
  }
}

export function formatActivityLabel(action: string): string {
  switch (action) {
    case "product.created":
      return "Product created";
    case "product.updated":
      return "Product updated";
    case "product.archived":
      return "Product archived";
    case "product.deleted":
      return "Product deleted";
    case "supplier.created":
      return "Supplier created";
    case "supplier.updated":
      return "Supplier updated";
    case "supplier.deleted":
      return "Supplier deleted";
    case "export.backup":
      return "Data backup exported";
    case "export.product_master":
      return "Product master exported";
    case "export.suppliers":
      return "Supplier list exported";
    case "export.sales_plan":
      return "Sales plan exported";
    default:
      return action;
  }
}

/** Latest activity entries (read-only). */
export async function listRecentActivity(
  limit = 20,
): Promise<ActivityLogEntry[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("auth_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(Math.max(limit * 3, 60));

    if (error) {
      console.error("[activity-log] list failed", error);
      return [];
    }

    const entries: ActivityLogEntry[] = [];
    for (const row of data ?? []) {
      const action = String((row as { action: string }).action ?? "");
      if (!ACTIVITY_ACTIONS.has(action)) continue;

      const detail = parseDetail(
        typeof (row as { detail?: string }).detail === "string"
          ? (row as { detail: string }).detail
          : undefined,
      );

      entries.push({
        id: String((row as { id: string }).id),
        action,
        entityType:
          detail.entityType ??
          (action.startsWith("supplier.")
            ? "supplier"
            : action.startsWith("export.")
              ? "export"
              : "product"),
        entityId: String(
          (row as { target_user_id?: string }).target_user_id ?? "",
        ),
        entityName: String(
          (row as { target_email?: string }).target_email ?? "",
        ),
        userEmail: String(
          (row as { actor_email?: string }).actor_email ?? "",
        ),
        createdAt: String(
          (row as { created_at?: string }).created_at ??
            new Date().toISOString(),
        ),
        metadata: detail.metadata,
      });

      if (entries.length >= limit) break;
    }

    return entries;
  } catch (err) {
    console.error("[activity-log] list failed", err);
    return [];
  }
}
