import { getDefaultPermissionsForRole } from "@/lib/auth/permission-catalog";
import {
  getManagedUserByEmail,
  listManagedUsers,
  recordUserLogin,
} from "@/lib/auth/user-registry";
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

async function loginWithLocalCredentials(
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

async function loginWithSupabaseCredentials(
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

  const localResult = await loginWithLocalCredentials(
    normalizedEmail,
    normalizedPassword,
  );
  if (localResult === "inactive") {
    throw new Error("This account is inactive. Contact an administrator.");
  }
  if (localResult === "invalid") {
    throw new Error("Invalid email or password");
  }
  if (localResult) return localResult;

  const supabaseUser = await loginWithSupabaseCredentials(
    normalizedEmail,
    normalizedPassword,
  );
  if (supabaseUser) return supabaseUser;

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
