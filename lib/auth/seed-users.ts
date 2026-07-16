import type { AppRole } from "@/types/auth";

/**
 * Default accounts seeded into Supabase `app_users` only when missing.
 * Never overwrites existing users, products, or suppliers.
 */
export interface SeedUserRecord {
  id: string;
  email: string;
  password: string;
  displayName: string;
  role: AppRole;
  isActive?: boolean;
  lastLoginAt?: string | null;
}

/** Former demo admin — removed from seed; stripped from local overrides on load. */
export const LEGACY_DEMO_ADMIN_EMAIL = "admin@fti.co.th";

export const SEED_USERS: SeedUserRecord[] = [
  {
    id: "user-system-admin",
    email: "mkt.dir@functioninter.co.th",
    password: "vtwigsiv1",
    displayName: "System Administrator",
    role: "admin",
  },
  {
    id: "user-mkt-hq",
    email: "mkt@fti.co.th",
    password: "mkt123",
    displayName: "MKT HQ",
    role: "mkt_hq",
  },
  {
    id: "user-rnd",
    email: "rnd@fti.co.th",
    password: "rnd123",
    displayName: "R&D Team",
    role: "rnd",
  },
  {
    id: "user-ceo",
    email: "ceo@fti.co.th",
    password: "ceo123",
    displayName: "CEO",
    role: "ceo",
  },
  {
    id: "user-sale",
    email: "sale@fti.co.th",
    password: "sale123",
    displayName: "Sales Team",
    role: "sale",
  },
  {
    id: "user-pu",
    email: "pu@fti.co.th",
    password: "pu123",
    displayName: "Purchasing",
    role: "pu",
  },
];
