/**
 * Recently viewed items — localStorage only.
 */
export const RECENTLY_VIEWED_KEY = "mkt_hq_recently_viewed";
export const RECENTLY_VIEWED_EVENT = "mkt-hq-recently-viewed-changed";
export const RECENTLY_VIEWED_LIMIT = 20;

export type RecentEntityType = "product" | "supplier" | "factory";

export interface RecentViewItem {
  id: string;
  entityType: RecentEntityType;
  entityId: string;
  name: string;
  imageUrl?: string | null;
  viewedAt: string;
  href: string;
}

function canUseStorage(): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const probe = "__mkt_hq_recent_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function readAll(): RecentViewItem[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentViewItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: RecentViewItem[]): boolean {
  if (!canUseStorage()) return false;
  try {
    window.localStorage.setItem(
      RECENTLY_VIEWED_KEY,
      JSON.stringify(items.slice(0, RECENTLY_VIEWED_LIMIT)),
    );
    window.dispatchEvent(new Event(RECENTLY_VIEWED_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function listRecentlyViewed(): RecentViewItem[] {
  return readAll().sort(
    (a, b) =>
      new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime(),
  );
}

export function trackRecentlyViewed(input: {
  entityType: RecentEntityType;
  entityId: string;
  name: string;
  imageUrl?: string | null;
  href: string;
}): void {
  const now = new Date().toISOString();
  const entryId = `${input.entityType}:${input.entityId}`;
  const prev = readAll().filter((item) => item.id !== entryId);
  const next: RecentViewItem = {
    id: entryId,
    entityType: input.entityType,
    entityId: input.entityId,
    name: input.name,
    imageUrl: input.imageUrl ?? null,
    viewedAt: now,
    href: input.href,
  };
  writeAll([next, ...prev]);
}
