import {
  canAccessPath,
  canEditMonthlyPlan,
  canViewMonthlyPlan,
} from "@/lib/auth/permissions";
import { getDefaultPermissionsForRole } from "@/lib/auth/permission-catalog";
import type { AppUser } from "@/types/auth";

function user(role: AppUser["role"], email: string): AppUser {
  return {
    id: "test",
    email,
    displayName: "Test",
    role,
    permissions: getDefaultPermissionsForRole(role),
  };
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const admin = user("admin", "admin@fti.co.th");
const mktHq = user("mkt_hq", "mkt@fti.co.th");
const ceo = user("ceo", "ceo@fti.co.th");
const rnd = user("rnd", "rnd@fti.co.th");
const sale = user("sale", "sale@fti.co.th");
const pu = user("pu", "pu@fti.co.th");

assert(canViewMonthlyPlan(admin), "admin can view");
assert(canEditMonthlyPlan(admin), "admin can edit");
assert(canViewMonthlyPlan(mktHq), "mkt_hq can view");
assert(canEditMonthlyPlan(mktHq), "mkt_hq can edit");
assert(canViewMonthlyPlan(ceo), "ceo can view");
assert(canEditMonthlyPlan(ceo), "ceo can edit monthly plan");
assert(!canViewMonthlyPlan(rnd), "rnd blocked");
assert(!canViewMonthlyPlan(sale), "sale blocked");
assert(!canViewMonthlyPlan(pu), "pu blocked");

assert(canAccessPath(mktHq, "/monthly-plan"), "mkt_hq path");
assert(canAccessPath(mktHq, "/monthly-plan/00000000-0000-0000-0000-000000000001"), "detail path");
assert(!canAccessPath(rnd, "/monthly-plan"), "rnd path blocked");
assert(!canAccessPath(sale, "/monthly-plan"), "sale path blocked");
assert(!canAccessPath(pu, "/monthly-plan"), "pu path blocked");

console.log("monthly-plan-permissions: all assertions passed");
