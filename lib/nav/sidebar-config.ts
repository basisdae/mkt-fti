import type { NavItem } from "@/lib/constants";

/** Stable section ids — used for collapse state in localStorage. */
export type SidebarSectionId =
  | "overview"
  | "products"
  | "purchasing"
  | "marketing"
  | "development"
  | "system";

export interface SidebarSectionDefinition {
  id: SidebarSectionId;
  label: string;
  /** Nav hrefs in display order — must match existing routes. */
  hrefs: readonly string[];
}

/**
 * Sidebar hierarchy (routes unchanged).
 * Factory & Support sections omitted — no dedicated nav routes with permissions yet.
 */
export const SIDEBAR_SECTION_DEFINITIONS: readonly SidebarSectionDefinition[] = [
  {
    id: "overview",
    label: "ภาพรวม",
    hrefs: ["/dashboard", "/monthly-plan"],
  },
  {
    id: "products",
    label: "สินค้า",
    hrefs: ["/products", "/rnd/specs", "/brand-board", "/simulator"],
  },
  {
    id: "purchasing",
    label: "จัดซื้อ",
    hrefs: ["/suppliers", "/pipeline", "/timeline"],
  },
  {
    id: "marketing",
    label: "งานการตลาด",
    hrefs: ["/gift-plans", "/seminars"],
  },
  {
    id: "development",
    label: "งานพัฒนา",
    hrefs: ["/ideas", "/notes"],
  },
  {
    id: "system",
    label: "ระบบ",
    hrefs: ["/settings"],
  },
] as const;

export interface SidebarSection {
  id: SidebarSectionId;
  label: string;
  items: NavItem[];
}

export function navItemMatchesPath(item: NavItem, pathname: string): boolean {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function sectionIsActive(section: SidebarSection, pathname: string): boolean {
  return section.items.some((item) => navItemMatchesPath(item, pathname));
}

export function sumSectionBadgeCounts(section: SidebarSection): number {
  return section.items.reduce((sum, item) => sum + (item.badgeCount ?? 0), 0);
}
