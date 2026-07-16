"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { GiftCatalogCard } from "@/components/gift-plan/GiftCatalogCard";
import { GiftPlanTierTabs } from "@/components/gift-plan/GiftPlanTierTabs";
import { GiftPlanActiveTierBanner } from "@/components/gift-plan/GiftPlanActiveTierBanner";
import { GiftPlanTierOverviewPanel } from "@/components/gift-plan/GiftPlanTierOverviewPanel";
import { AddGiftToTierDialog } from "@/components/gift-plan/AddGiftToTierDialog";
import { DuplicateGiftInTierDialog } from "@/components/gift-plan/DuplicateGiftInTierDialog";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/forms/Select";
import { listGiftCatalogAction } from "@/lib/actions/gift-catalog";
import { applyCatalogToPlanItem } from "@/lib/gift-catalog-snapshot";
import {
  catalogUsageInPlan,
  deriveTierTabMeta,
  itemsInTierForCatalog,
  sortedTiers,
  tierCalcSummary,
  type TierTabSelection,
} from "@/lib/gift-plan-tier-navigation";
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
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import type { GiftCatalogRow, GiftCatalogSortKey } from "@/types/gift-catalog";
import type { GiftPlanEditorPayload, GiftPlanItemInput } from "@/types/gift-plan";

interface GiftCatalogPickerModalProps {
  open: boolean;
  payload: GiftPlanEditorPayload;
  initialTierId: string;
  dirty: boolean;
  onClose: () => void;
  onApplyItems: (
    updater: (current: GiftPlanEditorPayload) => GiftPlanEditorPayload,
  ) => void;
}

