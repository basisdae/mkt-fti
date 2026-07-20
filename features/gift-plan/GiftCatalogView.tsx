"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { GiftCatalogSortableGrid } from "@/components/gift-plan/GiftCatalogSortableGrid";
import {
  GiftCatalogItemDialog,
  type GiftCatalogSavePayload,
} from "@/components/gift-plan/GiftCatalogItemDialog";
import { GiftCatalogSummaryStrip, emptyOperationalCounts } from "@/components/gift-plan/GiftCatalogSummaryStrip";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/forms/Select";
import { useAuth } from "@/hooks/AuthStore";
import { canEditGiftPlans } from "@/lib/auth/permissions";
import {
  canEditWithSupabaseAuth,
  reportActionError,
} from "@/lib/auth/supabase-auth-guard-ui";
import {
  deleteGiftCatalogAction,
  duplicateGiftCatalogAction,
  isGiftCatalogInUseAction,
  listGiftCatalogAction,
  saveGiftCatalogAction,
  reorderGiftCatalogAction,
  setGiftCatalogStatusAction,
  updateGiftCatalogImageAction,
} from "@/lib/actions/gift-catalog";
import {
  applyVisibleCatalogReorder,
  catalogHasActiveFilters,
} from "@/lib/gift-catalog-order";
import {
  removeGiftCatalogCover,
  uploadGiftCatalogCover,
} from "@/lib/gift-catalog-storage";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
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
import { GIFT_CATALOG_OPERATIONAL_LABELS } from "@/lib/gift-catalog-format";
import { GIFT_CATALOG_OPERATIONAL_STATUSES } from "@/types/gift-catalog";
import type { GiftCatalogOperationalFilter, GiftCatalogRow, GiftCatalogSortKey } from "@/types/gift-catalog";

