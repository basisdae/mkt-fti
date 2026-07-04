"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import { formatLeadTimeDays } from "@/lib/lead-time";
import {
  buildTierRows,
  getRecommendedTierRow,
} from "@/lib/product-detail";
import { calculatePricing } from "@/lib/pricing";
import { cn, formatCurrencyTHB } from "@/lib/utils";
import type { ProductPriceOption } from "@/types/product";

interface BusinessMoqPriceTableProps {
  tiers: ProductPriceOption[];
}

export function BusinessMoqPriceTable({ tiers }: BusinessMoqPriceTableProps) {
  const recommendedTierId = useMemo(() => {
    if (tiers.length === 0) return "";
    return getRecommendedTierRow(buildTierRows(tiers)).tier.id;
  }, [tiers]);

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead>
          <tr className="bg-gray-50/90 text-xs font-semibold uppercase tracking-wide">
            <th className="px-4 py-3 text-gray-400">MOQ</th>
            <th className="px-4 py-3 text-right text-gray-400">USD</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-500">
              Cost THB
            </th>
            <th className="px-4 py-3 text-right font-bold tracking-wide text-[#9F1239]">
              FTI Selling Price
            </th>
            <th className="px-4 py-3 text-right font-semibold text-blue-700">
              Dealer Selling Price
            </th>
            <th className="px-4 py-3 text-right font-semibold text-green-700">
              FTI Profit
            </th>
            <th className="px-4 py-3 text-right font-semibold text-orange-600">
              Dealer Profit
            </th>
            <th className="px-4 py-3 text-right text-gray-400">Lead Time</th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier) => {
            const pricing = calculatePricing(tier);
            const isRecommended = tier.id === recommendedTierId;

            return (
              <tr
                key={tier.id}
                className={cn(
                  "border-t border-gray-50 transition-colors",
                  isRecommended ? "bg-light-purple/50" : "bg-white",
                )}
              >
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {tier.moq.toLocaleString()}
                    </span>
                    {tier.label && (
                      <span className="text-xs text-gray-400">
                        {tier.label}
                      </span>
                    )}
                    {isRecommended && (
                      <Badge variant="default">Recommended</Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums text-gray-700">
                  ${tier.usdCost.toFixed(2)}
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums text-gray-500">
                  {formatCurrencyTHB(pricing.costThb)}
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums text-base font-bold text-[#9F1239]">
                  {formatCurrencyTHB(pricing.ftiSellingPrice)}
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-blue-700">
                  {formatCurrencyTHB(pricing.dealerSellingPrice)}
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-green-700">
                  {formatCurrencyTHB(pricing.ftiProfit)}
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-orange-600">
                  {formatCurrencyTHB(pricing.dealerProfit)}
                </td>
                <td className="px-4 py-3.5 text-right text-gray-500">
                  {formatLeadTimeDays(tier.leadTime)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
