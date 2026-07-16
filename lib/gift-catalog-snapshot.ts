import { generateId } from "@/lib/generate-id";
import { createDefaultPurchaseGroup } from "@/lib/gift-plan-purchase-group-factory";
import type { GiftCatalogRow } from "@/types/gift-catalog";
import type { GiftPlanItemInput } from "@/types/gift-plan";

export function applyCatalogToPlanItem(
  catalog: GiftCatalogRow,
  planId: string,
  tierId: string,
  sortOrder: number,
  overrides?: Partial<
    Pick<
      GiftPlanItemInput,
      | "qty_per_customer"
      | "unit_actual_cost"
      | "estimated_gift_value_per_unit"
      | "notes"
    >
  >,
): { item: GiftPlanItemInput; group: ReturnType<typeof createDefaultPurchaseGroup> } {
  const item: GiftPlanItemInput = {
    id: generateId(),
    tier_id: tierId,
    sort_order: sortOrder,
    gift_catalog_id: catalog.id,
    gift_name: catalog.gift_name,
    category: catalog.category,
    source: catalog.source,
    qty_per_customer: overrides?.qty_per_customer ?? 1,
    unit_actual_cost:
      overrides?.unit_actual_cost ?? Number(catalog.default_actual_cost),
    estimated_gift_value_per_unit:
      overrides?.estimated_gift_value_per_unit ??
      Number(catalog.default_estimated_gift_value),
    supplier: catalog.supplier_name,
    specification: catalog.specification,
    notes: overrides?.notes ?? (catalog.notes || null),
    purchase_group_id: null,
    image_path: catalog.image_path,
    image_url: catalog.image_url,
    reference_url: catalog.reference_url,
    operational_status: catalog.operational_status ?? "interested",
  };
  const group = createDefaultPurchaseGroup(planId, item);
  return {
    item: { ...item, purchase_group_id: group.id },
    group,
  };
}
