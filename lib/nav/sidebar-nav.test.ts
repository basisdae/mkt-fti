import assert from "node:assert/strict";
import {
  canAccessNavHref,
  getSidebarSectionsForUser,
} from "@/lib/auth/permissions";
import { getDefaultPermissionsForRole } from "@/lib/auth/permission-catalog";
import { PRIMARY_MKT_SUPPORT_EMAIL } from "@/lib/auth/gift-plan-operators";
import { SIDEBAR_SECTION_DEFINITIONS } from "@/lib/nav/sidebar-config";
import type { AppUser } from "@/types/auth";
import type { PermissionKey } from "@/lib/auth/permission-catalog";

function user(role: AppUser["role"], email: string): AppUser {
  return {
    id: `user-${role}`,
    email,
    displayName: role,
    role,
    permissions: getDefaultPermissionsForRole(role),
  };
}

function sectionIdsFor(source: AppUser) {
  return getSidebarSectionsForUser(source).map((section) => section.id);
}

function sectionHrefs(source: AppUser, sectionId: string) {
  const section = getSidebarSectionsForUser(source).find(
    (entry) => entry.id === sectionId,
  );
  return section?.items.map((item) => item.href) ?? [];
}

const admin = user("admin", "mkt.dir@functioninter.co.th");
const mktHq = user("mkt_hq", "mkt@fti.co.th");
const mktSupport = user("mkt_hq", PRIMARY_MKT_SUPPORT_EMAIL);
const rnd = user("rnd", "rnd@fti.co.th");
const sale = user("sale", "sale@fti.co.th");
const pu = user("pu", "pu@fti.co.th");
const ceo = user("ceo", "ceo@fti.co.th");

assert.deepEqual(sectionIdsFor(admin), [
  "overview",
  "products",
  "purchasing",
  "marketing",
  "development",
  "system",
]);

assert.deepEqual(sectionHrefs(mktHq, "overview"), [
  "/dashboard",
  "/monthly-plan",
]);
assert.deepEqual(sectionHrefs(mktHq, "products"), [
  "/products",
  "/rnd/specs",
  "/brand-board",
  "/simulator",
]);
assert.deepEqual(sectionHrefs(mktHq, "purchasing"), [
  "/suppliers",
  "/pipeline",
  "/timeline",
]);
assert.deepEqual(sectionHrefs(mktSupport, "marketing"), ["/gift-plans"]);

assert(!sectionIdsFor(rnd).includes("marketing"));
assert.deepEqual(sectionHrefs(rnd, "development"), ["/ideas", "/notes"]);
assert(!sectionHrefs(rnd, "purchasing").includes("/notes"));

assert(sectionIdsFor(pu).includes("overview"));
assert.deepEqual(sectionHrefs(pu, "overview"), ["/dashboard"]);
assert(!sectionHrefs(pu, "overview").includes("/monthly-plan"));

assert.deepEqual(sectionHrefs(pu, "purchasing"), [
  "/suppliers",
  "/timeline",
]);
assert(!sectionHrefs(pu, "purchasing").includes("/pipeline"));
assert(!sectionHrefs(rnd, "overview").includes("/monthly-plan"));
assert(!sectionHrefs(sale, "overview").includes("/monthly-plan"));
assert(sectionHrefs(ceo, "overview").includes("/monthly-plan"));

const perms = new Set<PermissionKey>(getDefaultPermissionsForRole("mkt_hq"));
assert.equal(canAccessNavHref("/gift-plans", perms), true);
assert.equal(canAccessNavHref("/seminars", perms), false);

assert.equal(SIDEBAR_SECTION_DEFINITIONS.length, 6);
assert.equal(
  SIDEBAR_SECTION_DEFINITIONS.some((section) => section.id === "purchasing"),
  true,
);

console.log("sidebar-nav: all assertions passed");
