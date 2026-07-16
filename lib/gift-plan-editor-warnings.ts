import {
  calcGiftCampaign,
  toCampaignCalcInputFromEditor,
} from "@/lib/gift-plan-calculations";
import type { GiftPlanEditorPayload } from "@/types/gift-plan";

export interface GiftPlanEditorWarning {
  id: string;
  message: string;
  severity: "info" | "warning" | "error";
}

export function deriveGiftPlanEditorWarnings(
  payload: GiftPlanEditorPayload,
  dirty: boolean,
): GiftPlanEditorWarning[] {
  const warnings: GiftPlanEditorWarning[] = [];
  const campaign = calcGiftCampaign(toCampaignCalcInputFromEditor(payload));

  if (dirty) {
    warnings.push({
      id: "unsaved",
      message: "You have unsaved changes.",
      severity: "warning",
    });
  }

  if (payload.tiers.length === 0) {
    warnings.push({
      id: "no-tiers",
      message: "Add at least one tier to this plan.",
      severity: "warning",
    });
  }

  for (const tier of payload.tiers) {
    if (tier.customer_count <= 0) {
      warnings.push({
        id: `tier-customers-${tier.id}`,
        message: `Tier "${tier.name}" has no customer count.`,
        severity: "warning",
      });
    }
    if (tier.items.length === 0) {
      warnings.push({
        id: `tier-items-${tier.id}`,
        message: `Tier "${tier.name}" has no gift items selected.`,
        severity: "warning",
      });
    }
    for (const item of tier.items) {
      if (Number(item.unit_actual_cost) <= 0) {
        warnings.push({
          id: `item-cost-${item.id}`,
          message: `"${item.gift_name}" in ${tier.name} has no unit actual cost.`,
          severity: "warning",
        });
      }
      if (Number(item.estimated_gift_value_per_unit) <= 0) {
        warnings.push({
          id: `item-value-${item.id}`,
          message: `"${item.gift_name}" in ${tier.name} has no estimated gift value.`,
          severity: "warning",
        });
      }
    }
  }

  if (
    payload.plan.max_actual_cost_budget != null &&
    campaign.total_campaign_actual_cost >
      Number(payload.plan.max_actual_cost_budget)
  ) {
    warnings.push({
      id: "over-budget",
      message: "Total actual cost exceeds the maximum budget.",
      severity: "error",
    });
  }

  const seen = new Map<string, string[]>();
  for (const tier of payload.tiers) {
    for (const item of tier.items) {
      if (!item.gift_catalog_id) continue;
      const list = seen.get(item.gift_catalog_id) ?? [];
      list.push(tier.name);
      seen.set(item.gift_catalog_id, list);
    }
  }
  for (const [catalogId, tiers] of seen) {
    if (tiers.length > 1) {
      warnings.push({
        id: `dup-catalog-${catalogId}`,
        message: `Same catalog item appears in multiple tiers (${tiers.join(", ")}). Review purchasing groups before export.`,
        severity: "info",
      });
    }
  }

  return warnings;
}
