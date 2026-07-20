import type { GiftItemCategory, GiftItemSource } from "@/types/gift-plan";

/** Record status — stored in column `status` (not archive workflow). */
export const GIFT_CATALOG_STATUSES = ["active", "inactive", "archived"] as const;
export type GiftCatalogStatus = (typeof GIFT_CATALOG_STATUSES)[number];

/** Operational / procurement status — separate from record status. */
export const GIFT_CATALOG_OPERATIONAL_STATUSES = [
  "interested",
  "in_progress",
  "ordered",
  "blocked",
  "completed",
  "received",
] as const;
export type GiftCatalogOperationalStatus =
  (typeof GIFT_CATALOG_OPERATIONAL_STATUSES)[number];

export interface GiftCatalogRow {
  id: string;
  gift_name: string;
  internal_code: string | null;
  category: GiftItemCategory;
  source: GiftItemSource;
  description: string;
  image_url: string | null;
  image_path: string | null;
  reference_url: string | null;
  unit: string;
  default_actual_cost: number;
  default_estimated_gift_value: number;
  supplier_name: string | null;
  specification: string;
  notes: string;
  /** Record status (active / inactive / archived). */
  status: GiftCatalogStatus;
  operational_status: GiftCatalogOperationalStatus;
  sort_order: number;
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
  image_path: string | null;
  reference_url: string | null;
  unit: string;
  default_actual_cost: number;
  default_estimated_gift_value: number;
  supplier_name: string | null;
  specification: string;
  notes: string;
  status: GiftCatalogStatus;
  operational_status: GiftCatalogOperationalStatus;
}

export type GiftCatalogSortKey =
  | "manual"
  | "name"
  | "updated"
  | "actual_cost"
  | "estimated_value";

export type GiftCatalogOperationalFilter =
  | "all"
  | GiftCatalogOperationalStatus;
