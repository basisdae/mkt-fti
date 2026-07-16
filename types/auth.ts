import type { PermissionKey } from "@/lib/auth/permission-catalog";

export type AppRole = "mkt_hq" | "rnd" | "admin" | "ceo" | "sale" | "pu";

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  /** Role template label — access is driven by `permissions`. */
  role: AppRole;
  permissions: PermissionKey[];
}

export interface AuthSession {
  user: AppUser;
  loggedInAt: string;
  /** False when app_users login succeeded but Supabase Auth cookies were not linked. */
  supabaseAuthLinked?: boolean;
  /** Last bridge failure reason — used for Gift Plans error messages. */
  supabaseAuthBridgeError?:
    | "not_configured"
    | "not_provisioned"
    | "invalid_credentials"
    | "email_not_confirmed"
    | "session_expired"
    | "unknown"
    | null;
}

/** Local auth registry record (password never sent to list UI). */
export interface ManagedUserRecord {
  id: string;
  email: string;
  password: string;
  displayName: string;
  role: AppRole;
  permissions: PermissionKey[];
  isActive: boolean;
  lastLoginAt: string | null;
}

export interface ManagedUserPublic {
  id: string;
  email: string;
  displayName: string;
  role: AppRole;
  permissions: PermissionKey[];
  isActive: boolean;
  lastLoginAt: string | null;
}
