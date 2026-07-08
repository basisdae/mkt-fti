/**
 * Client-side command palette search (no backend).
 * Uses already-loaded catalog data only.
 */
import { listSalesProjects } from "@/lib/sales-projects";
import {
  getIsoCertifications,
  getRegulatoryCertifications,
} from "@/lib/product-certification";
import type { ProductView } from "@/types/product";
import type { Supplier } from "@/types/supplier";

export type CommandCategory =
  | "Products"
  | "Suppliers"
  | "Factories"
  | "Sales Plans"
  | "Simulator Plans"
  | "Certificates"
  | "Media"
  | "Settings";

export interface CommandResult {
  id: string;
  category: CommandCategory;
  title: string;
  subtitle?: string;
  href: string;
}

export const COMMAND_PALETTE_RECENT_KEY = "mkt_hq_command_palette_recent";

const SETTINGS_ITEMS: CommandResult[] = [
  {
    id: "settings-home",
    category: "Settings",
    title: "Settings",
    subtitle: "Workspace preferences",
    href: "/settings",
  },
  {
    id: "settings-backup",
    category: "Settings",
    title: "Data Backup",
    subtitle: "Export all data",
    href: "/settings",
  },
  {
    id: "settings-activity",
    category: "Settings",
    title: "Recent Activity",
    subtitle: "Audit trail",
    href: "/settings",
  },
  {
    id: "settings-users",
    category: "Settings",
    title: "Manage Users",
    subtitle: "Accounts and roles",
    href: "/settings/users",
  },
  {
    id: "settings-import",
    category: "Settings",
    title: "Product Import Wizard",
    subtitle: "Excel import (preview)",
    href: "/products/import",
  },
];

function matches(query: string, ...parts: Array<string | null | undefined>) {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return parts.some((part) => (part ?? "").toLowerCase().includes(q));
}

export function searchCommandPalette(
  query: string,
  products: ProductView[],
  suppliers: Supplier[],
  limitPerCategory = 5,
): CommandResult[] {
  const q = query.trim();
  if (!q) return [];

  const results: CommandResult[] = [];

  const productHits = products
    .filter((product) =>
      matches(
        q,
        product.name,
        product.code,
        product.supplier,
        product.brand,
        product.factoryLocation,
        product.productSystem,
      ),
    )
    .slice(0, limitPerCategory)
    .map((product) => ({
      id: `product-${product.id}`,
      category: "Products" as const,
      title: product.name,
      subtitle: [product.code, product.supplier, product.brand]
        .filter(Boolean)
        .join(" · "),
      href: `/products/${product.id}`,
    }));
  results.push(...productHits);

  const supplierHits = suppliers
    .filter((supplier) =>
      matches(
        q,
        supplier.factoryName,
        supplier.country,
        supplier.provinceRegion,
        supplier.cityDistrict,
        supplier.mainProductCategory,
      ),
    )
    .slice(0, limitPerCategory);

  for (const supplier of supplierHits) {
    results.push({
      id: `supplier-${supplier.id}`,
      category: "Suppliers",
      title: supplier.factoryName,
      subtitle: [supplier.cityDistrict, supplier.provinceRegion, supplier.country]
        .filter(Boolean)
        .join(" · "),
      href: `/suppliers/${supplier.id}`,
    });
    results.push({
      id: `factory-${supplier.id}`,
      category: "Factories",
      title: supplier.factoryName,
      subtitle: supplier.mainProductCategory || "Factory profile",
      href: `/suppliers/${supplier.id}`,
    });
  }

  const plans = listSalesProjects()
    .filter((plan) => matches(q, plan.name, plan.description))
    .slice(0, limitPerCategory);

  for (const plan of plans) {
    const item: CommandResult = {
      id: `sim-plan-${plan.id}`,
      category: "Simulator Plans",
      title: plan.name,
      subtitle: `${plan.summary.productCount} scenarios · Sales plan project`,
      href: `/simulator/${plan.id}`,
    };
    results.push(item);
    results.push({
      ...item,
      id: `sales-plan-${plan.id}`,
      category: "Sales Plans",
      subtitle: `${plan.summary.productCount} scenarios · Sales plan`,
    });
  }

  const certSet = new Map<string, CommandResult>();
  for (const product of products) {
    const certs = [
      ...getIsoCertifications(product.certification),
      ...getRegulatoryCertifications(product.certification),
    ];
    for (const cert of certs) {
      if (!matches(q, cert)) continue;
      const key = cert.toLowerCase();
      if (certSet.has(key)) continue;
      certSet.set(key, {
        id: `cert-${key}`,
        category: "Certificates",
        title: cert,
        subtitle: `On ${product.name}`,
        href: `/products/${product.id}`,
      });
      if (certSet.size >= limitPerCategory) break;
    }
    if (certSet.size >= limitPerCategory) break;
  }
  results.push(...certSet.values());

  const mediaHits: CommandResult[] = [];
  for (const product of products) {
    for (const link of product.mediaLinks ?? []) {
      if (!matches(q, link.title, link.mediaType, link.url, link.platform)) {
        continue;
      }
      mediaHits.push({
        id: `media-${link.id}`,
        category: "Media",
        title: link.title || "Media asset",
        subtitle: `${product.name} · ${link.mediaType}`,
        href: `/products/${product.id}?tab=assets`,
      });
      if (mediaHits.length >= limitPerCategory) break;
    }
    if (mediaHits.length >= limitPerCategory) break;
  }
  results.push(...mediaHits);

  const settingsHits = SETTINGS_ITEMS.filter((item) =>
    matches(q, item.title, item.subtitle, item.category),
  ).slice(0, limitPerCategory);
  results.push(...settingsHits);

  return results;
}

export function groupCommandResults(
  results: CommandResult[],
): { category: CommandCategory; items: CommandResult[] }[] {
  const order: CommandCategory[] = [
    "Products",
    "Suppliers",
    "Factories",
    "Sales Plans",
    "Simulator Plans",
    "Certificates",
    "Media",
    "Settings",
  ];
  const map = new Map<CommandCategory, CommandResult[]>();
  for (const item of results) {
    const list = map.get(item.category) ?? [];
    list.push(item);
    map.set(item.category, list);
  }
  return order
    .filter((category) => (map.get(category)?.length ?? 0) > 0)
    .map((category) => ({
      category,
      items: map.get(category) ?? [],
    }));
}

export function loadRecentCommands(): CommandResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(COMMAND_PALETTE_RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CommandResult[];
    return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
  } catch {
    return [];
  }
}

export function pushRecentCommand(item: CommandResult): void {
  if (typeof window === "undefined") return;
  try {
    const prev = loadRecentCommands().filter((entry) => entry.id !== item.id);
    const next = [item, ...prev].slice(0, 8);
    window.localStorage.setItem(
      COMMAND_PALETTE_RECENT_KEY,
      JSON.stringify(next),
    );
  } catch {
    // ignore storage errors
  }
}
