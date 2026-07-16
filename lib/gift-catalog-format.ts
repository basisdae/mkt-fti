import {
  GIFT_ITEM_CATEGORY_LABELS,
  GIFT_ITEM_SOURCE_LABELS,
} from "@/lib/gift-plan-format";
import type {
  GiftCatalogOperationalStatus,
  GiftCatalogStatus,
} from "@/types/gift-catalog";

export const GIFT_CATALOG_STATUS_LABELS: Record<GiftCatalogStatus, string> = {
  active: "ใช้งาน",
  inactive: "ปิดใช้งาน",
  archived: "เก็บถาวร",
};

export const GIFT_CATALOG_OPERATIONAL_LABELS: Record<
  GiftCatalogOperationalStatus,
  string
> = {
  interested: "สนใจ",
  in_progress: "อยู่ในกระบวนการ",
  ordered: "สั่งแล้ว",
  blocked: "ขัดข้อง",
  completed: "เสร็จสิ้น",
  received: "รับของแล้ว",
};

/** Muted badge styles — light background, readable text, no neon. */
export const GIFT_CATALOG_OPERATIONAL_BADGE: Record<
  GiftCatalogOperationalStatus,
  string
> = {
  interested: "bg-slate-100 text-slate-600",
  in_progress: "bg-amber-50 text-amber-800",
  ordered: "bg-violet-50 text-violet-700",
  blocked: "bg-rose-50 text-rose-700",
  completed: "bg-teal-50 text-teal-800",
  received: "bg-emerald-50 text-emerald-800",
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

export function formatOperationalStatus(
  status: GiftCatalogOperationalStatus | string | null | undefined,
): string {
  if (!status) return GIFT_CATALOG_OPERATIONAL_LABELS.interested;
  const key = status as GiftCatalogOperationalStatus;
  return GIFT_CATALOG_OPERATIONAL_LABELS[key] ?? status;
}

export function operationalBadgeClass(
  status: GiftCatalogOperationalStatus | string | null | undefined,
): string {
  const key = (status ?? "interested") as GiftCatalogOperationalStatus;
  return (
    GIFT_CATALOG_OPERATIONAL_BADGE[key] ??
    GIFT_CATALOG_OPERATIONAL_BADGE.interested
  );
}

export function truncateSupplierName(value: string | null, max = 24): string {
  const text = (value ?? "").trim();
  if (!text) return "—";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
