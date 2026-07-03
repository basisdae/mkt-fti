"use client";

import { cn } from "@/lib/utils";
import { calculatePricing, isLowProfitMargin } from "@/lib/pricing";
import { formatCurrencyTHB } from "@/lib/utils";
import type { ProductPriceOption } from "@/types/product";

interface BusinessMoqPriceTableProps {
  tiers: ProductPriceOption[];
  selectedTierId: string;
  onSelect: (tierId: string) => void;
}

export function BusinessMoqPriceTable({
  tiers,
  selectedTierId,
  onSelect,
}: BusinessMoqPriceTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead>
          <tr className="bg-gray-50/90 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <th className="px-4 py-3">MOQ</th>
            <th className="px-4 py-3 text-right">USD</th>
            <th className="px-4 py-3 text-right">Cost THB</th>
            <th className="px-4 py-3 text-right">FTI Selling Price</th>
            <th className="px-4 py-3 text-right">Dealer Selling Price</th>
            <th className="px-4 py-3 text-right">FTI Profit</th>
            <th className="px-4 py-3 text-right">Dealer Profit</th>
            <th className="px-4 py-3 text-right">Lead Time</th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier) => {
            const pricing = calculatePricing(tier);
            const isSelected = tier.id === selectedTierId;
            const lowMargin = isLowProfitMargin(pricing.wholesaleGpPercent);

            return (
              <tr
                key={tier.id}
                onClick={() => onSelect(tier.id)}
                className={cn(
                  "cursor-pointer border-t border-gray-50 transition-colors",
                  isSelected ? "bg-light-purple/50" : "hover:bg-gray-50/70",
                )}
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-gray-300",
                      )}
                    >
                      {isSelected && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {tier.moq.toLocaleString()}
                    </span>
                    {tier.label && (
                      <span className="text-xs text-gray-400">
                        {tier.label}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums text-gray-700">
                  ${tier.usdCost.toFixed(2)}
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums text-gray-700">
                  {formatCurrencyTHB(pricing.costThb)}
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums font-medium text-gray-900">
                  {formatCurrencyTHB(pricing.ftiSellingPrice)}
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums text-gray-700">
                  {formatCurrencyTHB(pricing.dealerSellingPrice)}
                </td>
                <td
                  className={cn(
                    "px-4 py-3.5 text-right tabular-nums font-semibold",
                    lowMargin ? "text-fti-red" : "text-green-800",
                  )}
                >
                  {formatCurrencyTHB(pricing.ftiProfit)}
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-green-800">
                  {formatCurrencyTHB(pricing.dealerProfit)}
                </td>
                <td className="px-4 py-3.5 text-right text-gray-500">
                  {tier.leadTime}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
