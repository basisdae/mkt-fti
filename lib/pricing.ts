import type { ProductPriceOption } from "@/types/product";
import { generateId } from "@/lib/generate-id";

export const LOW_GP_THRESHOLD = 25;

export interface PricingResult {
  costThb: number;
  ftiSellingPrice: number;
  dealerSellingPrice: number;
  ftiProfit: number;
  dealerProfit: number;
  wholesaleGpPercent: number;
  dealerGpPercent: number;
  isLowGp: boolean;
}

export function calculatePricing(tier: ProductPriceOption): PricingResult {
  const costThb = tier.usdCost * tier.exchangeRate;
  const ftiSellingPrice = costThb / (1 - tier.wholesaleGp);
  const dealerSellingPrice = ftiSellingPrice / (1 - tier.dealerGp);
  const ftiProfit = ftiSellingPrice - costThb;
  const dealerProfit = dealerSellingPrice - ftiSellingPrice;
  const wholesaleGpPercent = tier.wholesaleGp * 100;
  const dealerGpPercent = tier.dealerGp * 100;

  return {
    costThb,
    ftiSellingPrice,
    dealerSellingPrice,
    ftiProfit,
    dealerProfit,
    wholesaleGpPercent,
    dealerGpPercent,
    isLowGp: wholesaleGpPercent < LOW_GP_THRESHOLD,
  };
}

/** Lowest MOQ tier for export summaries; prefers tiers with moq > 0. */
export function getLowestMoqPriceTier(
  options: ProductPriceOption[],
): ProductPriceOption | undefined {
  if (options.length === 0) return undefined;
  const withMoq = options.filter((option) => option.moq > 0);
  const pool = withMoq.length > 0 ? withMoq : options;
  return [...pool].sort((a, b) => a.moq - b.moq)[0];
}

export interface SimulatorCalcInput {
  pricing: PricingResult;
  expectedQty: number;
  targetRevenue: number;
}

export interface SimulatorCalcResult {
  revenue: number;
  totalCost: number;
  grossProfit: number;
  grossProfitPercent: number;
  requiredQtyFor100M: number;
}

export interface ScenarioRow {
  id: string;
  productId: string;
  productName: string;
  moqTierId: string;
  moq: number;
  qty: number;
  sellingPrice: number;
  unitCost: number;
  targetRevenue: number;
  revenue: number;
  totalCost: number;
  grossProfit: number;
  grossProfitPercent: number;
}

export interface ScenarioRowDraft {
  productId: string;
  moqTierId: string;
  qty: number;
  sellingPrice: number;
  unitCost: number;
  targetRevenue: number;
}

export interface ScenarioRowBuildOptions {
  id?: string;
  moqTierId?: string;
  moq?: number;
  targetRevenue?: number;
}

export interface ScenarioTotals {
  revenue: number;
  totalCost: number;
  grossProfit: number;
  grossProfitPercent: number;
}

const TARGET_100M = 100_000_000;

export function calculateSimulator(
  input: SimulatorCalcInput,
): SimulatorCalcResult {
  const { pricing, expectedQty } = input;
  const sellingPrice = pricing.ftiSellingPrice;
  const costThb = pricing.costThb;

  const revenue = sellingPrice * expectedQty;
  const totalCost = costThb * expectedQty;
  const grossProfit = revenue - totalCost;
  const grossProfitPercent =
    revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const requiredQtyFor100M =
    sellingPrice > 0 ? Math.ceil(TARGET_100M / sellingPrice) : 0;

  return {
    revenue,
    totalCost,
    grossProfit,
    grossProfitPercent,
    requiredQtyFor100M,
  };
}

export function buildScenarioRow(
  productId: string,
  productName: string,
  qty: number,
  sellingPrice: number,
  unitCost: number,
  options: ScenarioRowBuildOptions = {},
): ScenarioRow {
  const revenue = sellingPrice * qty;
  const totalCost = unitCost * qty;
  const grossProfit = revenue - totalCost;
  const grossProfitPercent =
    revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  return {
    id: options.id ?? generateId(),
    productId,
    productName,
    moqTierId: options.moqTierId ?? "",
    moq: options.moq ?? 0,
    qty,
    sellingPrice,
    unitCost,
    targetRevenue: options.targetRevenue ?? revenue,
    revenue,
    totalCost,
    grossProfit,
    grossProfitPercent,
  };
}

export function recalculateScenarioRow(
  row: ScenarioRow,
  draft: ScenarioRowDraft,
  resolveTier: (
    productId: string,
    moqTierId: string,
  ) => {
    productName: string;
    moqTierId: string;
    moq: number;
    unitCost: number;
    defaultSellingPrice: number;
  },
): ScenarioRow {
  const tier = resolveTier(draft.productId, draft.moqTierId);
  const qty = Math.max(0, draft.qty);
  const sellingPrice = Math.max(0, draft.sellingPrice);
  const unitCost = Math.max(0, draft.unitCost);
  const revenue = sellingPrice * qty;
  const totalCost = unitCost * qty;
  const grossProfit = revenue - totalCost;
  const grossProfitPercent =
    revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  return {
    id: row.id,
    productId: draft.productId,
    productName: tier.productName,
    moqTierId: tier.moqTierId,
    moq: tier.moq,
    qty,
    sellingPrice,
    unitCost,
    targetRevenue: Math.max(0, draft.targetRevenue),
    revenue,
    totalCost,
    grossProfit,
    grossProfitPercent,
  };
}

export function duplicateScenarioRow(row: ScenarioRow): ScenarioRow {
  return buildScenarioRow(
    row.productId,
    row.productName,
    row.qty,
    row.sellingPrice,
    row.unitCost,
    {
      moqTierId: row.moqTierId,
      moq: row.moq,
      targetRevenue: row.targetRevenue,
    },
  );
}

export function sumScenarioRows(rows: ScenarioRow[]): ScenarioTotals {
  const totals = rows.reduce(
    (acc, row) => ({
      revenue: acc.revenue + row.revenue,
      totalCost: acc.totalCost + row.totalCost,
      grossProfit: acc.grossProfit + row.grossProfit,
    }),
    { revenue: 0, totalCost: 0, grossProfit: 0 },
  );

  return {
    ...totals,
    grossProfitPercent:
      totals.revenue > 0 ? (totals.grossProfit / totals.revenue) * 100 : 0,
  };
}

export function isLowProfitMargin(grossProfitPercent: number): boolean {
  return grossProfitPercent < LOW_GP_THRESHOLD;
}
