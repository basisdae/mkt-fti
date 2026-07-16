import {
  GIFT_ITEM_CATEGORY_LABELS,
  GIFT_ITEM_SOURCE_LABELS,
} from "@/lib/gift-plan-format";
import type { GiftCatalogStatus } from "@/types/gift-catalog";

export const GIFT_CATALOG_STATUS_LABELS: Record<GiftCatalogStatus, string> = {
  active: "ใช้งาน",
  inactive: "ปิดใช้งาน",
  archived: "เก็บถาวร",
};

/** Preset units — stored value stays English key; label is Thai. */
export const GIFT_CATALOG_UNIT_PRESETS = [
  { value: "piece", label: "ชิ้น" },
  { value: "set", label: "ชุด" },
  { value: "box", label: "กล่อง" },
  { value: "bag", label: "ใบ" },
  { value: "book", label: "เล่ม" },
  { value: "card", label: "ใบ" },
  { value: "voucher", label: "ใบ" },
  { value: "other", label: "อื่นๆ" },
] as const;

export const GIFT_CATALOG_UNIT_OTHER = "other";

export function giftCatalogUnitLabel(unit: string): string {
  const preset = GIFT_CATALOG_UNIT_PRESETS.find((u) => u.value === unit);
  return preset?.label ?? unit;
}

export function formatGiftCatalogCategory(
  category: keyof typeof GIFT_ITEM_CATEGORY_LABELS,
): string {
  return GIFT_ITEM_CATEGORY_LABELS[category];
}

export function formatGiftCatalogSource(
  source: keyof typeof GIFT_ITEM_SOURCE_LABELS,
): string {
  return GIFT_ITEM_SOURCE_LABELS[source];
}

export function truncateSupplierName(value: string | null, max = 24): string {
  const text = (value ?? "").trim();
  if (!text) return "—";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
