import { calculatePricing, type PricingResult } from "@/lib/pricing";
import type { ProductPriceOption } from "@/types/product";

export interface TierPricingRow {
  tier: ProductPriceOption;
  pricing: PricingResult;
}

export interface ProfitSummary {
  bestMoq: TierPricingRow;
  highestProfit: TierPricingRow;
  bestDealerMargin: TierPricingRow;
  recommended: TierPricingRow;
}

export function buildTierRows(tiers: ProductPriceOption[]): TierPricingRow[] {
  return tiers.map((tier) => ({
    tier,
    pricing: calculatePricing(tier),
  }));
}

/**
 * Recommended MOQ: best FTI profit; if profit is tied, lowest MOQ wins.
 * Does not change pricing formulas — only selects among calculated rows.
 */
export function getRecommendedTierRow(rows: TierPricingRow[]): TierPricingRow {
  return rows.reduce((best, row) => {
    if (row.pricing.ftiProfit > best.pricing.ftiProfit) return row;
    if (row.pricing.ftiProfit < best.pricing.ftiProfit) return best;
    return row.tier.moq < best.tier.moq ? row : best;
  });
}

export function getProfitSummary(tiers: ProductPriceOption[]): ProfitSummary {
  const rows = buildTierRows(tiers);

  const bestMoq = rows.reduce((best, row) =>
    row.tier.moq < best.tier.moq ? row : best,
  );

  const highestProfit = rows.reduce((best, row) =>
    row.pricing.ftiProfit > best.pricing.ftiProfit ? row : best,
  );

  const bestDealerMargin = rows.reduce((best, row) =>
    row.pricing.dealerGpPercent > best.pricing.dealerGpPercent ? row : best,
  );

  const recommended = getRecommendedTierRow(rows);

  return { bestMoq, highestProfit, bestDealerMargin, recommended };
}
