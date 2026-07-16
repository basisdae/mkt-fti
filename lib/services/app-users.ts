import {
  GIFT_PLAN_OPERATOR_PERMISSIONS,
  PRIMARY_ADMIN_EMAIL,
  PRIMARY_MKT_SUPPORT_EMAIL,
} from "@/lib/auth/gift-plan-operators";
import {
  getDefaultPermissionsForRole,
  normalizePermissions,
  PERMISSION_KEYS,
  type PermissionKey,
} from "@/lib/auth/permission-catalog";
import { SEED_USERS } from "@/lib/auth/seed-users";
import { isAppRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { AppRole, ManagedUserRecord } from "@/types/auth";

function getClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return createClient();
}

function mapRow(row: Record<string, unknown>): ManagedUserRecord {
  const role = isAppRole(String(row.role ?? ""))
    ? (row.role as AppRole)
    : "mkt_hq";
  const permissions = normalizePermissions(
    Array.isArray(row.permissions)
      ? (row.permissions as string[])
      : getDefaultPermissionsForRole(role),
  );

  return {
    id: String(row.id),
    email: String(row.email ?? "").toLowerCase(),
    password: String(row.password ?? ""),
    displayName: String(row.display_name ?? ""),
    role,
    permissions:
      permissions.length > 0 ? permissions : getDefaultPermissionsForRole(role),
    isActive: row.is_active !== false,
    lastLoginAt:
      typeof row.last_login_at === "string" ? row.last_login_at : null,
  };
}

function toRow(user: ManagedUserRecord): Record<string, unknown> {
  return {
    id: user.id,
    email: user.email.toLowerCase(),
    password: user.password,
    display_name: user.displayName,
    role: user.role,
    permissions: user.permissions,
    is_active: user.isActive,
    last_login_at: user.lastLoginAt,
    updated_at: new Date().toISOString(),
  };
}

export async function listAppUsersFromSupabase(): Promise<ManagedUserRecord[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("*")
    .order("display_name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function getAppUserByEmailFromSupabase(
  email: string,
): Promise<ManagedUserRecord | null> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function upsertAppUserInSupabase(
  user: ManagedUserRecord,
): Promise<ManagedUserRecord> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("app_users")
    .upsert(toRow(user), { onConflict: "id" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as Record<string, unknown>);
}

export async function deleteAppUserInSupabase(userId: string): Promise<void> {
  const supabase = getClient();
  const { error } = await supabase.from("app_users").delete().eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function insertAuthAuditInSupabase(entry: {
  action: string;
  actorId: string;
  actorEmail: string;
  targetUserId: string;
  targetEmail: string;
  detail?: string;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getClient();
  await supabase.from("auth_audit_logs").insert({
    action: entry.action,
    actor_id: entry.actorId,
    actor_email: entry.actorEmail,
    target_user_id: entry.targetUserId,
    target_email: entry.targetEmail,
    detail: entry.detail ?? null,
  });
}

/**
 * Insert seed users only when their email is missing.
 * Never overwrites existing product/supplier/user rows.
 */
export async function ensureSeedUsersInSupabase(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const existing = await listAppUsersFromSupabase();
  const emails = new Set(existing.map((user) => user.email));

  for (const seed of SEED_USERS) {
    const email = seed.email.trim().toLowerCase();
    if (emails.has(email)) continue;

    const permissions = getDefaultPermissionsForRole(seed.role);
    await upsertAppUserInSupabase({
      id: seed.id,
      email,
      password: seed.password,
      displayName: seed.displayName,
      role: seed.role,
      permissions,
      isActive: true,
      lastLoginAt: null,
    });
  }
}

/**
 * Primary admin seed credentials always win — matches local user-registry behavior.
 * Keeps app_users password in sync after deploy without manual SQL.
 */
export async function syncPrimaryAdminFromSeedInSupabase(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const seed = SEED_USERS.find(
    (user) => user.email.trim().toLowerCase() === PRIMARY_ADMIN_EMAIL,
  );
  if (!seed) return;

  const email = seed.email.trim().toLowerCase();
  const existing = await getAppUserByEmailFromSupabase(email);
  const permissions = getDefaultPermissionsForRole(seed.role);

  await upsertAppUserInSupabase({
    id: existing?.id ?? seed.id,
    email,
    password: seed.password,
    displayName: existing?.displayName?.trim() || seed.displayName,
    role: seed.role,
    permissions: existing?.permissions?.length
      ? existing.permissions
      : permissions,
    isActive: existing?.isActive ?? true,
    lastLoginAt: existing?.lastLoginAt ?? null,
  });
}

function mergeGiftPlanOperatorPermissions(
  role: AppRole,
  existing: PermissionKey[],
): PermissionKey[] {
  const merged = new Set<PermissionKey>([
    ...getDefaultPermissionsForRole(role),
    ...existing,
    ...(GIFT_PLAN_OPERATOR_PERMISSIONS as readonly PermissionKey[]),
  ]);
  return PERMISSION_KEYS.filter((key) => merged.has(key));
}

/** Ensure primary MKT support operator has mkt_hq + Gift Plans permissions. */
async function syncMktSupportOperatorInSupabase(): Promise<void> {
  const existing = await getAppUserByEmailFromSupabase(PRIMARY_MKT_SUPPORT_EMAIL);
  if (!existing) return;

  await upsertAppUserInSupabase({
    ...existing,
    role: "mkt_hq",
    permissions: mergeGiftPlanOperatorPermissions("mkt_hq", existing.permissions),
  });
}

export async function syncGiftPlanOperatorsInSupabase(): Promise<void> {
  await syncPrimaryAdminFromSeedInSupabase();
  await syncMktSupportOperatorInSupabase();
}

export async function listAuthAuditFromSupabase(limit = 30) {
  if (!isSupabaseConfigured()) return [];
  const supabase = getClient();
  const { data, error } = await supabase
    .from("auth_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []).map((row) => ({
    id: String((row as { id: string }).id),
    action: String((row as { action: string }).action),
    actorId: String((row as { actor_id: string }).actor_id ?? ""),
    actorEmail: String((row as { actor_email: string }).actor_email ?? ""),
    targetUserId: String((row as { target_user_id: string }).target_user_id ?? ""),
    targetEmail: String((row as { target_email: string }).target_email ?? ""),
    detail:
      typeof (row as { detail?: string }).detail === "string"
        ? (row as { detail: string }).detail
        : undefined,
    createdAt: String(
      (row as { created_at: string }).created_at ?? new Date().toISOString(),
    ),
  }));
}

export type { PermissionKey };
