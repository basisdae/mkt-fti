"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculatePricing, LOW_GP_THRESHOLD } from "@/lib/pricing";
import { formatCurrencyTHB, formatPercent } from "@/lib/utils";
import type { ProductPriceOption } from "@/types/product";

interface MoqTierTableProps {
  tiers: ProductPriceOption[];
  selectedTierId: string;
  onSelect: (tierId: string) => void;
}

export function MoqTierTable({
  tiers,
  selectedTierId,
  onSelect,
}: MoqTierTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <th className="pb-3 pr-4">MOQ</th>
            <th className="pb-3 pr-4 text-right">USD Cost</th>
            <th className="pb-3 pr-4 text-right">Rate</th>
            <th className="pb-3 pr-4 text-right">Cost THB</th>
            <th className="pb-3 pr-4 text-right">FTI Price</th>
            <th className="pb-3 pr-4 text-right">Dealer Price</th>
            <th className="pb-3 pr-4 text-right">GP%</th>
            <th className="pb-3 text-right">FTI Profit</th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier) => {
            const pricing = calculatePricing(tier);
            const isSelected = tier.id === selectedTierId;

            return (
              <tr
                key={tier.id}
                onClick={() => onSelect(tier.id)}
                className={cn(
                  "cursor-pointer border-b border-gray-50 transition-colors",
                  isSelected
                    ? "bg-light-purple/60"
                    : "hover:bg-gray-50/80",
                )}
              >
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
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
                    <span className="font-medium text-gray-900">
                      {tier.moq.toLocaleString()}
                      {tier.label && (
                        <span className="ml-1 text-xs text-gray-400">
                          ({tier.label})
                        </span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-right text-gray-700">
                  ${tier.usdCost.toFixed(2)}
                </td>
                <td className="py-3 pr-4 text-right text-gray-500">
                  {tier.exchangeRate.toFixed(2)}
                </td>
                <td className="py-3 pr-4 text-right text-gray-700">
                  {formatCurrencyTHB(pricing.costThb)}
                </td>
                <td className="py-3 pr-4 text-right font-medium text-gray-900">
                  {formatCurrencyTHB(pricing.ftiSellingPrice)}
                </td>
                <td className="py-3 pr-4 text-right text-gray-700">
                  {formatCurrencyTHB(pricing.dealerSellingPrice)}
                </td>
                <td
                  className={cn(
                    "py-3 pr-4 text-right font-medium",
                    pricing.isLowGp ? "text-amber-600" : "text-gray-900",
                  )}
                >
                  {formatPercent(pricing.wholesaleGpPercent)}
                </td>
                <td className="py-3 text-right font-semibold text-green-800">
                  {formatCurrencyTHB(pricing.ftiProfit)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface PricingSummaryProps {
  tier: ProductPriceOption;
}

export function PricingSummary({ tier }: PricingSummaryProps) {
  const pricing = calculatePricing(tier);

  return (
    <div className="space-y-4">
      {pricing.isLowGp && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Low GP Warning
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              Wholesale GP is {formatPercent(pricing.wholesaleGpPercent)} — below
              the {LOW_GP_THRESHOLD}% threshold.
            </p>
          </div>
        </div>
      )}

      <dl className="grid gap-3 sm:grid-cols-2">
        <SummaryRow
          label="Cost (THB)"
          value={formatCurrencyTHB(pricing.costThb)}
          sub={`$${tier.usdCost.toFixed(2)} × ${tier.exchangeRate.toFixed(2)}`}
        />
        <SummaryRow
          label="FTI Selling Price"
          value={formatCurrencyTHB(pricing.ftiSellingPrice)}
          sub={`GP ${formatPercent(pricing.wholesaleGpPercent)}`}
        />
        <SummaryRow
          label="Dealer Selling Price"
          value={formatCurrencyTHB(pricing.dealerSellingPrice)}
          sub={`Dealer GP ${formatPercent(pricing.dealerGpPercent)}`}
        />
        <SummaryRow
          label="FTI Profit / Unit"
          value={formatCurrencyTHB(pricing.ftiProfit)}
          profit
        />
        <SummaryRow
          label="Dealer Profit / Unit"
          value={formatCurrencyTHB(pricing.dealerProfit)}
          profit
        />
      </dl>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  sub,
  profit,
}: {
  label: string;
  value: string;
  sub?: string;
  profit?: boolean;
}) {
  return (
    <div className="rounded-xl bg-gray-50/80 px-4 py-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 text-sm font-semibold",
          profit ? "text-green-800" : "text-gray-900",
        )}
      >
        {value}
      </dd>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}
