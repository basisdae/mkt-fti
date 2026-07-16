/** Primary operators with full Gift Plans access (view + edit + export). */
export const PRIMARY_ADMIN_EMAIL = "mkt.dir@functioninter.co.th";
export const PRIMARY_MKT_SUPPORT_EMAIL = "mkt.support@functioninter.co.th";

export const GIFT_PLAN_OPERATOR_EMAILS = [
  PRIMARY_ADMIN_EMAIL,
  PRIMARY_MKT_SUPPORT_EMAIL,
] as const;

export type GiftPlanOperatorEmail = (typeof GIFT_PLAN_OPERATOR_EMAILS)[number];

export function normalizeOperatorEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isGiftPlanOperatorEmail(email: string): boolean {
  const normalized = normalizeOperatorEmail(email);
  return (GIFT_PLAN_OPERATOR_EMAILS as readonly string[]).includes(normalized);
}

export const GIFT_PLAN_OPERATOR_PERMISSIONS = [
  "gift_plans.view",
  "gift_plans.edit",
  "gift_plans.export",
] as const;
