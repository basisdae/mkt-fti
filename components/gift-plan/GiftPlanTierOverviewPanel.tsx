"use client";

import {
  calcGiftCampaign,
  toCampaignCalcInputFromEditor,
} from "@/lib/gift-plan-calculations";
import { formatGiftMoney, formatGiftPercent } from "@/lib/gift-plan-format";
import type { GiftPlanEditorPayload } from "@/types/gift-plan";
import type { TierTabMeta, TierTabSelection } from "@/lib/gift-plan-tier-navigation";

interface GiftPlanTierOverviewPanelProps {
  payload: GiftPlanEditorPayload;
  tabs: TierTabMeta[];
  onSelectTier: (tierId: TierTabSelection) => void;
}

export function GiftPlanTierOverviewPanel({
  payload,
  tabs,
  onSelectTier,
}: GiftPlanTierOverviewPanelProps) {
  const campaign = calcGiftCampaign(toCampaignCalcInputFromEditor(payload));

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {tabs.map((tab) => {
        const calcTier = campaign.tiers.find((row) => row.id === tab.id);
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTier(tab.id)}
            className="rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-colors hover:border-primary/30"
          >
            <p className="text-sm font-semibold text-gray-900">{tab.name}</p>
            <p className="mt-1 text-xs text-gray-500">
              {tab.customerCount.toLocaleString()} ลูกค้า · {tab.itemCount} รายการ
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-gray-400">ต้นทุน/คน</dt>
                <dd>{formatGiftMoney(calcTier?.actual_cost_per_customer)}</dd>
              </div>
              <div>
                <dt className="text-gray-400">มูลค่า/คน</dt>
                <dd>{formatGiftMoney(calcTier?.estimated_value_per_customer)}</dd>
              </div>
              <div>
                <dt className="text-gray-400">ต้นทุนรวม</dt>
                <dd>{formatGiftMoney(calcTier?.total_actual_cost)}</dd>
              </div>
              <div>
                <dt className="text-gray-400">มูลค่ารวม</dt>
                <dd>{formatGiftMoney(calcTier?.total_estimated_value)}</dd>
              </div>
            </dl>
            {tab.warnings.includes("no_gifts") ||
            tab.warnings.includes("missing_customers") ? (
              <p className="mt-2 text-[11px] text-amber-600">ข้อมูลยังไม่ครบ</p>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
