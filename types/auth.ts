export type AppRole = "mkt_hq" | "rnd" | "admin" | "ceo" | "sale";

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  role: AppRole;
}

export interface AuthSession {
  user: AppUser;
  loggedInAt: string;
}
