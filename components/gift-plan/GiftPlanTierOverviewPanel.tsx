"use client";

import {
  calcTierBudget,
  toTierBudgetCalcInput,
} from "@/lib/gift-plan-calculations";
import { formatGiftMoney, formatGiftPercent } from "@/lib/gift-plan-format";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import { cn } from "@/lib/utils";
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
  const tiersById = new Map(payload.tiers.map((tier) => [tier.id, tier]));

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {tabs.map((tab) => {
        const tier = tiersById.get(tab.id);
        const budget = tier
          ? calcTierBudget(toTierBudgetCalcInput(tier))
          : null;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTier(tab.id)}
            className="rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-colors hover:border-primary/30"
          >
            <p className="text-sm font-semibold text-gray-900">{tab.name}</p>
            <p className="mt-1 text-xs text-gray-500">
              {tab.itemCount} รายการของขวัญ
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-gray-400">{t.estimatedTotalSales}</dt>
                <dd>
                  {tier?.estimated_total_sales != null
                    ? formatGiftMoney(tier.estimated_total_sales)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-400">{t.giftBudgetPercentSet}</dt>
                <dd>
                  {tier?.gift_budget_percent != null
                    ? formatGiftPercent(tier.gift_budget_percent)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-400">{t.budgetTarget}</dt>
                <dd>{formatGiftMoney(budget?.tier_budget_target)}</dd>
              </div>
              <div>
                <dt className="text-gray-400">{t.budgetCurrentPlanValue}</dt>
                <dd>
                  {budget?.current_plan_value_status === "unset"
                    ? t.budgetCurrentPlanUnset
                    : formatGiftMoney(budget?.current_plan_value)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-400">
                  {budget?.is_over_budget ? t.budgetOverLabel : t.budgetRemaining}
                </dt>
                <dd
                  className={cn(
                    budget?.is_over_budget && "text-rose-800",
                    budget &&
                      budget.budget_remaining != null &&
                      !budget.is_over_budget &&
                      "text-emerald-800",
                  )}
                >
                  {budget?.budget_remaining == null
                    ? "—"
                    : budget.is_over_budget
                      ? `${formatGiftMoney(Math.abs(budget.budget_remaining))} ${t.budgetOverSuffix}`
                      : formatGiftMoney(budget.budget_remaining)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-400">{t.budgetActualPercentOfSales}</dt>
                <dd>{formatGiftPercent(budget?.actual_percent_of_sales)}</dd>
              </div>
            </dl>
            {tab.warnings.includes("no_gifts") ? (
              <p className="mt-2 text-[11px] text-amber-600">ยังไม่เลือกของขวัญ</p>
            ) : null}
            {tab.warnings.includes("over_budget") ? (
              <p className="mt-2 text-[11px] text-rose-800">{t.budgetOverWarning}</p>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
