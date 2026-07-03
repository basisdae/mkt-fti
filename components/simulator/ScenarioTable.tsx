"use client";

import { Trash2, ListPlus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  isLowProfitMargin,
  sumScenarioRows,
  type ScenarioRow,
} from "@/lib/pricing";
import { cn, formatCurrencyTHB, formatPercent } from "@/lib/utils";

interface ScenarioTableProps {
  rows: ScenarioRow[];
  onRemove: (id: string) => void;
}

function ProfitValue({
  value,
  gpPercent,
  className,
}: {
  value: string;
  gpPercent: number;
  className?: string;
}) {
  const low = isLowProfitMargin(gpPercent);

  return (
    <span
      className={cn(
        low ? "font-semibold text-fti-red" : "font-semibold text-green-800",
        className,
      )}
    >
      {value}
    </span>
  );
}

export function ScenarioTable({ rows, onRemove }: ScenarioTableProps) {
  const totals = sumScenarioRows(rows);
  const totalsLow = isLowProfitMargin(totals.grossProfitPercent);

  if (rows.length === 0) {
    return (
      <Card className="border-dashed">
        <EmptyState
          icon={ListPlus}
          title="No scenario products yet"
          description='Configure inputs above and click "Add to Scenario" to build a multi-product forecast.'
          compact
        />
      </Card>
    );
  }

  return (
    <Card padding="none" interactive>
      <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-gray-900">
          Multi-Product Scenario
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 border-b border-gray-100 bg-light-purple/30 px-5 py-4 sm:grid-cols-4 sm:px-6">
        <SummaryTile label="Total Revenue" value={formatCurrencyTHB(totals.revenue)} />
        <SummaryTile label="Total Cost" value={formatCurrencyTHB(totals.totalCost)} />
        <SummaryTile
          label="Total Profit"
          value={formatCurrencyTHB(totals.grossProfit)}
          profit
          lowMargin={totalsLow}
        />
        <SummaryTile
          label="Blended GP"
          value={formatPercent(totals.grossProfitPercent)}
          profit
          lowMargin={totalsLow}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <th className="px-5 py-3 sm:px-6">Product</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Revenue</th>
              <th className="px-4 py-3 text-right">Cost</th>
              <th className="px-4 py-3 text-right">Profit</th>
              <th className="px-4 py-3 text-right">GP%</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-gray-50 transition-colors hover:bg-gray-50/60"
              >
                <td className="px-5 py-4 sm:px-6">
                  <p className="font-medium text-gray-900">{row.productName}</p>
                  <p className="text-xs text-gray-400">
                    {formatCurrencyTHB(row.sellingPrice)} / unit
                  </p>
                </td>
                <td className="px-4 py-4 text-right text-gray-700">
                  {row.qty.toLocaleString()}
                </td>
                <td className="px-4 py-4 text-right text-gray-900">
                  {formatCurrencyTHB(row.revenue)}
                </td>
                <td className="px-4 py-4 text-right text-gray-700">
                  {formatCurrencyTHB(row.totalCost)}
                </td>
                <td className="px-4 py-4 text-right">
                  <ProfitValue
                    value={formatCurrencyTHB(row.grossProfit)}
                    gpPercent={row.grossProfitPercent}
                  />
                </td>
                <td className="px-4 py-4 text-right">
                  <ProfitValue
                    value={formatPercent(row.grossProfitPercent)}
                    gpPercent={row.grossProfitPercent}
                  />
                </td>
                <td className="px-4 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(row.id)}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-fti-red"
                    aria-label={`Remove ${row.productName}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SummaryTile({
  label,
  value,
  profit,
  lowMargin,
}: {
  label: string;
  value: string;
  profit?: boolean;
  lowMargin?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p
        className={cn(
          "mt-1 text-lg font-bold",
          profit
            ? lowMargin
              ? "text-fti-red"
              : "text-green-800"
            : "text-gray-900",
        )}
      >
        {value}
      </p>
    </div>
  );
}
