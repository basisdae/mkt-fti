/** Communication view columns allowed for sales-facing exports (no internal cost fields). */
export const GIFT_PLAN_COMMUNICATION_VIEW_COLUMNS = {
  gift_plans_communication_v: [
    "id",
    "name",
    "campaign_year",
    "campaign_headline",
    "description",
    "campaign_conditions",
    "status",
    "is_archived",
    "updated_at",
    "last_saved_at",
  ],
  gift_plan_items_communication_v: [
    "id",
    "tier_id",
    "sort_order",
    "gift_name",
    "category",
    "source",
    "qty_per_customer",
    "estimated_gift_value_per_unit",
    "notes",
    "created_at",
    "updated_at",
  ],
} as const;

export const GIFT_PLAN_COMMUNICATION_FORBIDDEN_COLUMNS = [
  "unit_actual_cost",
  "supplier",
  "specification",
  "purchase_group_id",
  "gift_catalog_id",
  "approval_notes",
  "max_actual_cost_budget",
  "budget_limit_percent",
  "total_customer_sales",
] as const;
