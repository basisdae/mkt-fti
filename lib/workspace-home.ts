/**
 * Workspace Home — client-side daily-work feed from existing app data.
 * No backend; read-only composition helpers.
 */
import { getLatestProducts } from "@/lib/dashboard-summary";
import {
  buildNotifications,
  formatNotificationTime,
  getNotificationReads,
  isNotificationRead,
  type AppNotification,
} from "@/lib/notifications";
import { hasProductSpecification } from "@/lib/product-specification";
import {
  listSalesProjects,
  loadSalesProjectDraft,
  type SalesPlanProjectDraft,
} from "@/lib/sales-projects";
import type { RecentViewItem } from "@/lib/recently-viewed";
import type { ProductView } from "@/types/product";
import type { Supplier } from "@/types/supplier";

export interface WorkspaceTask {
  id: string;
  title: string;
  detail: string;
  href: string;
  tone: "warning" | "info" | "neutral";
}

export interface WorkspaceAttentionItem {
  id: string;
  title: string;
  detail: string;
  href: string;
}

export interface WorkspaceListItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  imageUrl?: string | null;
  meta?: string;
}

const PIPELINE_TASK_STATUSES = new Set([
  "waiting_moq",
  "sample_testing",
  "certification",
  "purchase_approved",
]);

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

export function buildWorkspaceTasks(products: ProductView[]): WorkspaceTask[] {
  const tasks: WorkspaceTask[] = [];

  for (const product of products) {
    if (!productHasImages(product)) {
      tasks.push({
        id: `task-images:${product.id}`,
        title: "Add product images",
        detail: product.name,
        href: `/products/${product.id}/edit`,
        tone: "warning",
      });
    }
    if (!productHasCertificates(product)) {
      tasks.push({
        id: `task-cert:${product.id}`,
        title: "Add certificates",
        detail: product.name,
        href: `/products/${product.id}/edit`,
        tone: "warning",
      });
    }
    if (productNeedsResume(product)) {
      tasks.push({
        id: `task-resume:${product.id}`,
        title: "Complete resume / specs",
        detail: product.name,
        href: `/products/${product.id}/spec`,
        tone: "warning",
      });
    }
    if (PIPELINE_TASK_STATUSES.has(product.status)) {
      tasks.push({
        id: `task-pipeline:${product.id}`,
        title: `Follow up · ${product.status.replaceAll("_", " ")}`,
        detail: product.name,
        href: `/products/${product.id}`,
        tone: "info",
      });
    }
  }

  return tasks.slice(0, 8);
}

export function buildNeedAttention(
  products: ProductView[],
  suppliers: Supplier[],
): WorkspaceAttentionItem[] {
  return buildNotifications(products, suppliers)
    .filter((item) => item.level === "warning")
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      title: item.title,
      detail: item.body,
      href: item.href ?? "/products",
    }));
}

export function buildWorkspaceNotifications(
  products: ProductView[],
  suppliers: Supplier[],
): (AppNotification & { read: boolean })[] {
  const reads = getNotificationReads();
  return buildNotifications(products, suppliers)
    .slice(0, 6)
    .map((item) => ({
      ...item,
      read: isNotificationRead(item, reads),
    }));
}

export function buildRecentProducts(
  products: ProductView[],
  recent: RecentViewItem[],
  limit = 5,
): WorkspaceListItem[] {
  const fromRecent = recent
    .filter((item) => item.entityType === "product")
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      title: item.name,
      subtitle: "Recently viewed",
      href: item.href,
      imageUrl: item.imageUrl,
      meta: formatNotificationTime(item.viewedAt),
    }));

  if (fromRecent.length > 0) return fromRecent;

  return getLatestProducts(products, limit).map((product) => ({
    id: product.id,
    title: product.name,
    subtitle: product.code?.trim() || product.supplier || "Product",
    href: `/products/${product.id}`,
    imageUrl: product.imageUrl,
    meta: formatNotificationTime(product.updatedAt),
  }));
}

export function buildRecentSuppliers(
  suppliers: Supplier[],
  recent: RecentViewItem[],
  limit = 5,
): WorkspaceListItem[] {
  const fromRecent = recent
    .filter((item) => item.entityType === "supplier")
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      title: item.name,
      subtitle: "Recently viewed",
      href: item.href,
      imageUrl: item.imageUrl,
      meta: formatNotificationTime(item.viewedAt),
    }));

  if (fromRecent.length > 0) return fromRecent;

  return [...suppliers]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, limit)
    .map((supplier) => ({
      id: supplier.id,
      title: supplier.displayName || supplier.factoryName,
      subtitle: supplier.country || "Supplier",
      href: `/suppliers/${supplier.id}`,
      imageUrl: supplier.logoUrl || supplier.imageUrl,
      meta: formatNotificationTime(supplier.updatedAt),
    }));
}

export function getSimulatorDraftItem(): {
  draft: SalesPlanProjectDraft | null;
  item: WorkspaceListItem | null;
} {
  const draft = loadSalesProjectDraft();
  if (!draft) return { draft: null, item: null };

  const hasRows = draft.scenarioRows.length > 0;
  return {
    draft,
    item: {
      id: `sales-draft:${draft.projectId}`,
      title: "Sales plan draft",
      subtitle: hasRows
        ? `${draft.scenarioRows.length} scenario row${draft.scenarioRows.length === 1 ? "" : "s"}`
        : "Empty draft — continue editing",
      href: `/simulator/${draft.projectId}`,
      meta: formatNotificationTime(draft.updatedAt),
    },
  };
}

export function buildSalesPlanItems(limit = 5): WorkspaceListItem[] {
  return listSalesProjects()
    .slice(0, limit)
    .map((project) => ({
      id: project.id,
      title: project.name,
      subtitle: `${project.summary.productCount} product${project.summary.productCount === 1 ? "" : "s"} · Sales plan`,
      href: `/simulator/${project.id}`,
      meta: formatNotificationTime(project.updatedAt),
    }));
}

export function formatWorkspaceGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
