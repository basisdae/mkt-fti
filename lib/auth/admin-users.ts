import { logAuthAudit } from "@/lib/auth/audit-log";
import type { PermissionKey } from "@/lib/auth/permission-catalog";
import {
  createManagedUser,
  deleteManagedUser,
  getManagedUserById,
  permissionsEqual,
  updateManagedUser,
  type UpdateManagedUserInput,
} from "@/lib/auth/user-registry";
import type { AppRole, AppUser, ManagedUserRecord } from "@/types/auth";

function assertAdmin(actor: AppUser) {
  if (!actor.permissions?.includes("users.manage")) {
    throw new Error("Only administrators can manage users");
  }
}

export function adminUpdateUser(
  actor: AppUser,
  userId: string,
  input: UpdateManagedUserInput,
): ManagedUserRecord {
  assertAdmin(actor);

  const current = getManagedUserById(userId);
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

  const updated = updateManagedUser(userId, input);

  if (passwordChanged) {
    logAuthAudit({
      action: "password_reset",
      actorId: actor.id,
      actorEmail: actor.email,
      targetUserId: updated.id,
      targetEmail: updated.email,
      detail: "Admin reset password",
    });
  }

  if (roleChanged) {
    logAuthAudit({
      action: "role_changed",
      actorId: actor.id,
      actorEmail: actor.email,
      targetUserId: updated.id,
      targetEmail: updated.email,
      detail: `${current.role} → ${updated.role}`,
    });
  }

  if (permissionsChanged) {
    logAuthAudit({
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
    logAuthAudit({
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
    logAuthAudit({
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

export function adminCreateUser(
  actor: AppUser,
  input: {
    email: string;
    displayName: string;
    role: AppRole;
    password: string;
    permissions?: PermissionKey[];
  },
): ManagedUserRecord {
  assertAdmin(actor);

  const created = createManagedUser(input);
  logAuthAudit({
    action: "user_created",
    actorId: actor.id,
    actorEmail: actor.email,
    targetUserId: created.id,
    targetEmail: created.email,
    detail: `Role ${created.role} · ${created.permissions.length} permissions`,
  });
  return created;
}

export function adminDeleteUser(actor: AppUser, userId: string): void {
  assertAdmin(actor);
  if (actor.id === userId) {
    throw new Error("You cannot delete your own account");
  }

  const current = getManagedUserById(userId);
  if (!current) {
    throw new Error("User not found");
  }

  deleteManagedUser(userId);
  logAuthAudit({
    action: "user_deleted",
    actorId: actor.id,
    actorEmail: actor.email,
    targetUserId: current.id,
    targetEmail: current.email,
  });
}
