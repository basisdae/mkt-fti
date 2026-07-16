"use client";

import { formatGiftMoney, formatGiftPercent } from "@/lib/gift-plan-format";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import type { TierComparisonRow } from "@/lib/gift-plan-calculations";
import type { TierTabSelection } from "@/lib/gift-plan-tier-navigation";
import { cn } from "@/lib/utils";

interface GiftPlanTierComparisonTableProps {
  rows: TierComparisonRow[];
  onSelectTier: (tierId: TierTabSelection) => void;
}

export function GiftPlanTierComparisonTable({
  rows,
  onSelectTier,
}: GiftPlanTierComparisonTableProps) {
  if (rows.length === 0) return null;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">{t.tierComparison}</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500">
              <th className="px-1 py-1.5 font-medium">{t.tierCol}</th>
              <th className="px-1 py-1.5 font-medium">{t.salesThreshold}</th>
              <th className="px-1 py-1.5 font-medium">{t.customers}</th>
              <th className="px-1 py-1.5 font-medium">{t.actualPerCustomerCol}</th>
              <th className="px-1 py-1.5 font-medium">{t.estPerCustomerCol}</th>
              <th className="px-1 py-1.5 font-medium">{t.totalActualCol}</th>
              <th className="px-1 py-1.5 font-medium">{t.giftCostPercentOfSales}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.tier_id}
                className={cn(
                  "cursor-pointer border-b border-gray-50 transition-colors hover:bg-gray-50",
                  row.warnings.includes("no_gifts") && "bg-amber-50/40",
                  row.warnings.includes("pending_customers") && "bg-slate-50/80",
                  row.warnings.includes("high_cost_ratio") && "bg-rose-50/30",
                )}
                onClick={() => onSelectTier(row.tier_id)}
              >
                <td className="px-1 py-1.5 font-medium text-gray-900">
                  {row.tier_name}
                </td>
                <td className="px-1 py-1.5 text-gray-600">
                  {row.sales_threshold_label ||
                    (row.sales_threshold != null
                      ? formatGiftMoney(row.sales_threshold)
                      : "—")}
                </td>
                <td className="px-1 py-1.5 text-gray-600">
                  {row.customer_count_status === "ready"
                    ? row.customer_count?.toLocaleString("th-TH")
                    : t.pendingCustomerCount}
                </td>
                <td className="px-1 py-1.5">
                  {formatGiftMoney(row.actual_per_customer)}
                </td>
                <td className="px-1 py-1.5">
                  {formatGiftMoney(row.estimated_per_customer)}
                </td>
                <td className="px-1 py-1.5">
                  {row.total_status === "pending_customers"
                    ? t.pendingCustomerCount
                    : formatGiftMoney(row.total_actual_cost)}
                </td>
                <td className="px-1 py-1.5">
                  {formatGiftPercent(row.gift_cost_percent_of_sales)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
