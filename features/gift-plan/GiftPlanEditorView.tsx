"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Eye,
  FileText,
  Link2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Unlink,
} from "lucide-react";
import { GiftPlanCommunicationPreview } from "@/components/gift-plan/GiftPlanCommunicationPreview";
import { GiftPlanSummaryDashboard } from "@/components/gift-plan/GiftPlanSummaryDashboard";
import { GiftCatalogPickerModal } from "@/components/gift-plan/GiftCatalogPickerModal";
import { GiftPlanTierTabs } from "@/components/gift-plan/GiftPlanTierTabs";
import { GiftPlanTierOverviewPanel } from "@/components/gift-plan/GiftPlanTierOverviewPanel";
import { TierGiftCart } from "@/components/gift-plan/TierGiftCart";
import { CampaignBasketSummary } from "@/components/gift-plan/CampaignBasketSummary";
import { GiftPlanEditorWarnings } from "@/components/gift-plan/GiftPlanEditorWarnings";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";
import {
  createPurchaseGroupAction,
  deletePurchaseGroupAction,
  getGiftPlanEditorBundleAction,
  getGiftPlanCommunicationReportAction,
  getGiftPlanExportBundleAction,
  saveGiftPlanAction,
  ungroupGiftItemsAction,
} from "@/lib/actions/gift-plans";
import {
  downloadCommunicationExport,
  exportCommunicationWorkbook,
} from "@/lib/gift-plan-communication-export";
import {
  checkPurchaseGroupCompatibility,
} from "@/lib/gift-plan-purchase-groups";
import {
  clearGiftPlanDraft,
  isDraftNewerThanServer,
  readGiftPlanDraft,
  writeGiftPlanDraft,
} from "@/lib/gift-plan-draft";
import { downloadGiftPlanExport, exportGiftPlanWorkbook } from "@/lib/gift-plan-export";
import {
  GIFT_PLAN_STATUSES,
} from "@/types/gift-plan";
import type {
  GiftPlanEditorBundle,
  GiftPlanEditorPayload,
  GiftPlanItemInput,
  GiftPlanCommunicationReport,
  GiftPlanTierInput,
} from "@/types/gift-plan";
import {
  GIFT_PLAN_STATUS_LABELS,
} from "@/lib/gift-plan-format";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import { generateId } from "@/lib/generate-id";
import { tierNamesConflict } from "@/lib/gift-plan-calculations";
import { deriveGiftPlanEditorWarnings } from "@/lib/gift-plan-editor-warnings";
import {
  deriveTierTabMeta,
  sortedTiers,
  type TierTabSelection,
} from "@/lib/gift-plan-tier-navigation";
import { cn } from "@/lib/utils";

function bundleToPayload(bundle: GiftPlanEditorBundle): GiftPlanEditorPayload {
  const itemsByTier = new Map<string, GiftPlanItemInput[]>();
  for (const item of bundle.items) {
    const list = itemsByTier.get(item.tier_id) ?? [];
    list.push({
      id: item.id,
      tier_id: item.tier_id,
      sort_order: item.sort_order,
      gift_name: item.gift_name,
      category: item.category,
      source: item.source,
      qty_per_customer: Number(item.qty_per_customer),
      unit_actual_cost: Number(item.unit_actual_cost),
      estimated_gift_value_per_unit: Number(item.estimated_gift_value_per_unit),
      supplier: item.supplier,
      notes: item.notes,
      purchase_group_id: item.purchase_group_id,
      gift_catalog_id: item.gift_catalog_id ?? null,
      specification: item.specification ?? "",
    });
    itemsByTier.set(item.tier_id, list);
  }

  return {
    plan: {
      id: bundle.plan.id,
      name: bundle.plan.name,
      campaign_year: bundle.plan.campaign_year,
      campaign_headline: bundle.plan.campaign_headline ?? "",
      description: bundle.plan.description,
      owner: bundle.plan.owner,
      status: bundle.plan.status,
      total_customer_sales: Number(bundle.plan.total_customer_sales),
      max_actual_cost_budget:
        bundle.plan.max_actual_cost_budget != null
          ? Number(bundle.plan.max_actual_cost_budget)
          : null,
      budget_limit_percent:
        bundle.plan.budget_limit_percent != null
          ? Number(bundle.plan.budget_limit_percent)
          : null,
      campaign_conditions: bundle.plan.campaign_conditions,
      approval_notes: bundle.plan.approval_notes,
      is_archived: bundle.plan.is_archived,
    },
    tiers: bundle.tiers
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((tier) => ({
        id: tier.id,
        plan_id: tier.plan_id,
        name: tier.name,
        sort_order: tier.sort_order,
        sales_threshold:
          tier.sales_threshold != null ? Number(tier.sales_threshold) : null,
        sales_threshold_label: tier.sales_threshold_label,
        customer_count: tier.customer_count,
        notes: tier.notes,
        gift_policy: tier.gift_policy,
        items: (itemsByTier.get(tier.id) ?? []).sort(
          (a, b) => a.sort_order - b.sort_order,
        ),
      })),
    purchase_groups: bundle.purchase_groups.map((group) => ({
      id: group.id,
      plan_id: group.plan_id,
      label: group.label,
      notes: group.notes,
    })),
    expected_updated_at: bundle.plan.updated_at,
  };
}

