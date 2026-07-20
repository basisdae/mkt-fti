export const SIDEBAR_COLLAPSE_STORAGE_KEY = "mkt-fti-sidebar-collapsed";

export type SidebarCollapseState = Record<string, boolean>;

function canUseDom(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function readSidebarCollapseState(): SidebarCollapseState {
  if (!canUseDom()) return {};
  try {
    const raw = localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SidebarCollapseState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeSidebarCollapseState(state: SidebarCollapseState): void {
  if (!canUseDom()) return;
  localStorage.setItem(SIDEBAR_COLLAPSE_STORAGE_KEY, JSON.stringify(state));
}

export function isSidebarSectionCollapsed(
  state: SidebarCollapseState,
  sectionId: string,
): boolean {
  return state[sectionId] === true;
}
