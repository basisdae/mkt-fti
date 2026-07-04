import { logAuthAudit } from "@/lib/auth/audit-log";
import {
  getDefaultPermissionsForRole,
  type PermissionKey,
} from "@/lib/auth/permission-catalog";
import {
  createManagedUser,
  deleteManagedUser,
  getManagedUserById,
  listManagedUsers,
  permissionsEqual,
  updateManagedUser,
  type UpdateManagedUserInput,
} from "@/lib/auth/user-registry";
import { generateId } from "@/lib/generate-id";
import {
  deleteAppUserInSupabase,
  ensureSeedUsersInSupabase,
  insertAuthAuditInSupabase,
  listAppUsersFromSupabase,
  upsertAppUserInSupabase,
} from "@/lib/services/app-users";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { AppRole, AppUser, ManagedUserRecord } from "@/types/auth";

function assertAdmin(actor: AppUser) {
  if (!actor.permissions?.includes("users.manage")) {
    throw new Error("Only administrators can manage users");
  }
}

async function persistAudit(
  entry: Parameters<typeof logAuthAudit>[0],
): Promise<void> {
  logAuthAudit(entry);
  await insertAuthAuditInSupabase(entry).catch(() => undefined);
}

function applyUpdate(
  current: ManagedUserRecord,
  input: UpdateManagedUserInput,
): ManagedUserRecord {
  const nextRole = input.role ?? current.role;
  return {
    ...current,
    displayName:
      input.displayName !== undefined
        ? input.displayName.trim() || current.displayName
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
        ? input.newPassword.trim()
        : current.password,
    isActive:
      input.isActive !== undefined ? input.isActive : current.isActive,
  };
}

export async function listUsersForAdmin(
  actor: AppUser,
): Promise<ManagedUserRecord[]> {
  assertAdmin(actor);

  if (isSupabaseConfigured()) {
    try {
      await ensureSeedUsersInSupabase();
      return await listAppUsersFromSupabase();
    } catch {
      // fall through
    }
  }
  return listManagedUsers();
}

export async function adminUpdateUser(
  actor: AppUser,
  userId: string,
  input: UpdateManagedUserInput,
): Promise<ManagedUserRecord> {
  assertAdmin(actor);

  let current: ManagedUserRecord | null = null;
  if (isSupabaseConfigured()) {
    try {
      const users = await listAppUsersFromSupabase();
      current = users.find((user) => user.id === userId) ?? null;
    } catch {
      current = getManagedUserById(userId);
    }
  } else {
    current = getManagedUserById(userId);
  }

  if (!current) {
    throw new Error("User not found");
  }

  if (actor.id === userId) {
    if (input.isActive === false) {
      throw new Error("You cannot deactivate your own account");
    }
    if (input.role && input.role !== "admin") {
      throw new Error("You cannot remove your own admin role");
    }
    if (
      input.permissions &&
      !input.permissions.includes("users.manage")
    ) {
      throw new Error("You cannot remove your own Manage Users access");
    }
  }

  const passwordChanged = Boolean(input.newPassword?.trim());
  const permissionsChanged =
    input.permissions !== undefined &&
    !permissionsEqual(input.permissions, current.permissions);
  const roleChanged =
    input.role !== undefined && input.role !== current.role;

  const next = applyUpdate(current, input);
  let updated = next;

  if (isSupabaseConfigured()) {
    try {
      updated = await upsertAppUserInSupabase(next);
    } catch {
      updated = updateManagedUser(userId, input);
    }
  } else {
    updated = updateManagedUser(userId, input);
  }

  if (passwordChanged) {
    await persistAudit({
      action: "password_reset",
      actorId: actor.id,
      actorEmail: actor.email,
      targetUserId: updated.id,
      targetEmail: updated.email,
      detail: "Admin reset password",
    });
  }

  if (roleChanged) {
    await persistAudit({
      action: "role_changed",
      actorId: actor.id,
      actorEmail: actor.email,
      targetUserId: updated.id,
      targetEmail: updated.email,
      detail: `${current.role} → ${updated.role}`,
    });
  }

  if (permissionsChanged) {
    await persistAudit({
      action: "permission_changed",
      actorId: actor.id,
      actorEmail: actor.email,
      targetUserId: updated.id,
      targetEmail: updated.email,
      detail: `${updated.permissions.length} permissions`,
    });
  }

  if (
    input.isActive !== undefined &&
    input.isActive !== current.isActive
  ) {
    await persistAudit({
      action: input.isActive ? "user_activated" : "user_deactivated",
      actorId: actor.id,
      actorEmail: actor.email,
      targetUserId: updated.id,
      targetEmail: updated.email,
    });
  } else if (
    !passwordChanged &&
    !roleChanged &&
    !permissionsChanged &&
    input.displayName !== undefined &&
    input.displayName.trim() !== current.displayName
  ) {
    await persistAudit({
      action: "user_updated",
      actorId: actor.id,
      actorEmail: actor.email,
      targetUserId: updated.id,
      targetEmail: updated.email,
      detail: "Profile updated",
    });
  }

  return updated;
}

export async function adminCreateUser(
  actor: AppUser,
  input: {
    email: string;
    displayName: string;
    role: AppRole;
    password: string;
    permissions?: PermissionKey[];
  },
): Promise<ManagedUserRecord> {
  assertAdmin(actor);

  const record: ManagedUserRecord = {
    id: generateId(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    displayName: input.displayName.trim(),
    role: input.role,
    permissions:
      input.permissions ?? getDefaultPermissionsForRole(input.role),
    isActive: true,
    lastLoginAt: null,
  };

  let created = record;
  if (isSupabaseConfigured()) {
    try {
      created = await upsertAppUserInSupabase(record);
    } catch {
      created = createManagedUser(input);
    }
  } else {
    created = createManagedUser(input);
  }

  await persistAudit({
    action: "user_created",
    actorId: actor.id,
    actorEmail: actor.email,
    targetUserId: created.id,
    targetEmail: created.email,
    detail: `Role ${created.role} · ${created.permissions.length} permissions`,
  });
  return created;
}

export async function adminDeleteUser(
  actor: AppUser,
  userId: string,
): Promise<void> {
  assertAdmin(actor);
  if (actor.id === userId) {
    throw new Error("You cannot delete your own account");
  }

  let current = getManagedUserById(userId);
  if (isSupabaseConfigured()) {
    try {
      const users = await listAppUsersFromSupabase();
      current = users.find((user) => user.id === userId) ?? current;
      await deleteAppUserInSupabase(userId);
    } catch {
      if (current) deleteManagedUser(userId);
    }
  } else if (current) {
    deleteManagedUser(userId);
  }

  if (!current) {
    throw new Error("User not found");
  }

  await persistAudit({
    action: "user_deleted",
    actorId: actor.id,
    actorEmail: actor.email,
    targetUserId: current.id,
    targetEmail: current.email,
  });
}
