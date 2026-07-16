import type {
  GiftItemCategory,
  GiftItemSource,
  GiftPlanStatus,
} from "@/types/gift-plan";

export const GIFT_PLAN_STATUS_LABELS: Record<GiftPlanStatus, string> = {
  draft: "แบบร่าง",
  review: "ตรวจสอบ",
  approved: "อนุมัติแล้ว",
  preparing: "กำลังจัดเตรียม",
  completed: "เสร็จสิ้น",
};

export const GIFT_ITEM_CATEGORY_LABELS: Record<GiftItemCategory, string> = {
  gift_voucher: "บัตรกำนัล / Voucher",
  premium_gift: "ของพรีเมียม",
  certificate: "ใบประกาศ / Certificate",
  product: "สินค้า",
  sales_gift: "ของแจกจากฝ่ายขาย",
  executive_gift: "ของขวัญผู้บริหาร",
  other: "อื่นๆ",
};

export const GIFT_ITEM_SOURCE_LABELS: Record<GiftItemSource, string> = {
  marketing: "ฝ่ายการตลาด",
  sales: "ฝ่ายขาย",
  executive: "ผู้บริหาร",
  fti_stock: "สต๊อก FTI",
  external_purchase: "จัดซื้อภายนอก",
  other: "อื่นๆ",
};

export function formatGiftMoney(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatGiftPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}%`;
}

export function formatGiftQty(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}
