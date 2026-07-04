"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Plus, Trash2, Users } from "lucide-react";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Toast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/AuthStore";
import {
  adminCreateUser,
  adminDeleteUser,
  adminUpdateUser,
} from "@/lib/auth/admin-users";
import {
  listAuthAuditLog,
  type AuthAuditEntry,
} from "@/lib/auth/audit-log";
import {
  getDefaultPermissionsForRole,
  groupPermissionCatalog,
  type PermissionKey,
} from "@/lib/auth/permission-catalog";
import { canManageUsers } from "@/lib/auth/permissions";
import { APP_ROLE_LABELS } from "@/lib/auth/roles";
import { listManagedUsersPublic } from "@/lib/auth/user-registry";
import { formatDate } from "@/lib/utils";
import type { AppRole, ManagedUserPublic } from "@/types/auth";

const ROLE_OPTIONS = (
  ["admin", "mkt_hq", "rnd", "pu", "sale", "ceo"] as AppRole[]
).map((role) => ({
  value: role,
  label: APP_ROLE_LABELS[role],
}));

const AUDIT_LABELS: Record<string, string> = {
  user_created: "User created",
  user_updated: "User updated",
  user_deleted: "User deleted",
  user_activated: "User enabled",
  user_deactivated: "User disabled",
  password_reset: "Password reset",
  role_changed: "Role changed",
  permission_changed: "Permission changed",
};

type EditorMode = "edit" | "create";

interface EditorState {
  mode: EditorMode;
  userId?: string;
  displayName: string;
  email: string;
  role: AppRole;
  isActive: boolean;
  newPassword: string;
  permissions: PermissionKey[];
}

function emptyCreateState(): EditorState {
  const role: AppRole = "mkt_hq";
  return {
    mode: "create",
    displayName: "",
    email: "",
    role,
    isActive: true,
    newPassword: "",
    permissions: getDefaultPermissionsForRole(role),
  };
}

function editStateFromUser(user: ManagedUserPublic): EditorState {
  return {
    mode: "edit",
    userId: user.id,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    newPassword: "",
    permissions: [...user.permissions],
  };
}

function togglePermission(
  permissions: PermissionKey[],
  key: PermissionKey,
): PermissionKey[] {
  if (permissions.includes(key)) {
    return permissions.filter((item) => item !== key);
  }
  return [...permissions, key];
}