export function GiftCatalogView() {
  const { user, session } = useAuth();
  const canEdit = canEditWithSupabaseAuth(canEditGiftPlans(user), session);
  const [items, setItems] = useState<GiftCatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [source, setSource] = useState("all");
  const [status, setStatus] = useState("all");
  const [operational, setOperational] = useState<GiftCatalogOperationalFilter>("all");
  const [sort, setSort] = useState<GiftCatalogSortKey>("manual");
  const [reordering, setReordering] = useState(false);
  const savingRef = useRef(false);
  const [showArchived, setShowArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GiftCatalogRow | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  async function refresh() {
    setLoading(true);
    const result = await listGiftCatalogAction({ includeArchived: true });
    setLoading(false);
    if (!result.ok) {
      reportActionError(result.error, setError);
      setItems([]);
      return;
    }
    setError(null);
    setItems(result.data);
  }

  useEffect(() => {
    void refresh();
  }, []);

  const operationalCounts = useMemo(() => {
    const counts = emptyOperationalCounts();
    for (const item of items) {
      if (item.status === "archived" && !showArchived) continue;
      const key = item.operational_status ?? "interested";
      if (key in counts) counts[key as keyof typeof counts] += 1;
    }
    return counts;
  }, [items, showArchived]);

  const hasActiveFilters = useMemo(
    () =>
      catalogHasActiveFilters({
        query,
        category,
        source,
        status,
        operational,
      }),
    [query, category, source, status, operational],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = items.filter((item) => {
      if (!showArchived && item.status === "archived") return false;
      if (status !== "all" && item.status !== status) return false;
      if (operational !== "all" && item.operational_status !== operational) {
        return false;
      }
      if (category !== "all" && item.category !== category) return false;
      if (source !== "all" && item.source !== source) return false;
      if (!q) return true;
      return (
        item.gift_name.toLowerCase().includes(q) ||
        (item.internal_code ?? "").toLowerCase().includes(q)
      );
    });
    rows = [...rows].sort((a, b) => {
      if (sort === "manual") {
        return (
          a.sort_order - b.sort_order ||
          a.gift_name.localeCompare(b.gift_name, "th") ||
          a.id.localeCompare(b.id)
        );
      }
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
      return a.gift_name.localeCompare(b.gift_name, "th");
    });
    return rows;
  }, [items, query, category, source, status, operational, sort, showArchived]);

  const dragEnabled =
    canEdit && sort === "manual" && !hasActiveFilters && !loading;

  async function handleReorderVisible(reorderedVisible: GiftCatalogRow[]) {
    const previousItems = items;
    const merged = applyVisibleCatalogReorder(items, reorderedVisible);
    setItems(merged);
    setReordering(true);
    const result = await reorderGiftCatalogAction(merged.map((item) => item.id));
    setReordering(false);
    if (!result.ok) {
      setItems(previousItems);
      reportActionError(result.error ?? t.catalogReorderFailed, setError);
      return;
    }
    setError(null);
  }

  function getCatalogActions(item: GiftCatalogRow) {
    if (!canEdit) return undefined;
    return {
      onEdit: () => {
        setEditing(item);
        setDialogOpen(true);
      },
      onDuplicate: () => {
        void (async () => {
          const result = await duplicateGiftCatalogAction(item.id);
          if (!result.ok) reportActionError(result.error, setError);
          else void refresh();
        })();
      },
      onArchive:
        item.status !== "archived"
          ? () => {
              void (async () => {
                const result = await setGiftCatalogStatusAction(item.id, "archived");
                if (!result.ok) reportActionError(result.error, setError);
                else void refresh();
              })();
            }
          : undefined,
      onRestore:
        item.status === "archived"
          ? () => {
              void (async () => {
                const result = await setGiftCatalogStatusAction(item.id, "active");
                if (!result.ok) reportActionError(result.error, setError);
                else void refresh();
              })();
            }
          : undefined,
      onDelete: () => {
        void (async () => {
          const usage = await isGiftCatalogInUseAction(item.id);
          if (!usage.ok) {
            setError(usage.error);
            return;
          }
          if (usage.data) {
            setError(t.catalogInUseArchive);
            return;
          }
          if (!window.confirm(t.deleteCatalogConfirm(item.gift_name))) return;
          const result = await deleteGiftCatalogAction(item.id);
          if (!result.ok) reportActionError(result.error, setError);
          else {
            if (result.data.imagePath) {
              await removeGiftCatalogCover(result.data.imagePath).catch(() => {});
            }
            void refresh();
          }
        })();
      },
    };
  }

  async function handleSave({ values, image }: GiftCatalogSavePayload) {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    const prevPath = editing?.image_path ?? null;

    try {
      const result = await saveGiftCatalogAction({
        id: editing?.id,
        values,
      });
      if (!result.ok) {
        setSaveError(result.error);
        return;
      }

      const catalogId = editing?.id ?? result.data.id;

      if (image.file) {
        setUploadingImage(true);
        try {
          const uploaded = await uploadGiftCatalogCover(catalogId, image.file);
          const imgResult = await updateGiftCatalogImageAction({
            id: catalogId,
            imagePath: uploaded.imagePath,
            imageUrl: uploaded.imageUrl,
          });
          if (!imgResult.ok) throw new Error(imgResult.error);
          if (prevPath && prevPath !== uploaded.imagePath) {
            await removeGiftCatalogCover(prevPath).catch(() => {});
          }
        } catch (err) {
          console.error("[gift-catalog] image upload after save:", err);
          setSaveError(
            editing?.id
              ? t.catalogImageUploadFailedEdit
              : t.catalogImageUploadFailedNew(catalogId),
          );
          void refresh();
          return;
        } finally {
          setUploadingImage(false);
        }
      } else if (image.removeRequested && prevPath) {
        const imgResult = await updateGiftCatalogImageAction({
          id: catalogId,
          imagePath: null,
          imageUrl: null,
        });
        if (imgResult.ok) {
          await removeGiftCatalogCover(prevPath).catch(() => {});
        }
      }

      setDialogOpen(false);
      setEditing(null);
      void refresh();
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {t.catalogEyebrow}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">
            {t.catalogTitle}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{t.catalogSubtitle}</p>
          <Link href="/gift-plans" className="mt-2 inline-block text-sm text-primary">
            {t.backToGiftPlans}
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
            {t.addGift}
          </Button>
        ) : null}
      </header>

      <GiftCatalogSummaryStrip
        counts={operationalCounts}
        activeFilter={operational}
        onFilter={(filter) => setOperational(filter)}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchNameOrCode}
            className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-40"
          options={[
            { value: "all", label: t.allCategories },
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
            { value: "all", label: t.allSources },
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
            { value: "all", label: t.allStatus },
            ...GIFT_CATALOG_STATUSES.map((value) => ({
              value,
              label: GIFT_CATALOG_STATUS_LABELS[value],
            })),
          ]}
        />
        <Select
          value={operational}
          onChange={(e) =>
            setOperational(e.target.value as GiftCatalogOperationalFilter)
          }
          className="w-44"
          options={[
            { value: "all", label: t.allOperationalStatus },
            ...GIFT_CATALOG_OPERATIONAL_STATUSES.map((value) => ({
              value,
              label: GIFT_CATALOG_OPERATIONAL_LABELS[value],
            })),
          ]}
        />
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value as GiftCatalogSortKey)}
          className="w-40"
          options={[
            { value: "manual", label: t.sortManual },
            { value: "name", label: t.sortByName },
            { value: "updated", label: t.sortLatestUpdated },
            { value: "actual_cost", label: t.sortActualCost },
            { value: "estimated_value", label: t.sortEstValue },
          ]}
        />
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          {t.showArchived}
        </label>
      </div>

      {sort === "manual" && hasActiveFilters ? (
        <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {t.catalogDragDisabledFilter}
        </p>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-fti-red">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-gray-500">{t.loadingCatalog}</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-gray-500">{t.noCatalogMatches}</p>
      ) : (
        <GiftCatalogSortableGrid
          items={visible}
          dragEnabled={dragEnabled}
          showManualHint={sort !== "manual"}
          savingOrder={reordering}
          onReorder={handleReorderVisible}
          getCatalogActions={getCatalogActions}
        />
      )}

      <GiftCatalogItemDialog
        open={dialogOpen}
        initial={editing}
        saving={saving}
        uploadingImage={uploadingImage}
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
