import { getDefaultPermissionsForRole, normalizePermissions } from "@/lib/auth/permission-catalog";
import { isAppRole } from "@/lib/auth/roles";
import type { AppUser, AuthSession } from "@/types/auth";

export const AUTH_SESSION_COOKIE = "mkt-fti-session";
export const AUTH_SESSION_STORAGE_KEY = "mkt-fti-auth-session";
export const AUTH_USERS_STORAGE_KEY = "mkt-fti-auth-users";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days

function canUseDom() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function encodeSession(session: AuthSession): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(session))));
}

function decodeSession(raw: string): AuthSession | null {
  try {
    const json = decodeURIComponent(escape(atob(raw)));
    const parsed = JSON.parse(json) as AuthSession;
    if (
      !parsed?.user?.id ||
      !parsed.user.email ||
      !parsed.user.displayName ||
      !isAppRole(parsed.user.role)
    ) {
      return null;
    }

    const permissions = normalizePermissions(parsed.user.permissions);
    const user: AppUser = {
      id: parsed.user.id,
      email: parsed.user.email,
      displayName: parsed.user.displayName,
      role: parsed.user.role,
      permissions:
        permissions.length > 0
          ? permissions
          : getDefaultPermissionsForRole(parsed.user.role),
    };

    return {
      user,
      loggedInAt: parsed.loggedInAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function createSession(user: AppUser): AuthSession {
  return {
    user: {
      ...user,
      permissions:
        user.permissions?.length > 0
          ? user.permissions
          : getDefaultPermissionsForRole(user.role),
    },
    loggedInAt: new Date().toISOString(),
  };
}

export function writeSession(session: AuthSession): void {
  if (!canUseDom()) return;
  const encoded = encodeSession(session);
  localStorage.setItem(AUTH_SESSION_STORAGE_KEY, encoded);
  document.cookie = `${AUTH_SESSION_COOKIE}=${encoded}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearSession(): void {
  if (!canUseDom()) return;
  localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  document.cookie = `${AUTH_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function readSessionFromStorage(): AuthSession | null {
  if (!canUseDom()) return null;
  const fromStorage = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (fromStorage) {
    const session = decodeSession(fromStorage);
    if (session) return session;
  }

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${AUTH_SESSION_COOKIE}=`));
  if (!cookie) return null;
  const value = cookie.slice(AUTH_SESSION_COOKIE.length + 1);
  return decodeSession(value);
}

export function readSessionFromCookieHeader(
  cookieHeader: string | null,
): AuthSession | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split("; ")
    .find((row) => row.startsWith(`${AUTH_SESSION_COOKIE}=`));
  if (!match) return null;
  return decodeSession(match.slice(AUTH_SESSION_COOKIE.length + 1));
}
