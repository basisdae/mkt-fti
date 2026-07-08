"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/AuthStore";
import { useAssetPlatforms } from "@/hooks/AssetPlatformStore";
import {
  ASSET_PLATFORM_COLOR_OPTIONS,
  ASSET_PLATFORM_ICON_OPTIONS,
  getAssetPlatformColorClass,
  getAssetPlatformIcon,
  slugifyPlatformId,
  type AssetPlatform,
  type AssetPlatformColorToken,
  type AssetPlatformIconKey,
} from "@/lib/asset-platforms";
import { canManageUsers } from "@/lib/auth/permissions";

export function AssetPlatformsSettings() {
  const { user } = useAuth();
  const { platforms, ready, save } = useAssetPlatforms();
  const canEdit = canManageUsers(user);
  const [draft, setDraft] = useState<AssetPlatform[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const rows = draft ?? platforms;

  function startEdit() {
    setDraft(platforms.map((platform) => ({ ...platform })));
    setMessage(null);
  }

  function updateRow(id: string, patch: Partial<AssetPlatform>) {
    setDraft((prev) =>
      (prev ?? platforms).map((row) =>
        row.id === id ? { ...row, ...patch } : row,
      ),
    );
  }

  function moveRow(id: string, direction: -1 | 1) {
    setDraft((prev) => {
      const list = [...(prev ?? platforms)];
      const index = list.findIndex((row) => row.id === id);
      const swap = index + direction;
      if (index < 0 || swap < 0 || swap >= list.length) return list;
      const tmp = list[index]!;
      list[index] = list[swap]!;
      list[swap] = tmp;
      return list.map((row, sortOrder) => ({ ...row, sortOrder }));
    });
  }

  function addRow() {
    setDraft((prev) => {
      const list = [...(prev ?? platforms)];
      const name = `Platform ${list.length + 1}`;
      let id = slugifyPlatformId(name);
      if (list.some((row) => row.id === id)) {
        id = `${id}_${Date.now()}`;
      }
      list.push({
        id,
        name,
        iconKey: "link",
        colorToken: "gray",
        isActive: true,
        sortOrder: list.length,
      });
      return list;
    });
  }

  function removeRow(id: string) {
    if (id === "other") return;
    setDraft((prev) => (prev ?? platforms).filter((row) => row.id !== id));
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    setMessage(null);
    try {
      await save(draft);
      setDraft(null);
      setMessage("Asset platforms saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return (
      <Card>
        <p className="text-sm text-gray-500">Loading asset platforms…</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Asset Platforms
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Platforms for Product Assets dropdown and icons. Disabled platforms
            stay on existing records but are hidden from new selections. Other
            is always available.
          </p>
        </div>
        {canEdit && !draft && (
          <Button type="button" size="sm" variant="secondary" onClick={startEdit}>
            Manage Platforms
          </Button>
        )}
      </div>

      {draft ? (
        <div className="space-y-3">
          {rows.map((row, index) => {
            const Icon = getAssetPlatformIcon(row.iconKey);
            return (
              <div
                key={row.id}
                className="rounded-xl border border-gray-100 bg-gray-50/70 p-3"
              >
                <div className="grid gap-3 sm:grid-cols-[auto_1fr_1fr_1fr_auto]">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg bg-white ${getAssetPlatformColorClass(row.colorToken)}`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <Input
                    label="Name"
                    value={row.name}
                    onChange={(e) =>
                      updateRow(row.id, { name: e.target.value })
                    }
                    disabled={row.id === "other"}
                  />
                  <Select
                    label="Icon"
                    options={ASSET_PLATFORM_ICON_OPTIONS}
                    value={row.iconKey}
                    onChange={(e) =>
                      updateRow(row.id, {
                        iconKey: e.target.value as AssetPlatformIconKey,
                      })
                    }
                  />
                  <Select
                    label="Color"
                    options={ASSET_PLATFORM_COLOR_OPTIONS.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                    value={row.colorToken}
                    onChange={(e) =>
                      updateRow(row.id, {
                        colorToken: e.target.value as AssetPlatformColorToken,
                      })
                    }
                  />
                  <div className="flex items-end gap-1 pb-1">
                    <button
                      type="button"
                      className="rounded-md p-2 text-gray-400 hover:bg-white disabled:opacity-30"
                      disabled={index === 0}
                      onClick={() => moveRow(row.id, -1)}
                      aria-label="Move up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-md p-2 text-gray-400 hover:bg-white disabled:opacity-30"
                      disabled={index === rows.length - 1}
                      onClick={() => moveRow(row.id, 1)}
                      aria-label="Move down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {row.id !== "other" && (
                      <button
                        type="button"
                        className="rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-fti-red"
                        onClick={() => removeRow(row.id)}
                        aria-label="Remove platform"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                {row.id !== "other" && (
                  <label className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded accent-primary"
                      checked={row.isActive}
                      onChange={(e) =>
                        updateRow(row.id, { isActive: e.target.checked })
                      }
                    />
                    Enabled for new selections
                  </label>
                )}
              </div>
            );
          })}

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={addRow}>
              <Plus className="h-4 w-4" />
              Add platform
            </Button>
            <div className="ml-auto flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={saving}
                onClick={() => setDraft(null)}
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
                {saving ? "Saving…" : "Save Platforms"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {platforms.map((platform) => {
            const Icon = getAssetPlatformIcon(platform.iconKey);
            return (
              <li
                key={platform.id}
                className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2"
              >
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white ${getAssetPlatformColorClass(platform.colorToken)}`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="text-sm font-medium text-gray-800">
                  {platform.name}
                </span>
                <span className="ml-auto text-xs text-gray-400">
                  {platform.isActive || platform.id === "other"
                    ? "Active"
                    : "Disabled"}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {message && (
        <p className="mt-3 text-xs font-medium text-gray-500">{message}</p>
      )}
      {!canEdit && (
        <p className="mt-3 text-xs text-gray-400">
          Only Admin can edit asset platforms.
        </p>
      )}
    </Card>
  );
}
