export const GIFT_PLAN_STATUSES = [
  "draft",
  "review",
  "approved",
  "preparing",
  "completed",
] as const;

export type GiftPlanStatus = (typeof GIFT_PLAN_STATUSES)[number];

export const GIFT_ITEM_CATEGORIES = [
  "gift_voucher",
  "premium_gift",
  "certificate",
  "product",
  "sales_gift",
  "executive_gift",
  "other",
] as const;

export type GiftItemCategory = (typeof GIFT_ITEM_CATEGORIES)[number];

export const GIFT_ITEM_SOURCES = [
  "marketing",
  "sales",
  "executive",
  "fti_stock",
  "external_purchase",
  "other",
] as const;

export type GiftItemSource = (typeof GIFT_ITEM_SOURCES)[number];

export interface GiftPlanRow {
  id: string;
  name: string;
  campaign_year: number;
  campaign_headline: string;
  description: string;
  owner: string;
  status: GiftPlanStatus;
  total_customer_sales: number;
  max_actual_cost_budget: number | null;
  budget_limit_percent: number | null;
  campaign_conditions: string;
  approval_notes: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  last_saved_at: string;
  created_by_email: string | null;
  updated_by_email: string | null;
}

export interface GiftPlanPurchaseGroupRow {
  id: string;
  plan_id: string;
  label: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface GiftPlanTierRow {
  id: string;
  plan_id: string;
  name: string;
  sort_order: number;
  sales_threshold: number | null;
  sales_threshold_label: string;
  customer_count: number;
  estimated_total_sales: number | null;
  gift_budget_percent: number | null;
  estimated_customer_count: number | null;
  notes: string;
  gift_policy: string;
  created_at: string;
  updated_at: string;
}

export interface GiftPlanItemRow {
  id: string;
  tier_id: string;
  sort_order: number;
  gift_name: string;
  category: GiftItemCategory;
  source: GiftItemSource;
  qty_per_customer: number;
  unit_actual_cost: number;
  estimated_gift_value_per_unit: number;
  supplier: string | null;
  notes: string | null;
  purchase_group_id: string | null;
  gift_catalog_id: string | null;
  specification: string;
  reference_url: string | null;
  operational_status: string;
  created_at: string;
  updated_at: string;
}

export interface GiftPlanItemInput {
  id: string;
  tier_id: string;
  sort_order: number;
  gift_name: string;
  category: GiftItemCategory;
  source: GiftItemSource;
  qty_per_customer: number;
  unit_actual_cost: number;
  estimated_gift_value_per_unit: number;
  supplier: string | null;
  notes: string | null;
  purchase_group_id: string | null;
  gift_catalog_id: string | null;
  specification: string;
  reference_url?: string | null;
  operational_status?: string;
  /** Client-only display fields from catalog snapshot (not persisted). */
  image_path?: string | null;
  image_url?: string | null;
}

export interface GiftPlanTierInput {
  id: string;
  plan_id: string;
  name: string;
  sort_order: number;
  sales_threshold: number | null;
  sales_threshold_label: string;
  customer_count: number;
  estimated_total_sales: number | null;
  gift_budget_percent: number | null;
  estimated_customer_count: number | null;
  notes: string;
  gift_policy: string;
  items: GiftPlanItemInput[];
}

export interface GiftPlanPurchaseGroupInput {
  id: string;
  plan_id: string;
  label: string;
  notes: string;
}

export interface GiftPlanEditorPayload {
  plan: {
    id: string;
    name: string;
    campaign_year: number;
    campaign_headline: string;
    description: string;
    owner: string;
    status: GiftPlanStatus;
    total_customer_sales: number;
    max_actual_cost_budget: number | null;
    budget_limit_percent: number | null;
    campaign_conditions: string;
    approval_notes: string;
    is_archived: boolean;
  };
  tiers: GiftPlanTierInput[];
  purchase_groups: GiftPlanPurchaseGroupInput[];
  expected_updated_at?: string | null;
}

export interface GiftPlanListSummary {
  id: string;
  name: string;
  campaign_year: number;
  status: GiftPlanStatus;
  is_archived: boolean;
  owner: string;
  total_customers: number;
  total_gift_units: number;
  total_actual_cost: number;
  total_estimated_value: number;
  budget_percent: number | null;
  updated_at: string;
  last_saved_at: string;
}

/** Plan metadata edited from the home card (no tiers/items). */
export interface GiftPlanBasicsForm {
  id: string;
  name: string;
  campaign_year: number;
  campaign_headline: string;
  description: string;
  owner: string;
  status: GiftPlanStatus;
  campaign_conditions: string;
}

/** Full editor bundle returned to users with edit permission. */
export interface GiftPlanEditorBundle {
  plan: GiftPlanRow;
  tiers: GiftPlanTierRow[];
  items: GiftPlanItemRow[];
  purchase_groups: GiftPlanPurchaseGroupRow[];
}

/** Sales Communication Report — safe for external distribution. */
export interface GiftPlanCommunicationItem {
  gift_name: string;
  category: GiftItemCategory;
  qty_per_customer: number;
  voucher_value: number | null;
  estimated_gift_value_per_unit: number;
  estimated_value_per_customer: number;
  display_line: string;
}

export interface GiftPlanCommunicationTier {
  id: string;
  name: string;
  sort_order: number;
  sales_threshold: number | null;
  sales_threshold_label: string;
  items: GiftPlanCommunicationItem[];
  tier_voucher_value: number | null;
  total_estimated_value_per_customer: number;
  gift_policy: string;
  notes: string;
  public_conditions: string;
}

export interface GiftPlanCommunicationReport {
  plan_id: string;
  campaign_name: string;
  campaign_year: number;
  campaign_headline: string;
  campaign_description: string;
  campaign_conditions: string;
  generated_at: string;
  tiers: GiftPlanCommunicationTier[];
}

export interface GiftPlanDraftSnapshot {
  payload: GiftPlanEditorPayload;
  saved_at: string;
  base_updated_at: string | null;
}

export interface PurchaseGroupCompatibilityIssue {
  field: "supplier" | "source" | "unit_actual_cost" | "specification";
  message: string;
}
