import {
  getDefaultPermissionsForRole,
  normalizePermissions,
  type PermissionKey,
} from "@/lib/auth/permission-catalog";
import {
  LEGACY_DEMO_ADMIN_EMAIL,
  SEED_USERS,
} from "@/lib/auth/seed-users";
import { AUTH_USERS_STORAGE_KEY } from "@/lib/auth/session";
import { isAppRole } from "@/lib/auth/roles";
import { generateId } from "@/lib/generate-id";
import type { AppRole, ManagedUserPublic, ManagedUserRecord } from "@/types/auth";

const AUTH_DELETED_USERS_KEY = "mkt-fti-auth-deleted-users";
export const PRIMARY_ADMIN_EMAIL = "mkt.dir@functioninter.co.th";
const PRIMARY_ADMIN_ID = "user-system-admin";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function canUseDom() {
  return typeof window !== "undefined";
}

function normalizeRecord(
  input: Partial<ManagedUserRecord> & {
    id: string;
    email: string;
    password: string;
    displayName: string;
    role: AppRole;
  },
): ManagedUserRecord {
  const role = input.role;
  const permissions = normalizePermissions(
    input.permissions ?? getDefaultPermissionsForRole(role),
  );

  return {
    id: input.id,
    email: normalizeEmail(input.email),
    password: input.password,
    displayName: input.displayName.trim() || input.email,
    role,
    permissions,
    isActive: input.isActive !== false,
    lastLoginAt:
      typeof input.lastLoginAt === "string" && input.lastLoginAt.trim()
        ? input.lastLoginAt
        : null,
  };
}

function isManagedUserRecord(value: unknown): value is ManagedUserRecord {
  if (!value || typeof value !== "object") return false;
  const row = value as ManagedUserRecord;
  return (
    typeof row.id === "string" &&
    typeof row.email === "string" &&
    typeof row.password === "string" &&
    typeof row.displayName === "string" &&
    isAppRole(row.role)
  );
}

function loadDeletedIds(): Set<string> {
  if (!canUseDom()) return new Set();
  try {
    const raw = localStorage.getItem(AUTH_DELETED_USERS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed.filter((item): item is string => typeof item === "string"),
    );
  } catch {
    return new Set();
  }
}

function saveDeletedIds(ids: Set<string>): void {
  if (!canUseDom()) return;
  localStorage.setItem(AUTH_DELETED_USERS_KEY, JSON.stringify([...ids]));
}

function loadOverrides(): ManagedUserRecord[] {
  if (!canUseDom()) return [];
  try {
    const raw = localStorage.getItem(AUTH_USERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const users = parsed
      .filter(isManagedUserRecord)
      .map(normalizeRecord)
      .filter(
        (user) =>
          user.email !== LEGACY_DEMO_ADMIN_EMAIL &&
          user.id !== "user-admin",
      );
    if (users.length !== parsed.filter(isManagedUserRecord).length) {
      saveOverrides(users);
    }
    return users;
  } catch {
    return [];
  }
}

function saveOverrides(users: ManagedUserRecord[]): void {
  if (!canUseDom()) return;
  localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(users));
}

function seedRecords(): ManagedUserRecord[] {
  return SEED_USERS.map((user) =>
    normalizeRecord({
      ...user,
      permissions: getDefaultPermissionsForRole(user.role),
      isActive: true,
      lastLoginAt: null,
    }),
  );
}

function toPublic(user: ManagedUserRecord): ManagedUserPublic {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    permissions: user.permissions,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
  };
}

function isPrimaryAdmin(user: Pick<ManagedUserRecord, "id" | "email">): boolean {
  return (
    user.email === PRIMARY_ADMIN_EMAIL || user.id === PRIMARY_ADMIN_ID
  );
}

function getPrimaryAdminSeed(): ManagedUserRecord {
  const seed = seedRecords().find((user) => isPrimaryAdmin(user));
  if (!seed) {
    throw new Error("Primary system administrator seed is missing");
  }
  return seed;
}

