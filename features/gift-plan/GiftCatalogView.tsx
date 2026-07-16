"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { GiftCatalogCard } from "@/components/gift-plan/GiftCatalogCard";
import { GiftCatalogItemDialog } from "@/components/gift-plan/GiftCatalogItemDialog";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/forms/Select";
import { useAuth } from "@/hooks/AuthStore";
import { canEditGiftPlans } from "@/lib/auth/permissions";
import {
  deleteGiftCatalogAction,
  duplicateGiftCatalogAction,
  isGiftCatalogInUseAction,
  listGiftCatalogAction,
  saveGiftCatalogAction,
  setGiftCatalogStatusAction,
} from "@/lib/actions/gift-catalog";
import {
  GIFT_ITEM_CATEGORIES,
  GIFT_ITEM_SOURCES,
} from "@/types/gift-plan";
import {
  GIFT_ITEM_CATEGORY_LABELS,
  GIFT_ITEM_SOURCE_LABELS,
} from "@/lib/gift-plan-format";
import { GIFT_CATALOG_STATUSES } from "@/types/gift-catalog";
import { GIFT_CATALOG_STATUS_LABELS } from "@/lib/gift-catalog-format";
import type { GiftCatalogInput, GiftCatalogRow, GiftCatalogSortKey } from "@/types/gift-catalog";

export function GiftCatalogView() {
  const { user } = useAuth();
  const canEdit = canEditGiftPlans(user);
  const [items, setItems] = useState<GiftCatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [source, setSource] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<GiftCatalogSortKey>("name");
  const [showArchived, setShowArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GiftCatalogRow | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    const result = await listGiftCatalogAction({ includeArchived: true });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      setItems([]);
      return;
    }
    setError(null);
    setItems(result.data);
  }

  useEffect(() => {
    void refresh();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = items.filter((item) => {
      if (!showArchived && item.status === "archived") return false;
      if (status !== "all" && item.status !== status) return false;
      if (category !== "all" && item.category !== category) return false;
      if (source !== "all" && item.source !== source) return false;
      if (!q) return true;
      return (
        item.gift_name.toLowerCase().includes(q) ||
        (item.internal_code ?? "").toLowerCase().includes(q)
      );
    });
    rows = [...rows].sort((a, b) => {
      if (sort === "updated") {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      if (sort === "actual_cost") {
        return Number(b.default_actual_cost) - Number(a.default_actual_cost);
      }
      if (sort === "estimated_value") {
        return (
          Number(b.default_estimated_gift_value) -
          Number(a.default_estimated_gift_value)
        );
      }
      return a.gift_name.localeCompare(b.gift_name);
    });
    return rows;
  }, [items, query, category, source, status, sort, showArchived]);

  async function handleSave(values: GiftCatalogInput) {
    setSaving(true);
    setSaveError(null);
    const result = await saveGiftCatalogAction({
      id: editing?.id,
      values,
    });
    setSaving(false);
    if (!result.ok) {
      setSaveError(result.error);
      return;
    }
    setDialogOpen(false);
    setEditing(null);
    void refresh();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Gift Plans
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">
            คลังของพรีเมียมและของแจก
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            จัดการรายการของขวัญสำหรับเลือกเข้า Gift Plan — แยกจาก Product และ Supplier
          </p>
          <Link href="/gift-plans" className="mt-2 inline-block text-sm text-primary">
            ← กลับ Gift Plans
          </Link>
        </div>
        {canEdit ? (
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Gift
          </Button>
        ) : null}
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or code…"
            className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-40"
          options={[
            { value: "all", label: "All Categories" },
            ...GIFT_ITEM_CATEGORIES.map((value) => ({
              value,
              label: GIFT_ITEM_CATEGORY_LABELS[value],
            })),
          ]}
        />
        <Select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-36"
          options={[
            { value: "all", label: "All Sources" },
            ...GIFT_ITEM_SOURCES.map((value) => ({
              value,
              label: GIFT_ITEM_SOURCE_LABELS[value],
            })),
          ]}
        />
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-32"
          options={[
            { value: "all", label: "All Status" },
            ...GIFT_CATALOG_STATUSES.map((value) => ({
              value,
              label: GIFT_CATALOG_STATUS_LABELS[value],
            })),
          ]}
        />
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value as GiftCatalogSortKey)}
          className="w-40"
          options={[
            { value: "name", label: "Sort: Name" },
            { value: "updated", label: "Latest Updated" },
            { value: "actual_cost", label: "Actual Cost" },
            { value: "estimated_value", label: "Est. Value" },
          ]}
        />
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          Show archived
        </label>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-fti-red">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-gray-500">Loading catalog…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((item) => (
            <div key={item.id} className="space-y-2">
              <GiftCatalogCard
                item={item}
                activeTierName="—"
                inActiveTier={false}
                activeTierQty={null}
                otherTierUsage={[]}
                onAdd={() => {
                  if (!canEdit) return;
                  setEditing(item);
                  setDialogOpen(true);
                }}
                onEditQty={() => {
                  if (!canEdit) return;
                  setEditing(item);
                  setDialogOpen(true);
                }}
              />
              {canEdit ? (
                <div className="flex flex-wrap gap-2 px-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      const result = await duplicateGiftCatalogAction(item.id);
                      if (!result.ok) setError(result.error);
                      else void refresh();
                    }}
                  >
                    Duplicate
                  </Button>
                  {item.status !== "archived" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        const result = await setGiftCatalogStatusAction(
                          item.id,
                          "archived",
                        );
                        if (!result.ok) setError(result.error);
                        else void refresh();
                      }}
                    >
                      Archive
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        const result = await setGiftCatalogStatusAction(
                          item.id,
                          "active",
                        );
                        if (!result.ok) setError(result.error);
                        else void refresh();
                      }}
                    >
                      Restore
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      const usage = await isGiftCatalogInUseAction(item.id);
                      if (!usage.ok) {
                        setError(usage.error);
                        return;
                      }
                      if (usage.data) {
                        setError(
                          "This item is used in a gift plan. Archive instead of deleting.",
                        );
                        return;
                      }
                      if (!window.confirm(`Delete "${item.gift_name}"?`)) return;
                      const result = await deleteGiftCatalogAction(item.id);
                      if (!result.ok) setError(result.error);
                      else void refresh();
                    }}
                  >
                    Delete
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <GiftCatalogItemDialog
        open={dialogOpen}
        initial={editing}
        saving={saving}
        error={saveError}
        onCancel={() => {
          setDialogOpen(false);
          setEditing(null);
          setSaveError(null);
        }}
        onSave={handleSave}
      />
    </div>
  );
}
