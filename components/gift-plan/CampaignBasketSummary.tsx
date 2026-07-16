"use client";

import {
  calcGiftCampaign,
  toCampaignCalcInputFromEditor,
} from "@/lib/gift-plan-calculations";
import { formatGiftMoney, formatGiftPercent } from "@/lib/gift-plan-format";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import { tierCalcSummary } from "@/lib/gift-plan-tier-navigation";
import type { TierTabSelection } from "@/lib/gift-plan-tier-navigation";
import type { GiftPlanEditorPayload } from "@/types/gift-plan";

interface CampaignBasketSummaryProps {
  payload: GiftPlanEditorPayload;
  activeTierId: TierTabSelection;
}

export function CampaignBasketSummary({
  payload,
  activeTierId,
}: CampaignBasketSummaryProps) {
  const campaign = calcGiftCampaign(toCampaignCalcInputFromEditor(payload));
  const tierSummary =
    activeTierId !== "overview"
      ? tierCalcSummary(payload, activeTierId)
      : null;

  const totalItems = payload.tiers.reduce(
    (sum, tier) => sum + tier.items.length,
    0,
  );

  return (
    <aside className="space-y-4 lg:sticky lg:top-4">
      {tierSummary ? (
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">
            {t.activeTierSummary}
          </h3>
          <p className="text-xs text-gray-500">{tierSummary.tierName}</p>
          <dl className="mt-3 space-y-2 text-xs">
            <Row label={t.customers} value={tierSummary.customerCount.toLocaleString()} />
            <Row label={t.giftItems} value={String(tierSummary.itemCount)} />
            <Row label={t.giftUnits} value={tierSummary.giftUnits.toLocaleString()} />
            <Row
              label={t.costPerCustomer}
              value={formatGiftMoney(tierSummary.actualPerCustomer)}
            />
            <Row
              label={t.valuePerCustomer}
              value={formatGiftMoney(tierSummary.estimatedPerCustomer)}
            />
            <Row
              label={t.tierTotalCost}
              value={formatGiftMoney(tierSummary.totalActual)}
            />
          </dl>
        </section>
      ) : null}

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900">{t.planBasket}</h3>
        <dl className="mt-3 space-y-2 text-xs">
          <Row label={t.tierCount} value={String(payload.tiers.length)} />
          <Row
            label={t.totalCustomers}
            value={campaign.total_customers.toLocaleString()}
          />
          <Row label={t.giftItems} value={String(totalItems)} />
          <Row
            label={t.giftUnitsTotal}
            value={campaign.total_gift_units.toLocaleString()}
          />
          <Row
            label={t.totalActualCost}
            value={formatGiftMoney(campaign.total_campaign_actual_cost)}
          />
          <Row
            label={t.totalEstimatedValue}
            value={formatGiftMoney(campaign.total_campaign_estimated_value)}
          />
          <Row
            label={t.budgetUsed}
            value={formatGiftPercent(campaign.actual_gift_budget_percent)}
          />
          <Row
            label={t.remainingBudget}
            value={formatGiftMoney(campaign.remaining_actual_cost_budget)}
          />
        </dl>
      </section>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}
