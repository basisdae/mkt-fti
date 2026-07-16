"use client";

import {
  calcGiftCampaign,
  toCampaignCalcInputFromEditor,
} from "@/lib/gift-plan-calculations";
import {
  formatGiftMoney,
  formatGiftPercent,
} from "@/lib/gift-plan-format";
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
      <h3 className="text-sm font-semibold text-gray-900">Campaign Summary</h3>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Total Customers" value={campaign.total_customers.toLocaleString()} />
        <Metric label="Total Gift Units" value={campaign.total_gift_units.toLocaleString()} />
        <Metric
          label="Total Actual Cost"
          value={formatGiftMoney(campaign.total_campaign_actual_cost)}
        />
        <Metric
          label="Total Estimated Value"
          value={formatGiftMoney(campaign.total_campaign_estimated_value)}
        />
        <Metric
          label="Actual Budget %"
          value={formatGiftPercent(campaign.actual_gift_budget_percent)}
        />
        <Metric
          label="Remaining Budget"
          value={formatGiftMoney(campaign.remaining_actual_cost_budget)}
        />
        <Metric
          label="Voucher Cost"
          value={formatGiftMoney(campaign.total_voucher_actual_cost)}
        />
        <Metric
          label="Premium Cost"
          value={formatGiftMoney(campaign.total_premium_actual_cost)}
        />
      </dl>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500">
              <th className="px-2 py-2">Tier</th>
              <th className="px-2 py-2">Customers</th>
              <th className="px-2 py-2">Actual / Customer</th>
              <th className="px-2 py-2">Est. / Customer</th>
              <th className="px-2 py-2">Total Actual</th>
              <th className="px-2 py-2">Total Estimated</th>
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
        Customer List — Coming soon
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
