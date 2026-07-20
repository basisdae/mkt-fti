/** Display labels for session categories (DB `category_name` stays English). */
export const SEMINAR_CATEGORY_LABELS: Record<string, string> = {
  "Corporate Update": "อัปเดตองค์กร",
  Product: "สินค้า",
  "Membership & Digital": "สมาชิก",
  "Sales & Marketing": "ขายและการตลาด",
  "Branch Sharing": "แบ่งปันจากสาขา",
  "Voice of Customer": "เสียงจากลูกค้า",
  Interactive: "กิจกรรมมีส่วนร่วม",
  Recognition: "การยกย่อง",
  Entertainment: "บันเทิง",
  Logistics: "สนับสนุนงาน",
};

export function formatSeminarCategoryLabel(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return SEMINAR_CATEGORY_LABELS[trimmed] ?? trimmed;
}

/** Show workflow status on card only when it adds information beyond Confirmed. */
export function shouldShowSessionStatusOnCard(
  statusName: string | null | undefined,
): boolean {
  const trimmed = statusName?.trim();
  if (!trimmed) return false;
  return trimmed !== "Confirmed";
}