export function GiftCatalogPickerModal({
  open,
  payload,
  initialTierId,
  dirty,
  onClose,
  onApplyItems,
}: GiftCatalogPickerModalProps) {
  const [catalog, setCatalog] = useState<GiftCatalogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [source, setSource] = useState("all");
  const [status, setStatus] = useState("active");
  const [sort, setSort] = useState<GiftCatalogSortKey>("name");
  const [showArchived, setShowArchived] = useState(false);
  const [activeTierId, setActiveTierId] = useState<TierTabSelection>(initialTierId);

  const [pendingCatalog, setPendingCatalog] = useState<GiftCatalogRow | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [draftQty, setDraftQty] = useState(1);
  const [draftCost, setDraftCost] = useState(0);
  const [draftValue, setDraftValue] = useState(0);
  const [draftNotes, setDraftNotes] = useState("");
  const [addAsSeparate, setAddAsSeparate] = useState(false);

  useEffect(() => {
    if (open) setActiveTierId(initialTierId);
  }, [open, initialTierId]);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      setLoading(true);
      const result = await listGiftCatalogAction({
        includeArchived: showArchived,
      });
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        setCatalog([]);
        return;
      }
      setError(null);
      setCatalog(result.data);
    })();
  }, [open, showArchived]);

  const tierTabs = useMemo(() => deriveTierTabMeta(payload), [payload]);
  const tiers = sortedTiers(payload);
  const activeTier = tiers.find((tier) => tier.id === activeTierId);
  const activeTierName = activeTier?.name ?? "Tier";
  const tierSummary =
    activeTierId !== "overview" ? tierCalcSummary(payload, activeTierId) : null;

  const visibleCatalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = catalog.filter((item) => {
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
        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
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
  }, [catalog, query, category, source, status, sort, showArchived]);

  function beginAdd(item: GiftCatalogRow) {
    if (activeTierId === "overview" || !activeTier) return;
    const existing = itemsInTierForCatalog(payload, activeTierId, item.id);
    setPendingCatalog(item);
    if (existing.length > 0) {
      setDuplicateDialogOpen(true);
      return;
    }
    setDraftQty(1);
    setDraftCost(Number(item.default_actual_cost));
    setDraftValue(Number(item.default_estimated_gift_value));
    setDraftNotes(item.notes);
    setAddAsSeparate(false);
    setAddDialogOpen(true);
  }

  function commitAdd(separateRow: boolean) {
    if (!pendingCatalog || activeTierId === "overview" || !activeTier) return;

    onApplyItems((current) => ({
      ...current,
      tiers: current.tiers.map((tier) => {
        if (tier.id !== activeTierId) return tier;
        const existing = itemsInTierForCatalog(current, activeTierId, pendingCatalog.id);

        if (!separateRow && existing.length > 0) {
          const target = existing[0]!;
          return {
            ...tier,
            items: tier.items.map((item) =>
              item.id === target.id
                ? {
                    ...item,
                    qty_per_customer: draftQty,
                    unit_actual_cost: draftCost,
                    estimated_gift_value_per_unit: draftValue,
                    notes: draftNotes || null,
                  }
                : item,
            ),
          };
        }

        const newItem = applyCatalogToPlanItem(
          pendingCatalog,
          activeTierId,
          tier.items.length,
          {
            qty_per_customer: draftQty,
            unit_actual_cost: draftCost,
            estimated_gift_value_per_unit: draftValue,
            notes: draftNotes || null,
          },
        );

        return { ...tier, items: [...tier.items, newItem] };
      }),
    }));

    setAddDialogOpen(false);
    setDuplicateDialogOpen(false);
    setPendingCatalog(null);
  }

  function editExistingQty(item: GiftCatalogRow) {
    if (activeTierId === "overview") return;
    const existing = itemsInTierForCatalog(payload, activeTierId, item.id);
    const target = existing[0];
    if (!target) return;
    setPendingCatalog(item);
    setDraftQty(Number(target.qty_per_customer));
    setDraftCost(Number(target.unit_actual_cost));
    setDraftValue(Number(target.estimated_gift_value_per_unit));
    setDraftNotes(target.notes ?? "");
    setAddDialogOpen(true);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-gray-900/50 p-2 sm:items-center sm:p-4">
      <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[20px] border border-gray-100 bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {t.pickerTitle}
            </h2>
            <p className="text-xs text-gray-500">{t.pickerSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-5 py-3">
          <GiftPlanTierTabs
            tabs={tierTabs}
            activeId={activeTierId}
            dirty={dirty}
            onSelect={setActiveTierId}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {activeTierId === "overview" ? (
            <GiftPlanTierOverviewPanel
              payload={payload}
              tabs={tierTabs}
              onSelectTier={setActiveTierId}
            />
          ) : (
            <>
              {tierSummary ? (
                <GiftPlanActiveTierBanner
                  tierName={tierSummary.tierName}
                  customerCount={tierSummary.customerCount}
                  actualPerCustomer={tierSummary.actualPerCustomer}
                  estimatedPerCustomer={tierSummary.estimatedPerCustomer}
                  totalActual={tierSummary.totalActual}
                />
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-3">
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
                    { value: "active", label: t.statusActive },
                    { value: "all", label: t.allStatus },
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

              {error ? (
                <p className="mt-4 text-sm text-fti-red">{error}</p>
              ) : null}
              {loading ? (
                <p className="mt-6 text-sm text-gray-500">{t.loadingCatalog}</p>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {visibleCatalog.map((item) => {
                    const inTier = itemsInTierForCatalog(
                      payload,
                      activeTierId,
                      item.id,
                    );
                    const usage = catalogUsageInPlan(payload, item.id).filter(
                      (row) => row.tierId !== activeTierId,
                    );
                    return (
                      <GiftCatalogCard
                        key={item.id}
                        item={item}
                        activeTierName={activeTierName}
                        inActiveTier={inTier.length > 0}
                        activeTierQty={
                          inTier[0] ? Number(inTier[0].qty_per_customer) : null
                        }
                        otherTierUsage={usage}
                        onAdd={() => beginAdd(item)}
                        onEditQty={() => editExistingQty(item)}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AddGiftToTierDialog
        open={addDialogOpen}
        catalog={pendingCatalog}
        tierName={activeTierName}
        qty={draftQty}
        unitActualCost={draftCost}
        estimatedValue={draftValue}
        notes={draftNotes}
        onChange={(patch) => {
          if (patch.qty != null) setDraftQty(patch.qty);
          if (patch.unitActualCost != null) setDraftCost(patch.unitActualCost);
          if (patch.estimatedValue != null) setDraftValue(patch.estimatedValue);
          if (patch.notes != null) setDraftNotes(patch.notes);
        }}
        onCancel={() => {
          setAddDialogOpen(false);
          setPendingCatalog(null);
        }}
        onConfirm={() => commitAdd(addAsSeparate)}
      />

      <DuplicateGiftInTierDialog
        open={duplicateDialogOpen}
        giftName={pendingCatalog?.gift_name ?? ""}
        tierName={activeTierName}
        onCancel={() => {
          setDuplicateDialogOpen(false);
          setPendingCatalog(null);
        }}
        onIncreaseExisting={() => {
          if (!pendingCatalog) return;
          const existing = itemsInTierForCatalog(
            payload,
            activeTierId,
            pendingCatalog.id,
          );
          const target = existing[0];
          if (target) {
            setDraftQty(Number(target.qty_per_customer));
            setDraftCost(Number(target.unit_actual_cost));
            setDraftValue(Number(target.estimated_gift_value_per_unit));
            setDraftNotes(target.notes ?? "");
          }
          setAddAsSeparate(false);
          setDuplicateDialogOpen(false);
          setAddDialogOpen(true);
        }}
        onAddSeparate={() => {
          if (!pendingCatalog) return;
          setDraftQty(1);
          setDraftCost(Number(pendingCatalog.default_actual_cost));
          setDraftValue(Number(pendingCatalog.default_estimated_gift_value));
          setDraftNotes(pendingCatalog.notes);
          setAddAsSeparate(true);
          setDuplicateDialogOpen(false);
          setAddDialogOpen(true);
        }}
      />
    </div>
  );
}