/** Full local user registry (seed + admin overrides). Includes passwords. */
export function listManagedUsers(): ManagedUserRecord[] {
  const deleted = loadDeletedIds();
  // Primary admin can never be soft-deleted.
  if (deleted.has(PRIMARY_ADMIN_EMAIL) || deleted.has(PRIMARY_ADMIN_ID)) {
    deleted.delete(PRIMARY_ADMIN_EMAIL);
    deleted.delete(PRIMARY_ADMIN_ID);
    saveDeletedIds(deleted);
  }

  const byEmail = new Map<string, ManagedUserRecord>();
  for (const user of seedRecords()) {
    if (deleted.has(user.id) || deleted.has(user.email)) continue;
    byEmail.set(user.email, user);
  }
  let primaryOverride: ManagedUserRecord | undefined;
  for (const user of loadOverrides()) {
    if (deleted.has(user.id) || deleted.has(user.email)) continue;
    // Seed credentials always win for the primary system administrator.
    if (isPrimaryAdmin(user)) {
      primaryOverride = user;
      continue;
    }
    byEmail.set(user.email, user);
  }

  // Guarantee primary admin is always present from seed credentials.
  const primary = getPrimaryAdminSeed();
  byEmail.set(primary.email, {
    ...primary,
    displayName: primaryOverride?.displayName?.trim() || primary.displayName,
    lastLoginAt: primaryOverride?.lastLoginAt ?? primary.lastLoginAt,
  });

  return [...byEmail.values()].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, "en"),
  );
}

export function listManagedUsersPublic(): ManagedUserPublic[] {
  return listManagedUsers().map(toPublic);
}

export function getManagedUserById(id: string): ManagedUserRecord | null {
  return listManagedUsers().find((user) => user.id === id) ?? null;
}

export function getManagedUserByEmail(
  email: string,
): ManagedUserRecord | null {
  const key = normalizeEmail(email);
  return listManagedUsers().find((user) => user.email === key) ?? null;
}

function persistUser(user: ManagedUserRecord): void {
  const overrides = loadOverrides().filter(
    (item) => item.email !== user.email && item.id !== user.id,
  );
  overrides.push(user);
  saveOverrides(overrides);
}

export interface UpdateManagedUserInput {
  displayName?: string;
  role?: AppRole;
  permissions?: PermissionKey[];
  /** When set (non-empty), replaces the stored password. */
  newPassword?: string;
  isActive?: boolean;
}

export function updateManagedUser(
  userId: string,
  input: UpdateManagedUserInput,
): ManagedUserRecord {
  const current = getManagedUserById(userId);
  if (!current) {
    throw new Error("User not found");
  }

  const nextRole = input.role ?? current.role;
  const next = normalizeRecord({
    ...current,
    displayName:
      input.displayName !== undefined
        ? input.displayName.trim()
        : current.displayName,
    role: nextRole,
    permissions:
      input.permissions !== undefined
        ? input.permissions
        : input.role !== undefined && input.role !== current.role
          ? getDefaultPermissionsForRole(nextRole)
          : current.permissions,
    password:
      input.newPassword !== undefined && input.newPassword.trim()
        ? input.newPassword
        : current.password,
    isActive:
      input.isActive !== undefined ? input.isActive : current.isActive,
  });

  if (!next.displayName) {
    throw new Error("Display name is required");
  }
  if (!isAppRole(next.role)) {
    throw new Error("Invalid role");
  }

  persistUser(next);
  return next;
}

export function recordUserLogin(email: string): void {
  const current = getManagedUserByEmail(email);
  if (!current) return;
  persistUser({
    ...current,
    lastLoginAt: new Date().toISOString(),
  });
}

export function createManagedUser(input: {
  email: string;
  displayName: string;
  role: AppRole;
  password: string;
  permissions?: PermissionKey[];
}): ManagedUserRecord {
  const email = normalizeEmail(input.email);
  if (!email) throw new Error("Email is required");
  if (getManagedUserByEmail(email)) {
    throw new Error("A user with this email already exists");
  }
  if (!input.password.trim()) {
    throw new Error("Password is required");
  }

  const deleted = loadDeletedIds();
  deleted.delete(email);
  saveDeletedIds(deleted);

  const user = normalizeRecord({
    id: generateId(),
    email,
    displayName: input.displayName,
    role: input.role,
    password: input.password,
    permissions:
      input.permissions ?? getDefaultPermissionsForRole(input.role),
    isActive: true,
    lastLoginAt: null,
  });
  persistUser(user);
  return user;
}

export function deleteManagedUser(userId: string): void {
  const current = getManagedUserById(userId);
  if (!current) {
    throw new Error("User not found");
  }
  if (isPrimaryAdmin(current)) {
    throw new Error("The primary system administrator cannot be deleted");
  }

  const overrides = loadOverrides().filter(
    (item) => item.id !== userId && item.email !== current.email,
  );
  saveOverrides(overrides);

  const deleted = loadDeletedIds();
  deleted.add(current.id);
  deleted.add(current.email);
  saveDeletedIds(deleted);
}

export function permissionsEqual(
  a: PermissionKey[],
  b: PermissionKey[],
): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((key) => setB.has(key));
}
