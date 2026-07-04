import type { AppRole } from "@/types/auth";

/**
 * Pre-created accounts (no self-registration).
 * Admin can add more via local registry or Supabase Auth + app_profiles.
 */
export interface SeedUserRecord {
  id: string;
  email: string;
  password: string;
  displayName: string;
  role: AppRole;
}

export const SEED_USERS: SeedUserRecord[] = [
  {
    id: "user-admin",
    email: "admin@fti.co.th",
    password: "admin123",
    displayName: "System Admin",
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
];
