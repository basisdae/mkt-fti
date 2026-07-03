import type { ProductPriceOption } from "@/types/product";

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
  qty: number;
  sellingPrice: number;
  unitCost: number;
  revenue: number;
  totalCost: number;
  grossProfit: number;
  grossProfitPercent: number;
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
  id?: string,
): ScenarioRow {
  const revenue = sellingPrice * qty;
  const totalCost = unitCost * qty;
  const grossProfit = revenue - totalCost;
  const grossProfitPercent =
    revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  return {
    id: id ?? `scenario-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    productId,
    productName,
    qty,
    sellingPrice,
    unitCost,
    revenue,
    totalCost,
    grossProfit,
    grossProfitPercent,
  };
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
