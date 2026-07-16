import type { GiftItemCategory, GiftItemSource } from "@/types/gift-plan";

export const GIFT_CATALOG_STATUSES = ["active", "inactive", "archived"] as const;
export type GiftCatalogStatus = (typeof GIFT_CATALOG_STATUSES)[number];

export interface GiftCatalogRow {
  id: string;
  gift_name: string;
  internal_code: string | null;
  category: GiftItemCategory;
  source: GiftItemSource;
  description: string;
  image_url: string | null;
  unit: string;
  default_actual_cost: number;
  default_estimated_gift_value: number;
  supplier_name: string | null;
  specification: string;
  notes: string;
  status: GiftCatalogStatus;
  created_at: string;
  updated_at: string;
  created_by_email: string | null;
  updated_by_email: string | null;
}

export interface GiftCatalogInput {
  gift_name: string;
  internal_code: string | null;
  category: GiftItemCategory;
  source: GiftItemSource;
  description: string;
  image_url: string | null;
  unit: string;
  default_actual_cost: number;
  default_estimated_gift_value: number;
  supplier_name: string | null;
  specification: string;
  notes: string;
  status: GiftCatalogStatus;
}

export type GiftCatalogSortKey =
  | "name"
  | "updated"
  | "actual_cost"
  | "estimated_value";
