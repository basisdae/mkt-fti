"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Tags } from "lucide-react";
import { Input } from "@/components/forms/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/AuthStore";
import { canEditProducts, canManageUsers } from "@/lib/auth/permissions";
import { isOtherTag, type ProductTagGroupWithTags } from "@/lib/product-tags";
import {
  createProductTag,
  createProductTagGroup,
  loadFullProductTagCatalog,
  updateProductTag,
  updateProductTagGroup,
} from "@/lib/services/product-tags";
import { cn } from "@/lib/utils";

export function ProductTagsSettings() {
  const { user } = useAuth();
  const canEdit = canEditProducts(user) || canManageUsers(user);
  const [groups, setGroups] = useState<ProductTagGroupWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [newTagByGroup, setNewTagByGroup] = useState<Record<string, string>>(
    {},
  );
  const [newGroupName, setNewGroupName] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const catalog = await loadFullProductTagCatalog();
      setGroups(catalog);
      setExpanded((prev) => {
        const next = { ...prev };
        for (const group of catalog) {
          if (next[group.id] === undefined) next[group.id] = group.active;
        }
        return next;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function run(action: () => Promise<void>, success: string) {
    setSaving(true);
    setMessage(null);
    try {
      await action();
      await reload();
      setMessage(success);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-gray-500">Loading product tags…</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Tags className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Product Classification Tags
            </h2>
            <p className="mt-1 text-xs text-gray-400">
              Data-driven groups for filtering, export, and future dealer
              product finder. Disabled tags stay on existing products but are
              hidden for new selections.
            </p>
          </div>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-gray-500">
          Tag tables are missing. Run migrations 20260704190000_product_tags.sql
          and 20260704192000_product_tag_classification_v2.sql.
        </p>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const open = expanded[group.id] ?? false;
            return (
              <div
                key={group.id}
                className="rounded-xl border border-gray-100 bg-gray-50/60"
              >
                <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((prev) => ({
                        ...prev,
                        [group.id]: !open,
                      }))
                    }
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-800"
                  >
                    {open ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    {group.name}
                  </button>
                  <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    {group.key}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      group.active
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-200 text-gray-600",
                    )}
                  >
                    {group.active ? "Active" : "Disabled"}
                  </span>
                  {canEdit && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={saving}
                      className="ml-auto"
                      onClick={() =>
                        void run(
                          () =>
                            updateProductTagGroup({
                              id: group.id,
                              active: !group.active,
                            }),
                          group.active
                            ? `Disabled ${group.name}`
                            : `Enabled ${group.name}`,
                        )
                      }
                    >
                      {group.active ? "Disable group" : "Enable group"}
                    </Button>
                  )}
                </div>

                {open && (
                  <div className="space-y-2 border-t border-gray-100 px-3 py-3">
                    {group.tags.map((tag) => (
                      <div
                        key={tag.id}
                        className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-2"
                      >
                        {canEdit ? (
                          <Input
                            value={tag.label}
                            onChange={(e) => {
                              const label = e.target.value;
                              setGroups((prev) =>
                                prev.map((g) =>
                                  g.id !== group.id
                                    ? g
                                    : {
                                        ...g,
                                        tags: g.tags.map((t) =>
                                          t.id === tag.id
                                            ? { ...t, label }
                                            : t,
                                        ),
                                      },
                                ),
                              );
                            }}
                            onBlur={() => {
                              if (!tag.label.trim()) return;
                              void run(
                                () =>
                                  updateProductTag({
                                    id: tag.id,
                                    label: tag.label,
                                  }),
                                "Tag updated",
                              );
                            }}
                            className="min-w-[140px] flex-1"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-800">
                            {tag.label}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">
                          {tag.value}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            tag.active
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-200 text-gray-600",
                          )}
                        >
                          {tag.active ? "Active" : "Disabled"}
                        </span>
                        {canEdit && !isOtherTag(tag) && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={saving}
                            onClick={() =>
                              void run(
                                () =>
                                  updateProductTag({
                                    id: tag.id,
                                    active: !tag.active,
                                  }),
                                tag.active
                                  ? `Disabled ${tag.label}`
                                  : `Enabled ${tag.label}`,
                              )
                            }
                          >
                            {tag.active ? "Disable" : "Enable"}
                          </Button>
                        )}
                      </div>
                    ))}

                    {canEdit && (
                      <div className="flex flex-wrap items-end gap-2 pt-1">
                        <div className="min-w-[180px] flex-1">
                          <Input
                            label="New tag"
                            value={newTagByGroup[group.id] ?? ""}
                            onChange={(e) =>
                              setNewTagByGroup((prev) => ({
                                ...prev,
                                [group.id]: e.target.value,
                              }))
                            }
                            placeholder="e.g. Ceramic"
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={
                            saving || !(newTagByGroup[group.id] ?? "").trim()
                          }
                          onClick={() => {
                            const label = (newTagByGroup[group.id] ?? "").trim();
                            if (!label) return;
                            void run(async () => {
                              await createProductTag({
                                groupId: group.id,
                                label,
                              });
                              setNewTagByGroup((prev) => ({
                                ...prev,
                                [group.id]: "",
                              }));
                            }, `Added ${label}`);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                          Add tag
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canEdit && (
        <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-gray-100 pt-4">
          <div className="min-w-[200px] flex-1">
            <Input
              label="New group"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g. Smart Features"
            />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={saving || !newGroupName.trim()}
            onClick={() => {
              const name = newGroupName.trim();
              if (!name) return;
              void run(async () => {
                await createProductTagGroup({ name });
                setNewGroupName("");
              }, `Added group ${name}`);
            }}
          >
            <Plus className="h-4 w-4" />
            Add group
          </Button>
        </div>
      )}

      {message && (
        <p className="mt-3 text-xs font-medium text-gray-600">{message}</p>
      )}
    </Card>
  );
}
