"use client";

import {
  calcGiftCampaign,
  toCampaignCalcInputFromEditor,
} from "@/lib/gift-plan-calculations";
import {
  formatGiftMoney,
  formatGiftPercent,
} from "@/lib/gift-plan-format";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import type { GiftPlanEditorPayload } from "@/types/gift-plan";

interface GiftPlanSummaryDashboardProps {
  payload: GiftPlanEditorPayload;
}

export function GiftPlanSummaryDashboard({
  payload,
}: GiftPlanSummaryDashboardProps) {
  const campaign = calcGiftCampaign(toCampaignCalcInputFromEditor(payload));

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">{t.campaignSummary}</h3>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label={t.totalCustomers} value={campaign.total_customers.toLocaleString()} />
        <Metric label={t.giftUnitsTotal} value={campaign.total_gift_units.toLocaleString()} />
        <Metric
          label={t.totalActualCost}
          value={formatGiftMoney(campaign.total_campaign_actual_cost)}
        />
        <Metric
          label={t.totalEstimatedValue}
          value={formatGiftMoney(campaign.total_campaign_estimated_value)}
        />
        <Metric
          label={t.actualBudgetPercent}
          value={formatGiftPercent(campaign.actual_gift_budget_percent)}
        />
        <Metric
          label={t.remainingBudget}
          value={formatGiftMoney(campaign.remaining_actual_cost_budget)}
        />
        <Metric
          label={t.voucherCost}
          value={formatGiftMoney(campaign.total_voucher_actual_cost)}
        />
        <Metric
          label={t.premiumCost}
          value={formatGiftMoney(campaign.total_premium_actual_cost)}
        />
      </dl>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500">
              <th className="px-2 py-2">{t.tierCol}</th>
              <th className="px-2 py-2">{t.customers}</th>
              <th className="px-2 py-2">{t.actualPerCustomerCol}</th>
              <th className="px-2 py-2">{t.estPerCustomerCol}</th>
              <th className="px-2 py-2">{t.totalActualCol}</th>
              <th className="px-2 py-2">{t.totalEstimatedCol}</th>
            </tr>
          </thead>
          <tbody>
            {payload.tiers.map((tier) => {
              const calcTier = campaign.tiers.find((row) => row.id === tier.id);
              return (
                <tr key={tier.id} className="border-b border-gray-50">
                  <td className="px-2 py-2 font-medium text-gray-800">{tier.name}</td>
                  <td className="px-2 py-2">{tier.customer_count}</td>
                  <td className="px-2 py-2">
                    {formatGiftMoney(calcTier?.actual_cost_per_customer)}
                  </td>
                  <td className="px-2 py-2">
                    {formatGiftMoney(calcTier?.estimated_value_per_customer)}
                  </td>
                  <td className="px-2 py-2">
                    {formatGiftMoney(calcTier?.total_actual_cost)}
                  </td>
                  <td className="px-2 py-2">
                    {formatGiftMoney(calcTier?.total_estimated_value)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
        {t.customerListSoon}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-gray-900">{value}</dd>
    </div>
  );
}
