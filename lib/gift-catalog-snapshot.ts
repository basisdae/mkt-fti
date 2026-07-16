import { generateId } from "@/lib/generate-id";
import type { GiftCatalogRow } from "@/types/gift-catalog";
import type { GiftPlanItemInput } from "@/types/gift-plan";

export function applyCatalogToPlanItem(
  catalog: GiftCatalogRow,
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
): GiftPlanItemInput {
  return {
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
  };
}
