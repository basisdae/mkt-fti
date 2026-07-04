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
