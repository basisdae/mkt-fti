import type { AppRole } from "@/types/auth";

export const APP_ROLES: AppRole[] = [
  "mkt_hq",
  "rnd",
  "admin",
  "ceo",
  "sale",
  "pu",
];

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  mkt_hq: "MKT HQ",
  rnd: "R&D",
  admin: "Admin",
  ceo: "CEO",
  sale: "SALE",
  pu: "Purchasing",
};

export function formatAppRole(role: AppRole | null | undefined): string {
  if (!role) return "—";
  return APP_ROLE_LABELS[role] ?? role;
}

export function isAppRole(value: string): value is AppRole {
  return APP_ROLES.includes(value as AppRole);
}
