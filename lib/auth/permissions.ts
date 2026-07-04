import {
  MAIN_NAV_ITEMS,
  SECONDARY_NAV_ITEMS,
  type NavItem,
} from "@/lib/constants";
import {
  NAV_PERMISSION_MAP,
  type PermissionKey,
} from "@/lib/auth/permission-catalog";
import type { AppUser } from "@/types/auth";

type PermissionSource =
  | Pick<AppUser, "permissions">
  | PermissionKey[]
  | null
  | undefined;

function permissionSet(source: PermissionSource): Set<PermissionKey> {
  if (!source) return new Set();
  const list = Array.isArray(source) ? source : source.permissions;
  return new Set(list ?? []);
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

  return false;
}

export function getNavItemsForUser(
  source: PermissionSource,
): { label: string; items: NavItem[] }[] {
  const perms = permissionSet(source);
  const allItems = [...MAIN_NAV_ITEMS, ...SECONDARY_NAV_ITEMS];
  const items = allItems.filter((item) => {
    const required = NAV_PERMISSION_MAP[item.href];
    if (!required) return false;
    if (item.href === "/settings") {
      return perms.has("settings.view") || perms.has("users.manage");
    }
    return perms.has(required);
  });

  if (items.length === 0) return [];
  return [{ label: "Menu", items }];
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
  if (perms.has("settings.view") || perms.has("users.manage")) {
    return "/settings";
  }
  return "/dashboard";
}