interface GiftPlanEditorViewProps {
  initialBundle: GiftPlanEditorBundle;
  canExport: boolean;
}

export function GiftPlanEditorView({
  initialBundle,
  canExport,
}: GiftPlanEditorViewProps) {
  const router = useRouter();
  const [payload, setPayload] = useState<GiftPlanEditorPayload>(() =>
    bundleToPayload(initialBundle),
  );
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [serverUpdatedAt, setServerUpdatedAt] = useState(initialBundle.plan.updated_at);
  const [communicationOpen, setCommunicationOpen] = useState(false);
  const [communicationReport, setCommunicationReport] =
    useState<GiftPlanCommunicationReport | null>(null);
  const [communicationError, setCommunicationError] = useState<string | null>(null);
  const [activeEditorTier, setActiveEditorTier] =
    useState<TierTabSelection>("overview");
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogTierId, setCatalogTierId] = useState<string | null>(null);

  const tierTabs = useMemo(() => deriveTierTabMeta(payload), [payload]);
  const editorWarnings = useMemo(
    () => deriveGiftPlanEditorWarnings(payload, dirty),
    [payload, dirty],
  );

  useEffect(() => {
    const draft = readGiftPlanDraft(payload.plan.id);
    if (draft && isDraftNewerThanServer(draft, serverUpdatedAt)) {
      const recover = window.confirm(t.recoverDraft);
      if (recover) {
        setPayload(draft.payload);
        setDirty(true);
      } else {
        clearGiftPlanDraft(payload.plan.id);
      }
    }
  }, [payload.plan.id, serverUpdatedAt]);

  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(() => {
      writeGiftPlanDraft(payload.plan.id, payload, serverUpdatedAt);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [payload, dirty, serverUpdatedAt]);

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const updatePayload = useCallback(
    (updater: (current: GiftPlanEditorPayload) => GiftPlanEditorPayload) => {
      setPayload((current) => updater(current));
      setDirty(true);
    },
    [],
  );

  const allItems = useMemo(
    () => payload.tiers.flatMap((tier) => tier.items),
    [payload.tiers],
  );

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const result = await saveGiftPlanAction({
      ...payload,
      expected_updated_at: serverUpdatedAt,
    });
    setSaving(false);
    if (!result.ok) {
      setSaveError(result.error);
      return;
    }
    setDirty(false);
    setServerUpdatedAt(result.data.updated_at);
    clearGiftPlanDraft(payload.plan.id);
    router.refresh();
  }

  async function handleExport() {
    if (dirty) {
      window.alert(t.saveBeforeExport);
      return;
    }
    const result = await getGiftPlanExportBundleAction(payload.plan.id);
    if (!result.ok) {
      setSaveError(result.error);
      return;
    }
    const exported = await exportGiftPlanWorkbook(result.data);
    downloadGiftPlanExport(exported.buffer, exported.fileName);
  }

  function ensureSavedForCommunication(): boolean {
    if (!dirty) return true;
    window.alert(t.saveBeforeCommunication);
    return false;
  }

  async function loadCommunicationReport(): Promise<GiftPlanCommunicationReport | null> {
    if (!ensureSavedForCommunication()) return null;
    setCommunicationError(null);
    const result = await getGiftPlanCommunicationReportAction(payload.plan.id);
    if (!result.ok) {
      setCommunicationError(result.error);
      return null;
    }
    return result.data;
  }

  async function handlePreviewCommunication() {
    const report = await loadCommunicationReport();
    if (!report) return;
    setCommunicationReport(report);
    setCommunicationOpen(true);
  }

  async function handleExportCommunication() {
    const report = await loadCommunicationReport();
    if (!report) return;
    const exported = await exportCommunicationWorkbook(report);
    downloadCommunicationExport(exported.buffer, exported.fileName);
  }

  function addTier() {
    updatePayload((current) => {
      const sort = current.tiers.length;
      const tier: GiftPlanTierInput = {
        id: generateId(),
        plan_id: current.plan.id,
        name: `Tier ${sort + 1}`,
        sort_order: sort,
        sales_threshold: null,
        sales_threshold_label: "",
        customer_count: 0,
        notes: "",
        gift_policy: "",
        items: [],
      };
      return { ...current, tiers: [...current.tiers, tier] };
    });
  }

  function moveTier(tierId: string, direction: -1 | 1) {
    updatePayload((current) => {
      const tiers = [...current.tiers].sort((a, b) => a.sort_order - b.sort_order);
      const index = tiers.findIndex((tier) => tier.id === tierId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= tiers.length) return current;
      const next = [...tiers];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return {
        ...current,
        tiers: next.map((tier, sort) => ({ ...tier, sort_order: sort })),
      };
    });
  }

  function updateTierItem(
    tierId: string,
    itemId: string,
    patch: Partial<GiftPlanItemInput>,
  ) {
    updatePayload((current) => ({
      ...current,
      tiers: current.tiers.map((tier) =>
        tier.id !== tierId
          ? tier
          : {
              ...tier,
              items: tier.items.map((item) =>
                item.id === itemId ? { ...item, ...patch } : item,
              ),
            },
      ),
    }));
  }

  function removeTierItem(tierId: string, itemId: string) {
    updatePayload((current) => ({
      ...current,
      tiers: current.tiers.map((tier) =>
        tier.id !== tierId
          ? tier
          : {
              ...tier,
              items: tier.items.filter((item) => item.id !== itemId),
            },
      ),
    }));
    setSelectedItemIds((current) => current.filter((id) => id !== itemId));
  }

  function moveTierItem(tierId: string, itemId: string, direction: -1 | 1) {
    updatePayload((current) => {
      const tier = current.tiers.find((row) => row.id === tierId);
      if (!tier) return current;
      const items = [...tier.items].sort((a, b) => a.sort_order - b.sort_order);
      const index = items.findIndex((item) => item.id === itemId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= items.length) return current;
      const next = [...items];
      [next[index], next[target]] = [next[target]!, next[index]!];
      const reordered = next.map((item, sort) => ({ ...item, sort_order: sort }));
      return {
        ...current,
        tiers: current.tiers.map((row) =>
          row.id === tierId ? { ...row, items: reordered } : row,
        ),
      };
    });
  }

  function openCatalogForTier(tierId: string) {
    setCatalogTierId(tierId);
    setActiveEditorTier(tierId);
    setCatalogOpen(true);
  }

  async function handleRefresh() {
    if (dirty) {
      const discard = window.confirm(t.discardReload);
      if (!discard) return;
    }
    setSaveError(null);
    const result = await getGiftPlanEditorBundleAction(payload.plan.id);
    if (!result.ok) {
      setSaveError(result.error);
      return;
    }
    setPayload(bundleToPayload(result.data));
    setServerUpdatedAt(result.data.plan.updated_at);
    setDirty(false);
    clearGiftPlanDraft(payload.plan.id);
    setSelectedItemIds([]);
  }

  const catalogInitialTierId =
    catalogTierId ??
    (activeEditorTier !== "overview"
      ? activeEditorTier
      : (sortedTiers(payload)[0]?.id ?? ""));

  async function handleGroupSelected(force = false) {
    setGroupError(null);
    const selected = allItems.filter((item) => selectedItemIds.includes(item.id));
    const issues = checkPurchaseGroupCompatibility(selected);
    if (issues.length > 0 && !force) {
      const confirmGroup = window.confirm(
        `${issues.map((issue) => issue.message).join("\n")}\n\n${t.groupAnyway}`,
      );
      if (!confirmGroup) return;
    }

    const result = await createPurchaseGroupAction({
      plan_id: payload.plan.id,
      item_ids: selectedItemIds,
      label: selected[0]?.gift_name,
      force: force || issues.length > 0,
    });

    if (!result.ok) {
      setGroupError(result.error);
      return;
    }

    updatePayload((current) => ({
      ...current,
      purchase_groups: [
        ...current.purchase_groups,
        {
          id: result.data.group_id,
          plan_id: current.plan.id,
          label: selected[0]?.gift_name ?? "",
          notes: "",
        },
      ],
      tiers: current.tiers.map((tier) => ({
        ...tier,
        items: tier.items.map((item) =>
          selectedItemIds.includes(item.id)
            ? { ...item, purchase_group_id: result.data.group_id }
            : item,
        ),
      })),
    }));
    setSelectedItemIds([]);
    setDirty(true);
  }

  async function handleUngroupSelected() {
    const result = await ungroupGiftItemsAction(selectedItemIds);
    if (!result.ok) {
      setGroupError(result.error);
      return;
    }
    updatePayload((current) => ({
      ...current,
      tiers: current.tiers.map((tier) => ({
        ...tier,
        items: tier.items.map((item) =>
          selectedItemIds.includes(item.id)
            ? { ...item, purchase_group_id: null }
            : item,
        ),
      })),
    }));
    setSelectedItemIds([]);
    setDirty(true);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {t.editorEyebrow}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">
            {payload.plan.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {payload.plan.campaign_year} · {GIFT_PLAN_STATUS_LABELS[payload.plan.status]}
            {dirty ? ` · ${t.unsavedChanges}` : ` · ${t.saved}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={() => router.push("/gift-plans/catalog")}
          >
            {t.giftCatalog}
          </Button>
          <Button variant="secondary" onClick={() => void handleRefresh()}>
            <RefreshCw className="h-4 w-4" />
            {t.refresh}
          </Button>
          <Button variant="secondary" onClick={() => void handlePreviewCommunication()}>
            <Eye className="h-4 w-4" />
            {t.previewCommunication}
          </Button>
          <Button variant="secondary" onClick={() => void handleExportCommunication()}>
            <FileText className="h-4 w-4" />
            {t.exportCommunication}
          </Button>
          {canExport ? (
            <Button variant="secondary" onClick={() => void handleExport()}>
              <Download className="h-4 w-4" />
              {t.exportFullWorkbook}
            </Button>
          ) : null}
          <Button onClick={() => void handleSave()} disabled={saving || !dirty}>
            <Save className="h-4 w-4" />
            {saving ? t.saving : t.savePlan}
          </Button>
        </div>
      </header>

      {communicationError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-fti-red">
          {communicationError}
        </div>
      ) : null}

      {saveError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-fti-red">
          {saveError}
        </div>
      ) : null}
      {groupError ? (
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {groupError}
        </div>
      ) : null}

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">{t.campaign}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Input
            label={t.planNameLabel.replace(" *", "")}
            value={payload.plan.name}
            onChange={(e) =>
              updatePayload((current) => ({
                ...current,
                plan: { ...current.plan, name: e.target.value },
              }))
            }
          />
          <Input
            label={t.campaignYear}
            type="number"
            value={String(payload.plan.campaign_year)}
            onChange={(e) =>
              updatePayload((current) => ({
                ...current,
                plan: {
                  ...current.plan,
                  campaign_year: Number(e.target.value) || current.plan.campaign_year,
                },
              }))
            }
          />
          <Input
            label={t.campaignHeadline}
            value={payload.plan.campaign_headline}
            onChange={(e) =>
              updatePayload((current) => ({
                ...current,
                plan: { ...current.plan, campaign_headline: e.target.value },
              }))
            }
            placeholder={t.campaignHeadlinePlaceholder}
          />
          <Input
            label={t.owner}
            value={payload.plan.owner}
            onChange={(e) =>
              updatePayload((current) => ({
                ...current,
                plan: { ...current.plan, owner: e.target.value },
              }))
            }
          />
          <Select
            label={t.status}
            value={payload.plan.status}
            onChange={(e) =>
              updatePayload((current) => ({
                ...current,
                plan: {
                  ...current.plan,
                  status: e.target.value as GiftPlanEditorPayload["plan"]["status"],
                },
              }))
            }
            options={GIFT_PLAN_STATUSES.map((status) => ({
              value: status,
              label: GIFT_PLAN_STATUS_LABELS[status],
            }))}
          />
          <Input
            label={t.totalCustomerSales}
            type="number"
            value={String(payload.plan.total_customer_sales)}
            onChange={(e) =>
              updatePayload((current) => ({
                ...current,
                plan: {
                  ...current.plan,
                  total_customer_sales: Number(e.target.value) || 0,
                },
              }))
            }
          />
          <Input
            label={t.maxActualCostBudget}
            type="number"
            value={
              payload.plan.max_actual_cost_budget != null
                ? String(payload.plan.max_actual_cost_budget)
                : ""
            }
            onChange={(e) =>
              updatePayload((current) => ({
                ...current,
                plan: {
                  ...current.plan,
                  max_actual_cost_budget: e.target.value
                    ? Number(e.target.value)
                    : null,
                },
              }))
            }
          />
          <Input
            label={t.budgetLimitPercent}
            type="number"
            value={
              payload.plan.budget_limit_percent != null
                ? String(payload.plan.budget_limit_percent)
                : ""
            }
            onChange={(e) =>
              updatePayload((current) => ({
                ...current,
                plan: {
                  ...current.plan,
                  budget_limit_percent: e.target.value
                    ? Number(e.target.value)
                    : null,
                },
              }))
            }
          />
          <div className="md:col-span-2">
            <Textarea
              label={t.description}
              rows={2}
              value={payload.plan.description}
              onChange={(e) =>
                updatePayload((current) => ({
                  ...current,
                  plan: { ...current.plan, description: e.target.value },
                }))
              }
            />
          </div>
          <Textarea
            label={t.campaignConditions}
            rows={3}
            value={payload.plan.campaign_conditions}
            onChange={(e) =>
              updatePayload((current) => ({
                ...current,
                plan: { ...current.plan, campaign_conditions: e.target.value },
              }))
            }
          />
          <Textarea
            label={t.approvalNotes}
            rows={3}
            value={payload.plan.approval_notes}
            onChange={(e) =>
              updatePayload((current) => ({
                ...current,
                plan: { ...current.plan, approval_notes: e.target.value },
              }))
            }
          />
        </div>
      </section>

      <section className="space-y-4">
        <GiftPlanEditorWarnings warnings={editorWarnings} />

        <GiftPlanTierTabs
          tabs={tierTabs}
          activeId={activeEditorTier}
          dirty={dirty}
          onSelect={setActiveEditorTier}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-900">{t.tiersAndGifts}</h2>
          <div className="flex flex-wrap gap-2">
            {activeEditorTier !== "overview" && selectedItemIds.length >= 2 ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void handleGroupSelected()}
              >
                <Link2 className="h-4 w-4" />
                {t.groupForPurchasing}
              </Button>
            ) : null}
            {activeEditorTier !== "overview" && selectedItemIds.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleUngroupSelected()}
              >
                <Unlink className="h-4 w-4" />
                {t.ungroup}
              </Button>
            ) : null}
            <Button variant="secondary" size="sm" onClick={addTier}>
              <Plus className="h-4 w-4" />
              {t.addTier}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="min-w-0 space-y-4">
            {activeEditorTier === "overview" ? (
              <GiftPlanTierOverviewPanel
                payload={payload}
                tabs={tierTabs}
                onSelectTier={setActiveEditorTier}
              />
            ) : (
              sortedTiers(payload)
                .filter((tier) => tier.id === activeEditorTier)
                .map((tier) => {
            const tierIndex = sortedTiers(payload).findIndex(
              (row) => row.id === tier.id,
            );
            const nameConflict = tierNamesConflict(payload.tiers, tier.id, tier.name);
            return (
              <article
                key={tier.id}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="grid flex-1 gap-3 md:grid-cols-2">
                    <Input
                      label={t.tierName}
                      value={tier.name}
                      onChange={(e) =>
                        updatePayload((current) => ({
                          ...current,
                          tiers: current.tiers.map((row) =>
                            row.id === tier.id
                              ? { ...row, name: e.target.value }
                              : row,
                          ),
                        }))
                      }
                      className={cn(nameConflict && "border-fti-red")}
                    />
                    <Input
                      label={t.customerCount}
                      type="number"
                      value={String(tier.customer_count)}
                      onChange={(e) =>
                        updatePayload((current) => ({
                          ...current,
                          tiers: current.tiers.map((row) =>
                            row.id === tier.id
                              ? {
                                  ...row,
                                  customer_count: Number(e.target.value) || 0,
                                }
                              : row,
                          ),
                        }))
                      }
                    />
                    <Input
                      label={t.salesThreshold}
                      type="number"
                      value={tier.sales_threshold != null ? String(tier.sales_threshold) : ""}
                      onChange={(e) =>
                        updatePayload((current) => ({
                          ...current,
                          tiers: current.tiers.map((row) =>
                            row.id === tier.id
                              ? {
                                  ...row,
                                  sales_threshold: e.target.value
                                    ? Number(e.target.value)
                                    : null,
                                }
                              : row,
                          ),
                        }))
                      }
                    />
                    <Input
                      label={t.thresholdLabel}
                      value={tier.sales_threshold_label}
                      onChange={(e) =>
                        updatePayload((current) => ({
                          ...current,
                          tiers: current.tiers.map((row) =>
                            row.id === tier.id
                              ? { ...row, sales_threshold_label: e.target.value }
                              : row,
                          ),
                        }))
                      }
                    />
                    <Textarea
                      label={t.giftPolicyLabel}
                      rows={2}
                      value={tier.gift_policy}
                      onChange={(e) =>
                        updatePayload((current) => ({
                          ...current,
                          tiers: current.tiers.map((row) =>
                            row.id === tier.id
                              ? { ...row, gift_policy: e.target.value }
                              : row,
                          ),
                        }))
                      }
                    />
                    <Textarea
                      label={t.notes}
                      rows={2}
                      value={tier.notes}
                      onChange={(e) =>
                        updatePayload((current) => ({
                          ...current,
                          tiers: current.tiers.map((row) =>
                            row.id === tier.id
                              ? { ...row, notes: e.target.value }
                              : row,
                          ),
                        }))
                      }
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={tierIndex === 0}
                      onClick={() => moveTier(tier.id, -1)}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={tierIndex === payload.tiers.length - 1}
                      onClick={() => moveTier(tier.id, 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        updatePayload((current) => ({
                          ...current,
                          tiers: current.tiers.filter((row) => row.id !== tier.id),
                        }))
                      }
                    >
                      <Trash2 className="h-4 w-4 text-fti-red" />
                    </Button>
                  </div>
                </div>

                <TierGiftCart
                  tier={tier}
                  onUpdateItem={(itemId, patch) =>
                    updateTierItem(tier.id, itemId, patch)
                  }
                  onRemoveItem={(itemId) => removeTierItem(tier.id, itemId)}
                  onMoveItem={(itemId, direction) =>
                    moveTierItem(tier.id, itemId, direction)
                  }
                  onOpenCatalog={() => openCatalogForTier(tier.id)}
                />
              </article>
            );
          })
            )}

            <GiftPlanSummaryDashboard payload={payload} />

      {payload.purchase_groups.length > 0 ? (
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">{t.purchasingGroup}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {payload.purchase_groups.map((group) => (
              <li
                key={group.id}
                className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2"
              >
                <span>
                  {group.label || t.untitledGroup} ·{" "}
                  {t.itemsLabel(
                    allItems.filter((item) => item.purchase_group_id === group.id)
                      .length,
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const result = await deletePurchaseGroupAction(group.id);
                    if (!result.ok) {
                      setGroupError(result.error);
                      return;
                    }
                    updatePayload((current) => ({
                      ...current,
                      purchase_groups: current.purchase_groups.filter(
                        (row) => row.id !== group.id,
                      ),
                      tiers: current.tiers.map((tier) => ({
                        ...tier,
                        items: tier.items.map((item) =>
                          item.purchase_group_id === group.id
                            ? { ...item, purchase_group_id: null }
                            : item,
                        ),
                      })),
                    }));
                  }}
                >
                  {t.deleteGroup}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
          </div>

          <CampaignBasketSummary
            payload={payload}
            activeTierId={activeEditorTier}
          />
        </div>
      </section>

      <GiftCatalogPickerModal
        open={catalogOpen}
        payload={payload}
        initialTierId={catalogInitialTierId}
        dirty={dirty}
        onClose={() => setCatalogOpen(false)}
        onApplyItems={updatePayload}
      />

      <GiftPlanCommunicationPreview
        open={communicationOpen}
        report={communicationReport}
        onClose={() => setCommunicationOpen(false)}
      />
    </div>
  );
}
