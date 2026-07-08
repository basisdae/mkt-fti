/**
 * Notification Center — client-only mock feed from live app data.
 * Read state is localStorage only; no backend.
 */
import { hasProductSpecification } from "@/lib/product-specification";
import { listSalesProjects } from "@/lib/sales-projects";
import type { ProductView } from "@/types/product";
import type { Supplier } from "@/types/supplier";

export const NOTIFICATION_READS_KEY = "mkt_hq_notification_reads";
export const NOTIFICATION_READS_EVENT = "mkt-hq-notification-reads-changed";

export type NotificationLevel = "info" | "warning" | "success";

export interface AppNotification {
  id: string;
  level: NotificationLevel;
  title: string;
  body: string;
  href?: string;
  createdAt: string;
}

interface NotificationReadsState {
  /** Notification ids marked read. */
  readIds: string[];
  /** Anything at or before this timestamp is treated as read. */
  markAllReadAt: string | null;
}

const EMPTY_READS: NotificationReadsState = {
  readIds: [],
  markAllReadAt: null,
};

const MAX_PER_KIND = 3;

function canUseStorage(): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const probe = "__mkt_hq_notif_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function readReadsState(): NotificationReadsState {
  if (!canUseStorage()) return { ...EMPTY_READS, readIds: [] };
  try {
    const raw = window.localStorage.getItem(NOTIFICATION_READS_KEY);
    if (!raw) return { readIds: [], markAllReadAt: null };
    const parsed = JSON.parse(raw) as Partial<NotificationReadsState>;
    return {
      readIds: Array.isArray(parsed.readIds)
        ? parsed.readIds.filter((id) => typeof id === "string")
        : [],
      markAllReadAt:
        typeof parsed.markAllReadAt === "string" ? parsed.markAllReadAt : null,
    };
  } catch {
    return { readIds: [], markAllReadAt: null };
  }
}

function writeReadsState(state: NotificationReadsState): boolean {
  if (!canUseStorage()) return false;
  try {
    window.localStorage.setItem(NOTIFICATION_READS_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event(NOTIFICATION_READS_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function getNotificationReads(): NotificationReadsState {
  return readReadsState();
}

export function isNotificationRead(
  notification: Pick<AppNotification, "id" | "createdAt">,
  reads: NotificationReadsState = readReadsState(),
): boolean {
  if (reads.readIds.includes(notification.id)) return true;
  if (
    reads.markAllReadAt &&
    new Date(notification.createdAt).getTime() <=
      new Date(reads.markAllReadAt).getTime()
  ) {
    return true;
  }
  return false;
}

export function markNotificationRead(id: string): void {
  const state = readReadsState();
  if (state.readIds.includes(id)) return;
  writeReadsState({
    ...state,
    readIds: [...state.readIds, id],
  });
}

export function markAllNotificationsRead(now = new Date().toISOString()): void {
  writeReadsState({
    readIds: [],
    markAllReadAt: now,
  });
}

function productHasImages(product: ProductView): boolean {
  if (product.imageUrl?.trim()) return true;
  return (product.images?.length ?? 0) > 0;
}

function productHasCertificates(product: ProductView): boolean {
  const cert = product.certification;
  if (!cert) return false;
  if ((cert.certifications ?? []).some((value) => value.trim())) return true;
  if ((cert.iso ?? []).some((value) => value.trim())) return true;
  if (cert.iso1?.trim() || cert.iso2?.trim() || cert.iso3?.trim()) return true;
  return false;
}

function productNeedsResume(product: ProductView): boolean {
  if (!hasProductSpecification(product.specification)) return true;
  return product.specStatus !== "completed";
}

function sortByDateDesc<T>(items: T[], getDate: (item: T) => string): T[] {
  return [...items].sort(
    (a, b) =>
      new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime(),
  );
}

/**
 * Build a read-only notification feed from products, suppliers, and local plans.
 */
export function buildNotifications(
  products: ProductView[],
  suppliers: Supplier[],
): AppNotification[] {
  const items: AppNotification[] = [];

  for (const product of sortByDateDesc(products, (p) => p.updatedAt)
    .filter((product) => !productHasImages(product))
    .slice(0, MAX_PER_KIND)) {
    items.push({
      id: `need-images:${product.id}`,
      level: "warning",
      title: "Need Images",
      body: `${product.name} is missing a cover or gallery image.`,
      href: `/products/${product.id}/edit`,
      createdAt: product.updatedAt,
    });
  }

  for (const product of sortByDateDesc(products, (p) => p.updatedAt)
    .filter((product) => !productHasCertificates(product))
    .slice(0, MAX_PER_KIND)) {
    items.push({
      id: `need-certificate:${product.id}`,
      level: "warning",
      title: "Need Certificate",
      body: `${product.name} has no ISO or product certificates on file.`,
      href: `/products/${product.id}/edit`,
      createdAt: product.updatedAt,
    });
  }

  for (const product of sortByDateDesc(products, (p) => p.updatedAt)
    .filter(productNeedsResume)
    .slice(0, MAX_PER_KIND)) {
    items.push({
      id: `need-resume:${product.id}`,
      level: "warning",
      title: "Need Resume",
      body: `${product.name} needs a completed specification for resume export.`,
      href: `/products/${product.id}/spec`,
      createdAt: product.updatedAt,
    });
  }

  for (const supplier of sortByDateDesc(suppliers, (s) => s.updatedAt).slice(
    0,
    MAX_PER_KIND,
  )) {
    items.push({
      id: `supplier-updated:${supplier.id}:${supplier.updatedAt}`,
      level: "info",
      title: "Supplier Updated",
      body: `${supplier.displayName || supplier.factoryName} profile was updated.`,
      href: `/suppliers/${supplier.id}`,
      createdAt: supplier.updatedAt,
    });
  }

  for (const project of sortByDateDesc(listSalesProjects(), (p) => p.updatedAt)
    .slice(0, MAX_PER_KIND)) {
    items.push({
      id: `simulator-saved:${project.id}:${project.updatedAt}`,
      level: "success",
      title: "Simulator Saved",
      body: `Sales plan “${project.name}” was saved locally.`,
      href: `/simulator/${project.id}`,
      createdAt: project.updatedAt,
    });
  }

  // Static success example — import is UI-only and does not write data.
  items.push({
    id: "import-completed:demo",
    level: "success",
    title: "Import Completed",
    body: "Product import preview finished. No rows were written (read-only demo).",
    href: "/products/import",
    createdAt: "2026-07-01T09:00:00.000Z",
  });

  return items.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function formatNotificationTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < minute) return "Just now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}d ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
