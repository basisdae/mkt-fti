"use client";

import {
  buildPurchasingInputFromEditor,
  buildPurchasingSummary,
  buildTierComparison,
  calcCampaignPurchasingTotals,
  calcGiftCampaign,
  calcGiftTierExtended,
  calcTierBudget,
  toCampaignCalcInputFromEditor,
  toTierBudgetCalcInput,
  tierHasCustomerCount,
} from "@/lib/gift-plan-calculations";
import {
  formatGiftMoney,
  formatGiftPercent,
  formatGiftQty,
} from "@/lib/gift-plan-format";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import { cn } from "@/lib/utils";
import type { GiftPlanEditorPayload } from "@/types/gift-plan";
import type { TierTabSelection } from "@/lib/gift-plan-tier-navigation";
import { GiftPlanTierComparisonTable } from "@/components/gift-plan/GiftPlanTierComparisonTable";

interface GiftPlanEditorSummaryPanelProps {
  payload: GiftPlanEditorPayload;
  activeTierId: TierTabSelection;
  onSelectTier: (tierId: TierTabSelection) => void;
  className?: string;
}

function SummaryRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <dt className="text-gray-500">{label}</dt>
      <dd className={cn("font-medium text-gray-900 tabular-nums", valueClassName)}>
        {value}
      </dd>
    </div>
  );
}

function pendingOrMoney(
  status: "ready" | "pending_customers",
  value: number,
): string {
  return status === "pending_customers" ? t.pendingCustomerCount : formatGiftMoney(value);
}

export function GiftPlanEditorSummaryPanel({
  payload,
  activeTierId,
  onSelectTier,
  className,
}: GiftPlanEditorSummaryPanelProps) {
  const campaign = calcGiftCampaign(toCampaignCalcInputFromEditor(payload));
  const purchasingRows = buildPurchasingSummary(
    buildPurchasingInputFromEditor(payload).tiers,
    buildPurchasingInputFromEditor(payload).purchaseGroups,
  );
  const purchasingTotals = calcCampaignPurchasingTotals(purchasingRows);
  const comparison = buildTierComparison(payload);

  const activeTier =
    activeTierId !== "overview"
      ? payload.tiers.find((tier) => tier.id === activeTierId)
      : null;

  const tierCalc = activeTier
    ? calcGiftTierExtended({
        id: activeTier.id,
        customer_count: activeTier.customer_count,
        estimated_total_sales: activeTier.estimated_total_sales,
        items: activeTier.items.map((item) => ({
          id: item.id,
          tier_id: item.tier_id,
          category: item.category,
          qty_per_customer: item.qty_per_customer,
          unit_actual_cost: item.unit_actual_cost,
          estimated_gift_value_per_unit: item.estimated_gift_value_per_unit,
          purchase_group_id: item.purchase_group_id,
        })),
      })
    : null;

  const tierBudget = activeTier
    ? calcTierBudget(toTierBudgetCalcInput(activeTier))
    : null;

  const enteredCustomers = payload.tiers.filter((tier) =>
    tierHasCustomerCount(tier.customer_count),
  ).length;

  return (
    <aside className={cn("space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto", className)}>
      {activeTier && tierCalc ? (
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">
            {t.activeTierSummary}
          </h3>
          <p className="text-xs text-gray-500">{activeTier.name}</p>
          <dl className="mt-3 space-y-2">
            {activeTier.sales_threshold_label || activeTier.sales_threshold != null ? (
              <SummaryRow
                label={t.salesThreshold}
                value={
                  activeTier.sales_threshold_label ||
                  formatGiftMoney(activeTier.sales_threshold)
                }
              />
            ) : null}
            <SummaryRow
              label={t.estimatedTotalSales}
              value={
                activeTier.estimated_total_sales != null
                  ? formatGiftMoney(activeTier.estimated_total_sales)
                  : "—"
              }
            />
            <SummaryRow
              label={t.customers}
              value={
                tierHasCustomerCount(activeTier.customer_count)
                  ? activeTier.customer_count.toLocaleString("th-TH")
                  : t.pendingCustomerCount
              }
            />
            <SummaryRow
              label={t.giftItems}
              value={String(activeTier.items.length)}
            />
            <SummaryRow
              label={t.giftUnitsPerCustomer}
              value={formatGiftQty(tierCalc.gift_units_per_customer)}
            />
            <SummaryRow
              label={t.costPerCustomer}
              value={formatGiftMoney(tierCalc.actual_cost_per_customer)}
            />
            <SummaryRow
              label={t.valuePerCustomer}
              value={formatGiftMoney(tierCalc.estimated_value_per_customer)}
            />
            <SummaryRow
              label={t.tierTotalCost}
              value={pendingOrMoney(
                tierCalc.total_actual_cost_status,
                tierCalc.total_actual_cost,
              )}
            />
            <SummaryRow
              label={t.tierTotalEstimatedValue}
              value={pendingOrMoney(
                tierCalc.total_estimated_value_status,
                tierCalc.total_estimated_value,
              )}
            />
            <SummaryRow
              label={t.giftCostPercentOfSales}
              value={formatGiftPercent(tierCalc.gift_cost_percent_of_sales)}
            />
            <SummaryRow
              label={t.valueCostGap}
              value={formatGiftMoney(tierCalc.value_cost_gap_per_customer)}
            />
            {tierBudget?.tier_budget_target != null ? (
              <SummaryRow
                label={t.budgetTarget}
                value={formatGiftMoney(tierBudget.tier_budget_target)}
              />
            ) : null}
          </dl>
        </section>
      ) : null}

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900">{t.planBasket}</h3>
        <dl className="mt-3 space-y-2">
          <SummaryRow label={t.tierCount} value={String(payload.tiers.length)} />
          <SummaryRow
            label={t.enteredCustomerTiers}
            value={`${enteredCustomers} / ${payload.tiers.length}`}
          />
          <SummaryRow
            label={t.totalCustomers}
            value={campaign.total_customers.toLocaleString("th-TH")}
          />
          <SummaryRow
            label={t.giftUnitsTotal}
            value={campaign.total_gift_units.toLocaleString("th-TH")}
          />
          <SummaryRow
            label={t.planActualCost}
            value={formatGiftMoney(campaign.total_campaign_actual_cost)}
          />
          <SummaryRow
            label={t.totalEstimatedValue}
            value={formatGiftMoney(campaign.total_campaign_estimated_value)}
          />
          <SummaryRow
            label={t.totalCustomerSales}
            value={formatGiftMoney(payload.plan.total_customer_sales)}
          />
          <SummaryRow
            label={t.budgetUsed}
            value={formatGiftPercent(campaign.actual_gift_budget_percent)}
          />
          <SummaryRow
            label={t.maxBudget}
            value={formatGiftMoney(campaign.effective_max_budget)}
          />
          <SummaryRow
            label={t.remainingBudget}
            value={formatGiftMoney(campaign.remaining_actual_cost_budget)}
          />
          <SummaryRow
            label={t.purchasingPlanCost}
            value={formatGiftMoney(purchasingTotals.plan_actual_cost)}
          />
          <SummaryRow
            label={t.purchasingBufferCost}
            value={formatGiftMoney(purchasingTotals.buffer_actual_cost)}
          />
          <SummaryRow
            label={t.purchasingFinalCost}
            value={formatGiftMoney(purchasingTotals.final_purchase_cost)}
          />
        </dl>
      </section>

      <GiftPlanTierComparisonTable
        rows={comparison}
        onSelectTier={onSelectTier}
      />
    </aside>
  );
}
