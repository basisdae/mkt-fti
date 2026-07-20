import {
  NAV_ITEM_BY_HREF,
  type NavItem,
} from "@/lib/constants";
import {
  NAV_PERMISSION_MAP,
  getDefaultPermissionsForRole,
  type PermissionKey,
} from "@/lib/auth/permission-catalog";
import {
  SIDEBAR_SECTION_DEFINITIONS,
  type SidebarSection,
} from "@/lib/nav/sidebar-config";
import {
  GIFT_PLAN_OPERATOR_PERMISSIONS,
  isGiftPlanOperatorEmail,
} from "@/lib/auth/gift-plan-operators";
import type { AppUser } from "@/types/auth";

type PermissionSource =
  | Pick<AppUser, "permissions" | "role" | "email">
  | PermissionKey[]
  | null
  | undefined;

const GIFT_PLAN_PERMISSION_KEYS = GIFT_PLAN_OPERATOR_PERMISSIONS as readonly PermissionKey[];

function permissionSet(source: PermissionSource): Set<PermissionKey> {
  if (!source) return new Set();
  if (Array.isArray(source)) return new Set(source);

  // Admin always has full access in app layer — matches gift_plan_can_view/edit() RLS.
  if (source.role === "admin") {
    return new Set(getDefaultPermissionsForRole("admin"));
  }

  // MKT HQ template includes Gift Plans; merge defaults so stale stored perms still work.
  if (source.role === "mkt_hq") {
    return new Set([
      ...getDefaultPermissionsForRole("mkt_hq"),
      ...(source.permissions ?? []),
    ]);
  }

  const perms = new Set(
    source.permissions?.length
      ? source.permissions
      : getDefaultPermissionsForRole(source.role),
  );

  if (source.email && isGiftPlanOperatorEmail(source.email)) {
    for (const key of GIFT_PLAN_PERMISSION_KEYS) {
      perms.add(key);
    }
  }

  return perms;
}

export function hasPermission(
  source: PermissionSource,
  key: PermissionKey,
): boolean {
  return permissionSet(source).has(key);
}

export function hasAnyPermission(
  source: PermissionSource,
  keys: PermissionKey[],
): boolean {
  const set = permissionSet(source);
  return keys.some((key) => set.has(key));
}

export function canManageUsers(source: PermissionSource): boolean {
  return hasPermission(source, "users.manage");
}

export function canEditProducts(source: PermissionSource): boolean {
  return hasPermission(source, "products.edit");
}

export function canCreateProducts(source: PermissionSource): boolean {
  return hasPermission(source, "products.create");
}

export function canDeleteProducts(source: PermissionSource): boolean {
  return hasPermission(source, "products.delete");
}

export function canExportProductResume(source: PermissionSource): boolean {
  return hasPermission(source, "products.export_resume");
}

export function canEditProductSpecs(source: PermissionSource): boolean {
  return hasPermission(source, "rnd.edit_spec");
}

export function canAccessRndSpecs(source: PermissionSource): boolean {
  return hasAnyPermission(source, ["rnd.view", "rnd.edit_spec"]);
}

export function canEditSuppliers(source: PermissionSource): boolean {
  return hasPermission(source, "suppliers.edit");
}

export function canCreateSuppliers(source: PermissionSource): boolean {
  return hasPermission(source, "suppliers.create");
}

export function canDeleteSuppliers(source: PermissionSource): boolean {
  return hasPermission(source, "suppliers.delete");
}

export function canExportCompanyProfile(source: PermissionSource): boolean {
  return hasPermission(source, "suppliers.company_profile");
}

export function canViewGiftPlans(source: PermissionSource): boolean {
  return hasPermission(source, "gift_plans.view");
}

export function canEditGiftPlans(source: PermissionSource): boolean {
  return hasPermission(source, "gift_plans.edit");
}

export function canExportGiftPlans(source: PermissionSource): boolean {
  return hasPermission(source, "gift_plans.export");
}

export function canViewSeminarPlanner(source: PermissionSource): boolean {
  return hasPermission(source, "seminar_planner.view");
}

export function canEditSeminarPlanner(source: PermissionSource): boolean {
  return hasPermission(source, "seminar_planner.edit");
}

export function canViewMonthlyPlan(source: PermissionSource): boolean {
  return hasPermission(source, "monthly_plan.view");
}

export function canEditMonthlyPlan(source: PermissionSource): boolean {
  return hasPermission(source, "monthly_plan.edit");
}

