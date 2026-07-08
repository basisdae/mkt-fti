"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  buildPlanCompareRows,
  isBestCompareValue,
  type SimulatorPlanCompareRow,
} from "@/lib/simulator-plan-compare";
import { exportSimulatorPlanComparison } from "@/lib/simulator-plan-export";
import {
  listSalesProjects,
  projectToSimulatorPlan,
} from "@/lib/sales-projects";
import {
  formatPlanMoney,
  type SimulatorPlan,
} from "@/lib/simulator-plans";
import { cn, timeAgo } from "@/lib/utils";

interface SimulatorCompareModalProps {
  open: boolean;
  onClose: () => void;
  onOpenPlan: (plan: SimulatorPlan) => void;
  onExportSuccess?: (fileName: string) => void;
  onExportError?: (message: string) => void;
}

const MAX_SELECT = 4;

export function SimulatorCompareModal({
  open,
  onClose,
  onOpenPlan,
  onExportSuccess,
  onExportError,
}: SimulatorCompareModalProps) {
  const [plans, setPlans] = useState<SimulatorPlan[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const all = listSalesProjects().map(projectToSimulatorPlan);
    setPlans(all);
    setSelectedIds(all.slice(0, Math.min(2, all.length)).map((plan) => plan.id));
    setError(null);
  }, [open]);

  const selectedPlans = useMemo(
    () => plans.filter((plan) => selectedIds.includes(plan.id)),
    [plans, selectedIds],
  );

  const compareRows = useMemo(
    () => buildPlanCompareRows(selectedPlans),
    [selectedPlans],
  );

  function togglePlan(planId: string) {
    setSelectedIds((prev) => {
      if (prev.includes(planId)) {
        return prev.filter((id) => id !== planId);
      }
      if (prev.length >= MAX_SELECT) return prev;
      return [...prev, planId];
    });
  }

  async function handleExport() {
    if (compareRows.length < 2) return;
    setExporting(true);
    setError(null);
    try {
      const fileName = await exportSimulatorPlanComparison(
        compareRows.map((row) => ({
          name: row.plan.name,
          createdAt: row.plan.createdAt,
          updatedAt: row.plan.updatedAt,
          productId: row.plan.productId,
          tierId: row.plan.tierId,
          targetRevenue: row.plan.targetRevenue,
          expectedQty: row.plan.expectedQty,
          scenarioRows: row.plan.scenarioRows,
          notes: row.plan.notes,
        })),
      );
      onExportSuccess?.(fileName);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Export failed";
      setError(message);
      onExportError?.(message);
    } finally {
      setExporting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-plans-title"
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <GitCompareArrows className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="compare-plans-title"
                className="text-lg font-semibold text-gray-900"
              >
                Compare Plans
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Select 2–4 saved plans. Comparison is read-only and does not
                change saved data.
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {plans.length < 2 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-12 text-center">
              <p className="text-sm font-medium text-gray-800">
                Need at least 2 saved plans
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Save two or more plans from the Simulator, then open Compare
                Plans again.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 grid gap-2 sm:grid-cols-2">
                {plans.map((plan) => {
                  const checked = selectedIds.includes(plan.id);
                  const disabled = !checked && selectedIds.length >= MAX_SELECT;
                  return (
                    <label
                      key={plan.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                        checked
                          ? "border-primary/25 bg-primary/5"
                          : "border-gray-100 bg-gray-50/80",
                        disabled && "cursor-not-allowed opacity-50",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 accent-primary"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => togglePlan(plan.id)}
                      />
                      <span className="min-w-0">
                        <span className="block font-semibold text-gray-900">
                          {plan.name}
                        </span>
                        <span className="block text-xs text-gray-500">
                          Updated {timeAgo(plan.updatedAt)} ·{" "}
                          {plan.summary.productCount} scenarios
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>

              {compareRows.length < 2 ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Select at least 2 plans to compare.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-3 py-2">Plan</th>
                        <th className="px-3 py-2">Updated</th>
                        <th className="px-3 py-2 text-right">Products</th>
                        <th className="px-3 py-2 text-right">Target sales</th>
                        <th className="px-3 py-2 text-right">Revenue</th>
                        <th className="px-3 py-2 text-right">Cost</th>
                        <th className="px-3 py-2 text-right">Profit</th>
                        <th className="px-3 py-2 text-right">GP %</th>
                        <th className="px-3 py-2 text-right">Risks</th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {compareRows.map((row) => (
                        <CompareTableRow
                          key={row.plan.id}
                          row={row}
                          rows={compareRows}
                          onOpen={() => {
                            onOpenPlan(row.plan);
                            onClose();
                          }}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {error && (
                <p className="mt-3 text-sm font-medium text-fti-red">{error}</p>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-5 py-3">
          <p className="text-[11px] text-gray-400">
            Best revenue, profit, and GP % are highlighted.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={compareRows.length < 2 || exporting}
              onClick={() => void handleExport()}
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? "Exporting…" : "Export Comparison"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompareTableRow({
  row,
  rows,
  onOpen,
}: {
  row: SimulatorPlanCompareRow;
  rows: SimulatorPlanCompareRow[];
  onOpen: () => void;
}) {
  return (
    <tr className="border-t border-gray-100 text-gray-800">
      <td className="px-3 py-2 font-semibold">{row.plan.name}</td>
      <td className="px-3 py-2 text-gray-500">{timeAgo(row.plan.updatedAt)}</td>
      <td className="px-3 py-2 text-right tabular-nums">{row.productCount}</td>
      <td className="px-3 py-2 text-right tabular-nums">
        {formatPlanMoney(row.totalTargetSales)}
      </td>
      <td
        className={cn(
          "px-3 py-2 text-right tabular-nums",
          isBestCompareValue(rows, "totalRevenue", row.totalRevenue) &&
            "bg-green-50 font-semibold text-green-800",
        )}
      >
        {formatPlanMoney(row.totalRevenue)}
      </td>
      <td className="px-3 py-2 text-right tabular-nums">
        {formatPlanMoney(row.totalCost)}
      </td>
      <td
        className={cn(
          "px-3 py-2 text-right tabular-nums",
          isBestCompareValue(rows, "grossProfit", row.grossProfit) &&
            "bg-green-50 font-semibold text-green-800",
        )}
      >
        {formatPlanMoney(row.grossProfit)}
      </td>
      <td
        className={cn(
          "px-3 py-2 text-right tabular-nums",
          isBestCompareValue(rows, "gpPercent", row.gpPercent) &&
            "bg-green-50 font-semibold text-green-800",
        )}
      >
        {row.gpPercent.toFixed(1)}%
      </td>
      <td className="px-3 py-2 text-right tabular-nums">{row.risksCount}</td>
      <td className="px-3 py-2 text-right">
        <Button type="button" size="sm" variant="ghost" onClick={onOpen}>
          Open
        </Button>
      </td>
    </tr>
  );
}
