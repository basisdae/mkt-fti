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

  const aboveThreshold = rows.filter((row) => !row.pricing.isLowGp);
  const recommended =
    aboveThreshold.length > 0
      ? aboveThreshold.reduce((best, row) =>
          row.pricing.ftiProfit > best.pricing.ftiProfit ? row : best,
        )
      : highestProfit;

  return { bestMoq, highestProfit, bestDealerMargin, recommended };
}
