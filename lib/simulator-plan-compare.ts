/**
 * Read-only comparison helpers for saved simulator plans (localStorage).
 */
import { sumScenarioRows } from "@/lib/pricing";
import type { SimulatorPlan } from "@/lib/simulator-plans";

export interface SimulatorPlanCompareRow {
  plan: SimulatorPlan;
  productCount: number;
  totalTargetSales: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  gpPercent: number;
  risksCount: number;
}

function countRiskLines(risks: string | undefined): number {
  const text = (risks ?? "").trim();
  if (!text) return 0;
  return text
    .split(/\n|;|\|/)
    .map((line) => line.trim())
    .filter(Boolean).length;
}

export function buildPlanCompareRow(plan: SimulatorPlan): SimulatorPlanCompareRow {
  const totals = sumScenarioRows(plan.scenarioRows);
  return {
    plan,
    productCount: plan.summary.productCount ?? plan.scenarioRows.length,
    totalTargetSales:
      plan.summary.totalTargetRevenue ??
      plan.scenarioRows.reduce(
        (sum, row) => sum + (Number(row.targetRevenue) || 0),
        0,
      ),
    totalRevenue: totals.revenue,
    totalCost: totals.totalCost,
    grossProfit: totals.grossProfit,
    gpPercent: totals.grossProfitPercent,
    risksCount: countRiskLines(plan.notes?.risks),
  };
}

export function buildPlanCompareRows(
  plans: SimulatorPlan[],
): SimulatorPlanCompareRow[] {
  return plans.map(buildPlanCompareRow);
}

export type CompareHighlightKey =
  | "totalRevenue"
  | "grossProfit"
  | "gpPercent";

export function getBestCompareValues(
  rows: SimulatorPlanCompareRow[],
): Record<CompareHighlightKey, number | null> {
  if (rows.length === 0) {
    return { totalRevenue: null, grossProfit: null, gpPercent: null };
  }
  return {
    totalRevenue: Math.max(...rows.map((row) => row.totalRevenue)),
    grossProfit: Math.max(...rows.map((row) => row.grossProfit)),
    gpPercent: Math.max(...rows.map((row) => row.gpPercent)),
  };
}

export function isBestCompareValue(
  rows: SimulatorPlanCompareRow[],
  key: CompareHighlightKey,
  value: number,
): boolean {
  if (rows.length < 2) return false;
  const best = getBestCompareValues(rows)[key];
  return best != null && value === best;
}
