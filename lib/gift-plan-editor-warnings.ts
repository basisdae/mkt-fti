import {
  calcGiftCampaign,
  toCampaignCalcInputFromEditor,
} from "@/lib/gift-plan-calculations";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
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
      message: t.warningUnsaved,
      severity: "warning",
    });
  }

  if (payload.tiers.length === 0) {
    warnings.push({
      id: "no-tiers",
      message: t.warningNoTiers,
      severity: "warning",
    });
  }

  for (const tier of payload.tiers) {
    if (tier.customer_count <= 0) {
      warnings.push({
        id: `tier-customers-${tier.id}`,
        message: t.warningTierNoCustomers(tier.name),
        severity: "warning",
      });
    }
    if (tier.items.length === 0) {
      warnings.push({
        id: `tier-items-${tier.id}`,
        message: t.warningTierNoItems(tier.name),
        severity: "warning",
      });
    }
    for (const item of tier.items) {
      if (Number(item.unit_actual_cost) <= 0) {
        warnings.push({
          id: `item-cost-${item.id}`,
          message: t.warningItemNoCost(item.gift_name, tier.name),
          severity: "warning",
        });
      }
      if (Number(item.estimated_gift_value_per_unit) <= 0) {
        warnings.push({
          id: `item-value-${item.id}`,
          message: t.warningItemNoValue(item.gift_name, tier.name),
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
      message: t.warningOverBudget,
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
        message: t.warningDupCatalog(tiers.join(", ")),
        severity: "info",
      });
    }
  }

  return warnings;
}