export function ManageUsersView() {
  const router = useRouter();
  const { user, ready, refreshSession } = useAuth();
  const [users, setUsers] = useState<ManagedUserPublic[]>([]);
  const [audit, setAudit] = useState<AuthAuditEntry[]>([]);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const permissionGroups = useMemo(() => groupPermissionCatalog(), []);

  const refresh = useCallback(() => {
    setUsers(listManagedUsersPublic());
    setAudit(listAuthAuditLog().slice(0, 30));
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!canManageUsers(user)) {
      router.replace("/settings");
      return;
    }
    refresh();
  }, [ready, user, router, refresh]);

  if (!ready || !canManageUsers(user)) {
    return (
      <div className="page-shell">
        <p className="text-sm text-gray-500">Checking access…</p>
      </div>
    );
  }

  function applyRoleTemplate(role: AppRole) {
    setEditor((prev) =>
      prev
        ? {
            ...prev,
            role,
            permissions: getDefaultPermissionsForRole(role),
          }
        : prev,
    );
  }

  async function handleSave() {
    if (!user || !editor) return;
    setSaving(true);
    setError(null);
    try {
      if (editor.mode === "create") {
        if (!editor.newPassword.trim()) {
          throw new Error("Password is required for new users");
        }
        adminCreateUser(user, {
          email: editor.email,
          displayName: editor.displayName,
          role: editor.role,
          password: editor.newPassword,
          permissions: editor.permissions,
        });
        setToast({
          title: "User created",
          message: `${editor.email} was added.`,
          variant: "success",
        });
      } else if (editor.userId) {
        adminUpdateUser(user, editor.userId, {
          displayName: editor.displayName,
          role: editor.role,
          isActive: editor.isActive,
          permissions: editor.permissions,
          newPassword: editor.newPassword.trim() || undefined,
        });
        if (editor.userId === user.id) {
          refreshSession();
        }
        setToast({
          title: "User updated",
          message: editor.newPassword.trim()
            ? "Profile, permissions, and password saved."
            : "Profile and permissions saved.",
          variant: "success",
        });
      }
      setEditor(null);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(target: ManagedUserPublic) {
    if (!user) return;
    const confirmed = window.confirm(
      `Delete ${target.displayName} (${target.email})? This cannot be undone.`,
    );
    if (!confirmed) return;
    try {
      adminDeleteUser(user, target.id);
      setToast({
        title: "User deleted",
        message: `${target.email} was removed.`,
        variant: "success",
      });
      refresh();
    } catch (err) {
      setToast({
        title: "Delete failed",
        message: err instanceof Error ? err.message : "Could not delete user",
        variant: "error",
      });
    }
  }

  return (
    <div className="page-shell">
      <div className="mb-4">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to settings
        </Link>
      </div>

      <div className="page-header-block flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Manage Users</h1>
          <p className="page-description">
            Roles are templates. Permissions are customized per user and
            enforced across the app.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setError(null);
            setEditor(emptyCreateState());
          }}
        >
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Card padding="lg" className="overflow-hidden">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-gray-900">
              Users ({users.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Email</th>
                  <th className="px-2 py-2">Role</th>
                  <th className="px-2 py-2">Permissions</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Last login</th>
                  <th className="px-2 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="px-2 py-3 font-medium text-gray-900">
                      {row.displayName}
                    </td>
                    <td className="px-2 py-3 text-gray-600">{row.email}</td>
                    <td className="px-2 py-3 text-gray-700">
                      {APP_ROLE_LABELS[row.role] ?? row.role}
                    </td>
                    <td className="px-2 py-3 text-gray-500">
                      {row.permissions.length}
                    </td>
                    <td className="px-2 py-3">
                      <Badge variant={row.isActive ? "success" : "muted"}>
                        {row.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-2 py-3 text-gray-500">
                      {row.lastLoginAt ? formatDate(row.lastLoginAt) : "—"}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setError(null);
                            setEditor(editStateFromUser(row));
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-fti-red hover:bg-red-50"
                          onClick={() => handleDelete(row)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="text-base font-semibold text-gray-900">Activity Log</h2>
          <p className="mt-1 text-xs text-gray-500">
            User created, password reset, role/permission changes, enable/disable.
          </p>
          <ul className="mt-4 max-h-[520px] space-y-3 overflow-y-auto">
            {audit.length === 0 ? (
              <li className="text-sm text-gray-400">No activity yet</li>
            ) : (
              audit.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-2.5"
                >
                  <p className="text-sm font-medium text-gray-800">
                    {AUDIT_LABELS[entry.action] ?? entry.action}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {entry.targetEmail}
                    {entry.detail ? ` · ${entry.detail}` : ""}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400">
                    by {entry.actorEmail} · {formatDate(entry.createdAt)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      {editor && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-gray-900/50 p-4 backdrop-blur-sm">
          <Card className="my-6 w-full max-w-3xl" padding="lg">
            <h3 className="text-lg font-semibold text-gray-900">
              {editor.mode === "create" ? "Add User" : "Edit User"}
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Select a role to load default permissions, then customize
              checkboxes. Passwords are never displayed.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Input
                label="Display name"
                value={editor.displayName}
                onChange={(e) =>
                  setEditor((prev) =>
                    prev ? { ...prev, displayName: e.target.value } : prev,
                  )
                }
                required
              />
              <Input
                label="Email"
                type="email"
                value={editor.email}
                onChange={(e) =>
                  setEditor((prev) =>
                    prev ? { ...prev, email: e.target.value } : prev,
                  )
                }
                readOnly={editor.mode === "edit"}
                disabled={editor.mode === "edit"}
                required
              />
              <Select
                label="Role template"
                options={ROLE_OPTIONS}
                value={editor.role}
                onChange={(e) =>
                  applyRoleTemplate(e.target.value as AppRole)
                }
              />
              <Input
                label={
                  editor.mode === "create"
                    ? "Password"
                    : "New password (optional)"
                }
                type="password"
                autoComplete="new-password"
                value={editor.newPassword}
                onChange={(e) =>
                  setEditor((prev) =>
                    prev ? { ...prev, newPassword: e.target.value } : prev,
                  )
                }
                placeholder={
                  editor.mode === "edit"
                    ? "Leave blank to keep current password"
                    : "Set initial password"
                }
                required={editor.mode === "create"}
              />
            </div>

            {editor.mode === "edit" && (
              <label className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-sm font-medium text-gray-700">
                  Active account
                </span>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded accent-primary"
                  checked={editor.isActive}
                  onChange={(e) =>
                    setEditor((prev) =>
                      prev
                        ? { ...prev, isActive: e.target.checked }
                        : prev,
                    )
                  }
                />
              </label>
            )}

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-gray-900">
                  Permissions ({editor.permissions.length})
                </h4>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => applyRoleTemplate(editor.role)}
                >
                  Reset to role defaults
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {permissionGroups.map((group) => (
                  <div
                    key={group.group}
                    className="rounded-xl border border-gray-100 bg-gray-50/60 p-3"
                  >
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      {group.group}
                    </p>
                    <div className="space-y-2">
                      {group.items.map((item) => {
                        const checked = editor.permissions.includes(item.key);
                        return (
                          <label
                            key={item.key}
                            className="flex cursor-pointer items-center gap-2 text-sm text-gray-700"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded accent-primary"
                              checked={checked}
                              onChange={() =>
                                setEditor((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        permissions: togglePermission(
                                          prev.permissions,
                                          item.key,
                                        ),
                                      }
                                    : prev,
                                )
                              }
                            />
                            {item.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <p className="mt-4 text-sm font-medium text-fti-red">{error}</p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={saving}
                onClick={() => setEditor(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={saving}
                aria-busy={saving}
                onClick={handleSave}
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {toast && (
        <Toast
          title={toast.title}
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
