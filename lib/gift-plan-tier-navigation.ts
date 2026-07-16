import {
  calcGiftCampaign,
  calcGiftItem,
  calcTierBudget,
  toCampaignCalcInputFromEditor,
  toTierBudgetCalcInput,
} from "@/lib/gift-plan-calculations";
import type { GiftPlanEditorPayload } from "@/types/gift-plan";

export type TierTabId = "overview" | string;
export type TierTabSelection = TierTabId;

export type TierWarningKind =
  | "complete"
  | "missing_customers"
  | "no_gifts"
  | "over_budget"
  | "missing_cost"
  | "missing_value";

export interface TierTabMeta {
  id: string;
  name: string;
  customerCount: number;
  itemCount: number;
  warnings: TierWarningKind[];
}

export function sortedTiers(payload: GiftPlanEditorPayload) {
  return [...payload.tiers].sort((a, b) => a.sort_order - b.sort_order);
}

export function deriveTierTabMeta(
  payload: GiftPlanEditorPayload,
): TierTabMeta[] {
  const campaign = calcGiftCampaign(toCampaignCalcInputFromEditor(payload));

  return sortedTiers(payload).map((tier) => {
    const warnings: TierWarningKind[] = [];
    const calcTier = campaign.tiers.find((row) => row.id === tier.id);

    if (tier.items.length === 0) warnings.push("no_gifts");

    for (const item of tier.items) {
      if (Number(item.unit_actual_cost) <= 0) warnings.push("missing_cost");
      if (Number(item.estimated_gift_value_per_unit) <= 0) {
        warnings.push("missing_value");
      }
    }

    const tierBudget = calcTierBudget(toTierBudgetCalcInput(tier));
    if (tierBudget.is_over_budget) warnings.push("over_budget");

    if (warnings.length === 0) warnings.push("complete");

    return {
      id: tier.id,
      name: tier.name,
      customerCount: tier.customer_count,
      itemCount: tier.items.length,
      warnings: [...new Set(warnings)],
    };
  });
}

export function tierCalcSummary(
  payload: GiftPlanEditorPayload,
  tierId: string,
) {
  const tier = payload.tiers.find((row) => row.id === tierId);
  if (!tier) return null;

  const campaign = calcGiftCampaign(toCampaignCalcInputFromEditor(payload));
  const calcTier = campaign.tiers.find((row) => row.id === tierId);
  const items = tier.items.map((item) =>
    calcGiftItem(
      {
        id: item.id,
        tier_id: item.tier_id,
        category: item.category,
        qty_per_customer: Number(item.qty_per_customer),
        unit_actual_cost: Number(item.unit_actual_cost),
        estimated_gift_value_per_unit: Number(
          item.estimated_gift_value_per_unit,
        ),
        purchase_group_id: item.purchase_group_id,
      },
      tier.customer_count,
    ),
  );

  return {
    tierName: tier.name,
    customerCount: tier.customer_count,
    itemCount: tier.items.length,
    giftUnits: items.reduce((sum, item) => sum + item.total_quantity, 0),
    actualPerCustomer: calcTier?.actual_cost_per_customer ?? 0,
    estimatedPerCustomer: calcTier?.estimated_value_per_customer ?? 0,
    totalActual: calcTier?.total_actual_cost ?? 0,
    totalEstimated: calcTier?.total_estimated_value ?? 0,
  };
}

export function catalogUsageInPlan(
  payload: GiftPlanEditorPayload,
  catalogId: string,
) {
  const byTier: Array<{ tierId: string; tierName: string; qty: number }> = [];

  for (const tier of sortedTiers(payload)) {
    const matches = tier.items.filter(
      (item) => item.gift_catalog_id === catalogId,
    );
    if (matches.length === 0) continue;
    const qty = matches.reduce(
      (sum, item) => sum + Number(item.qty_per_customer),
      0,
    );
    byTier.push({ tierId: tier.id, tierName: tier.name, qty });
  }

  return byTier;
}

export function itemsInTierForCatalog(
  payload: GiftPlanEditorPayload,
  tierId: string,
  catalogId: string,
) {
  const tier = payload.tiers.find((row) => row.id === tierId);
  if (!tier) return [];
  return tier.items.filter((item) => item.gift_catalog_id === catalogId);
}
