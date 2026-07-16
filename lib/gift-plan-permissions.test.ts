import assert from "node:assert/strict";
import {
  canAccessPath,
  canEditGiftPlans,
  canExportGiftPlans,
  canViewGiftPlans,
} from "@/lib/auth/permissions";
import { getDefaultPermissionsForRole } from "@/lib/auth/permission-catalog";
import type { AppUser } from "@/types/auth";

function user(role: AppUser["role"], email: string): AppUser {
  return {
    id: `user-${role}`,
    email,
    displayName: role,
    role,
    permissions: getDefaultPermissionsForRole(role),
  };
}

const mktHq = user("mkt_hq", "mkt@fti.co.th");
const admin = user("admin", "mkt.dir@functioninter.co.th");
const rnd = user("rnd", "rnd@fti.co.th");
const sale = user("sale", "sale@fti.co.th");

assert.equal(canViewGiftPlans(mktHq), true);
assert.equal(canEditGiftPlans(mktHq), true);
assert.equal(canExportGiftPlans(mktHq), true);
assert.equal(canAccessPath(mktHq, "/gift-plans"), true);
assert.equal(canAccessPath(mktHq, "/gift-plans/catalog"), true);

assert.equal(canViewGiftPlans(admin), true);
assert.equal(canEditGiftPlans(admin), true);
assert.equal(canAccessPath(admin, "/gift-plans"), true);

const adminLegacyPerms: AppUser = {
  id: "user-system-admin",
  email: "mkt.dir@functioninter.co.th",
  displayName: "System Administrator",
  role: "admin",
  permissions: getDefaultPermissionsForRole("admin").filter(
    (key) => !key.startsWith("gift_plans."),
  ),
};
assert.equal(canViewGiftPlans(adminLegacyPerms), true);
assert.equal(canAccessPath(adminLegacyPerms, "/gift-plans"), true);
assert.equal(canAccessPath(adminLegacyPerms, "/gift-plans/catalog"), true);

assert.equal(canViewGiftPlans(rnd), false);
assert.equal(canEditGiftPlans(rnd), false);
assert.equal(canAccessPath(rnd, "/gift-plans"), false);
assert.equal(canAccessPath(rnd, "/gift-plans/catalog"), false);

assert.equal(canViewGiftPlans(sale), false);
assert.equal(canAccessPath(sale, "/gift-plans"), false);

console.log("gift-plan-permissions.test.ts: all assertions passed");