export function canAccessPath(
  source: PermissionSource,
  pathname: string,
): boolean {
  const perms = permissionSet(source);
  if (perms.size === 0) return false;

  const path = pathname.split("?")[0] || "/";

  if (path.startsWith("/settings/users")) {
    return perms.has("users.manage");
  }
  if (path.startsWith("/settings")) {
    return perms.has("settings.view") || perms.has("users.manage");
  }

  if (path === "/" || path === "/dashboard") {
    return perms.has("dashboard.view");
  }

  if (path === "/products/new") return perms.has("products.create");
  if (/^\/products\/[^/]+\/edit\/?$/.test(path)) {
    return perms.has("products.edit");
  }
  if (/^\/products\/[^/]+\/spec\/?$/.test(path)) {
    return perms.has("rnd.edit_spec");
  }
  if (path === "/products" || path.startsWith("/products/")) {
    return perms.has("products.view");
  }

  if (path === "/suppliers/new") return perms.has("suppliers.create");
  if (/^\/suppliers\/[^/]+\/edit\/?$/.test(path)) {
    return perms.has("suppliers.edit");
  }
  if (path === "/suppliers" || path.startsWith("/suppliers/")) {
    return perms.has("suppliers.view");
  }

  if (path.startsWith("/rnd")) {
    return perms.has("rnd.view") || perms.has("rnd.edit_spec");
  }
  if (path.startsWith("/pipeline")) return perms.has("pipeline.view");
  if (path.startsWith("/simulator")) return perms.has("simulator.view");
  if (path.startsWith("/timeline")) return perms.has("timeline.view");
  if (path.startsWith("/notes")) return perms.has("notes.view");
  if (path.startsWith("/ideas")) return perms.has("ideas.view");
  if (path.startsWith("/brand-board")) return perms.has("brand_board.view");

  if (path.startsWith("/gift-plans")) {
    return (
      perms.has("gift_plans.view") ||
      perms.has("gift_plans.edit") ||
      perms.has("gift_plans.export")
    );
  }

  if (path.startsWith("/seminars")) {
    return (
      perms.has("seminar_planner.view") || perms.has("seminar_planner.edit")
    );
  }

  if (path.startsWith("/monthly-plan")) {
    return (
      perms.has("monthly_plan.view") || perms.has("monthly_plan.edit")
    );
  }

  return false;
}

export function canAccessNavHref(
  href: string,
  perms: Set<PermissionKey>,
): boolean {
  if (href === "/settings") {
    return perms.has("settings.view") || perms.has("users.manage");
  }
  if (href === "/gift-plans") {
    return (
      perms.has("gift_plans.view") ||
      perms.has("gift_plans.edit") ||
      perms.has("gift_plans.export")
    );
  }
  if (href === "/seminars") {
    return (
      perms.has("seminar_planner.view") || perms.has("seminar_planner.edit")
    );
  }
  if (href === "/monthly-plan") {
    return (
      perms.has("monthly_plan.view") || perms.has("monthly_plan.edit")
    );
  }

  const required = NAV_PERMISSION_MAP[href];
  if (!required) return false;
  return perms.has(required);
}

export function getSidebarSectionsForUser(
  source: PermissionSource,
): SidebarSection[] {
  const perms = permissionSet(source);

  return SIDEBAR_SECTION_DEFINITIONS.flatMap((section) => {
    const items = section.hrefs
      .map((href) => NAV_ITEM_BY_HREF.get(href))
      .filter((item): item is NavItem => Boolean(item))
      .filter((item) => canAccessNavHref(item.href, perms));

    if (items.length === 0) return [];

    return [{ id: section.id, label: section.label, items }];
  });
}

export function getNavItemsForUser(
  source: PermissionSource,
): { label: string; items: NavItem[] }[] {
  const sections = getSidebarSectionsForUser(source);
  if (sections.length === 0) return [];
  return sections.map((section) => ({
    label: section.label,
    items: section.items,
  }));
}

export function getHomePathForUser(source: PermissionSource): string {
  const perms = permissionSet(source);
  if (perms.has("dashboard.view")) return "/dashboard";
  if (perms.has("suppliers.view") && !perms.has("products.edit")) {
    return "/suppliers";
  }
  if (perms.has("products.view")) return "/products";
  if (perms.has("suppliers.view")) return "/suppliers";
  if (perms.has("timeline.view")) return "/timeline";
  if (perms.has("gift_plans.view")) return "/gift-plans";
  if (perms.has("seminar_planner.view")) return "/seminars";
  if (perms.has("monthly_plan.view")) return "/monthly-plan";
  if (perms.has("settings.view") || perms.has("users.manage")) {
    return "/settings";
  }
  return "/dashboard";
}
