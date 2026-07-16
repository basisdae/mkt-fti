"use client";

import {
  calcGiftCampaign,
  toCampaignCalcInputFromEditor,
} from "@/lib/gift-plan-calculations";
import { formatGiftMoney, formatGiftPercent } from "@/lib/gift-plan-format";
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
            สรุป Tier ที่กำลังเลือก
          </h3>
          <p className="text-xs text-gray-500">{tierSummary.tierName}</p>
          <dl className="mt-3 space-y-2 text-xs">
            <Row label="ลูกค้า" value={tierSummary.customerCount.toLocaleString()} />
            <Row label="Gift Items" value={String(tierSummary.itemCount)} />
            <Row label="Gift Units" value={tierSummary.giftUnits.toLocaleString()} />
            <Row
              label="ต้นทุน/คน"
              value={formatGiftMoney(tierSummary.actualPerCustomer)}
            />
            <Row
              label="มูลค่า/คน"
              value={formatGiftMoney(tierSummary.estimatedPerCustomer)}
            />
            <Row
              label="ต้นทุนรวม Tier"
              value={formatGiftMoney(tierSummary.totalActual)}
            />
          </dl>
        </section>
      ) : null}

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900">
          ชุดของขวัญในแผนนี้
        </h3>
        <dl className="mt-3 space-y-2 text-xs">
          <Row label="จำนวน Tier" value={String(payload.tiers.length)} />
          <Row
            label="ลูกค้ารวม"
            value={campaign.total_customers.toLocaleString()}
          />
          <Row label="Gift Items" value={String(totalItems)} />
          <Row
            label="Gift Units รวม"
            value={campaign.total_gift_units.toLocaleString()}
          />
          <Row
            label="Actual Cost รวม"
            value={formatGiftMoney(campaign.total_campaign_actual_cost)}
          />
          <Row
            label="Estimated Value รวม"
            value={formatGiftMoney(campaign.total_campaign_estimated_value)}
          />
          <Row
            label="Budget Used"
            value={formatGiftPercent(campaign.actual_gift_budget_percent)}
          />
          <Row
            label="Remaining Budget"
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
