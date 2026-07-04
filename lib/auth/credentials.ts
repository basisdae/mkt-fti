import { SEED_USERS, type SeedUserRecord } from "@/lib/auth/seed-users";
import { AUTH_USERS_STORAGE_KEY } from "@/lib/auth/session";
import { isAppRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { AppUser } from "@/types/auth";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function loadExtraUsers(): SeedUserRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AUTH_USERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is SeedUserRecord => {
      if (!item || typeof item !== "object") return false;
      const row = item as SeedUserRecord;
      return (
        typeof row.id === "string" &&
        typeof row.email === "string" &&
        typeof row.password === "string" &&
        typeof row.displayName === "string" &&
        isAppRole(row.role)
      );
    });
  } catch {
    return [];
  }
}

/** All pre-created accounts (seed + admin-added local users). */
export function listLocalAuthUsers(): SeedUserRecord[] {
  const extras = loadExtraUsers();
  const byEmail = new Map<string, SeedUserRecord>();
  for (const user of [...SEED_USERS, ...extras]) {
    byEmail.set(normalizeEmail(user.email), {
      ...user,
      email: normalizeEmail(user.email),
    });
  }
  return [...byEmail.values()];
}

/**
 * Admin can pre-create users locally (no self-registration UI).
 * Call from settings/scripts as needed.
 */
export function upsertLocalAuthUser(user: SeedUserRecord): void {
  if (typeof window === "undefined") return;
  const extras = loadExtraUsers().filter(
    (item) => normalizeEmail(item.email) !== normalizeEmail(user.email),
  );
  extras.push({
    ...user,
    email: normalizeEmail(user.email),
  });
  localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(extras));
}

function toAppUser(record: SeedUserRecord): AppUser {
  return {
    id: record.id,
    email: normalizeEmail(record.email),
    displayName: record.displayName,
    role: record.role,
  };
}

async function loginWithLocalCredentials(
  email: string,
  password: string,
): Promise<AppUser | null> {
  const users = listLocalAuthUsers();
  const match = users.find(
    (user) =>
      normalizeEmail(user.email) === normalizeEmail(email) &&
      user.password === password,
  );
  return match ? toAppUser(match) : null;
}

async function loginWithSupabaseCredentials(
  email: string,
  password: string,
): Promise<AppUser | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { createClient } = await import("@/lib/supabase/client");
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

    return {
      id: userId,
      email: normalizeEmail(data.user.email ?? email),
      displayName,
      role: role ?? "mkt_hq",
    };
  } catch {
    return null;
  }
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<AppUser> {
  const localUser = await loginWithLocalCredentials(email, password);
  if (localUser) return localUser;

  const supabaseUser = await loginWithSupabaseCredentials(email, password);
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
