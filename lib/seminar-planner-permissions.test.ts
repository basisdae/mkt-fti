import {
  canAccessPath,
  canEditSeminarPlanner,
  canViewSeminarPlanner,
} from "@/lib/auth/permissions";
import { getDefaultPermissionsForRole } from "@/lib/auth/permission-catalog";
import type { AppUser } from "@/types/auth";

function user(
  role: AppUser["role"],
  email: string,
  permissions?: AppUser["permissions"],
): AppUser {
  return {
    id: "test",
    email,
    displayName: "Test",
    role,
    permissions: permissions ?? getDefaultPermissionsForRole(role),
  };
}

const admin = user("admin", "mkt.dir@functioninter.co.th");
const mktSupport = user("mkt_hq", "mkt.support@functioninter.co.th", [
  ...getDefaultPermissionsForRole("mkt_hq"),
  "seminar_planner.view",
  "seminar_planner.edit",
]);
const mktHqGeneric = user("mkt_hq", "mkt@fti.co.th");
const rnd = user("rnd", "rnd@fti.co.th");

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(canViewSeminarPlanner(admin), "admin can view seminars");
assert(canEditSeminarPlanner(admin), "admin can edit seminars");
assert(canViewSeminarPlanner(mktSupport), "mkt.support with perms can view");
assert(canEditSeminarPlanner(mktSupport), "mkt.support with perms can edit");
assert(!canViewSeminarPlanner(mktHqGeneric), "generic mkt_hq cannot view");
assert(!canEditSeminarPlanner(mktHqGeneric), "generic mkt_hq cannot edit");
assert(!canViewSeminarPlanner(rnd), "rnd cannot view");
assert(canAccessPath(admin, "/seminars"), "admin path ok");
assert(canAccessPath(admin, "/seminars/00000000-0000-0000-0000-000000000001"), "admin detail path ok");
assert(canAccessPath(mktSupport, "/seminars/library"), "support library path ok");
assert(!canAccessPath(rnd, "/seminars"), "rnd blocked from /seminars");
assert(!canAccessPath(rnd, "/seminars/00000000-0000-0000-0000-000000000001"), "rnd blocked from detail");

console.log("seminar-planner-permissions: all assertions passed");
