import { getDefaultPermissionsForRole } from "@/lib/auth/permission-catalog";
import {
  getManagedUserByEmail,
  listManagedUsers,
  recordUserLogin,
} from "@/lib/auth/user-registry";
import {
  ensureSeedUsersInSupabase,
  getAppUserByEmailFromSupabase,
  upsertAppUserInSupabase,
} from "@/lib/services/app-users";
import { establishSupabaseAuthSession } from "@/lib/auth/supabase-session-bridge";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { AppUser } from "@/types/auth";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toAppUser(record: {
  id: string;
  email: string;
  displayName: string;
  role: AppUser["role"];
  permissions?: AppUser["permissions"];
}): AppUser {
  return {
    id: record.id,
    email: normalizeEmail(record.email),
    displayName: record.displayName,
    role: record.role,
    permissions:
      record.permissions ?? getDefaultPermissionsForRole(record.role),
  };
}

async function loginWithSupabaseAppUsers(
  email: string,
  password: string,
): Promise<AppUser | "invalid" | "inactive" | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    await ensureSeedUsersInSupabase();
    const match = await getAppUserByEmailFromSupabase(email);
    if (!match) return null;
    if (match.password !== password.trim()) return "invalid";
    if (!match.isActive) return "inactive";

    const lastLoginAt = new Date().toISOString();
    await upsertAppUserInSupabase({ ...match, lastLoginAt });
    return toAppUser({ ...match, lastLoginAt } as typeof match);
  } catch {
    // Table may not be migrated yet — fall back to local registry.
    return null;
  }
}

async function loginWithLocalRegistry(
  email: string,
  password: string,
): Promise<AppUser | "invalid" | "inactive" | null> {
  const match = getManagedUserByEmail(email);
  if (!match) return null;
  if (match.password !== password.trim()) return "invalid";
  if (!match.isActive) return "inactive";
  recordUserLogin(match.email);
  return toAppUser(match);
}

async function loginWithSupabaseAuth(
  email: string,
  password: string,
): Promise<AppUser | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { createClient } = await import("@/lib/supabase/client");
    const { isAppRole } = await import("@/lib/auth/roles");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });
    if (error || !data.user) return null;

    const userId = data.user.id;
    const meta = data.user.user_metadata ?? {};
    let role = isAppRole(String(meta.role ?? ""))
      ? (meta.role as AppUser["role"])
      : null;
    let displayName =
      typeof meta.display_name === "string" && meta.display_name.trim()
        ? meta.display_name.trim()
        : data.user.email?.split("@")[0] || "User";

    const { data: profile } = await supabase
      .from("app_profiles")
      .select("display_name, role")
      .eq("id", userId)
      .maybeSingle();

    if (profile) {
      if (typeof profile.display_name === "string" && profile.display_name.trim()) {
        displayName = profile.display_name.trim();
      }
      if (isAppRole(String(profile.role ?? ""))) {
        role = profile.role as AppUser["role"];
      }
    }

    const resolvedRole = role ?? "mkt_hq";
    return {
      id: userId,
      email: normalizeEmail(data.user.email ?? email),
      displayName,
      role: resolvedRole,
      permissions: getDefaultPermissionsForRole(resolvedRole),
    };
  } catch {
    return null;
  }
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<AppUser> {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = password.trim();

  const appUserResult = await loginWithSupabaseAppUsers(
    normalizedEmail,
    normalizedPassword,
  );
  if (appUserResult === "inactive") {
    throw new Error("This account is inactive. Contact an administrator.");
  }
  if (appUserResult === "invalid") {
    throw new Error("Invalid email or password");
  }
  if (appUserResult) {
    await establishSupabaseAuthSession(normalizedEmail, normalizedPassword);
    return appUserResult;
  }

  const localResult = await loginWithLocalRegistry(
    normalizedEmail,
    normalizedPassword,
  );
  if (localResult === "inactive") {
    throw new Error("This account is inactive. Contact an administrator.");
  }
  if (localResult === "invalid") {
    throw new Error("Invalid email or password");
  }
  if (localResult) {
    await establishSupabaseAuthSession(normalizedEmail, normalizedPassword);
    return localResult;
  }

  const supabaseAuthUser = await loginWithSupabaseAuth(
    normalizedEmail,
    normalizedPassword,
  );
  if (supabaseAuthUser) return supabaseAuthUser;

  throw new Error("Invalid email or password");
}

export async function signOutRemote(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
}

/** @deprecated Use listManagedUsers from user-registry */
export function listLocalAuthUsers() {
  return listManagedUsers();
}
