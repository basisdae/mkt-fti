/**
 * Duplicate detection for product import (skip-only, never update/merge/delete).
 * Reads existing products from Supabase for matching; does not write.
 */
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ImportFieldKey } from "@/lib/product-import-validate";

export interface ExistingProductIdentity {
  id: string;
  name: string;
  code: string;
  /** Stored as product_system in the products table. */
  model: string;
  supplier: string;
  brand: string;
}

export interface DuplicateMatch {
  productId: string | null;
  productName: string;
  rule: "sku" | "model" | "name_supplier" | "name_brand" | "file_batch";
}

function norm(value: string): string {
  return value.trim();
}

function cell(
  values: Partial<Record<ImportFieldKey, string>>,
  key: ImportFieldKey,
): string {
  return norm(values[key] ?? "");
}

function supplierOf(values: Partial<Record<ImportFieldKey, string>>): string {
  return cell(values, "Supplier") || cell(values, "Factory");
}

/** Load active product identities for duplicate checks (read-only). */
export async function loadExistingProductIdentities(): Promise<
  ExistingProductIdentity[]
> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Duplicate checks require a database connection.",
    );
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, code, product_system, supplier, brand, is_archived");

  if (error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("is_archived") ||
      message.includes("column") ||
      message.includes("schema cache")
    ) {
      const fallback = await supabase
        .from("products")
        .select("id, name, code, product_system, supplier, brand");
      if (fallback.error) {
        console.error("product import error", fallback.error);
        throw new Error(fallback.error.message);
      }
      return (fallback.data ?? []).map((row) => ({
        id: String(row.id),
        name: String(row.name ?? ""),
        code: String(row.code ?? ""),
        model: String(row.product_system ?? ""),
        supplier: String(row.supplier ?? ""),
        brand: String(row.brand ?? ""),
      }));
    }
    console.error("product import error", error);
    throw new Error(error.message);
  }

  return ((data ?? []) as Record<string, unknown>[])
    .filter(
      (row) => row.is_archived !== true && row.is_archived !== "true",
    )
    .map((row) => ({
      id: String(row.id),
      name: String(row.name ?? ""),
      code: String(row.code ?? ""),
      model: String(row.product_system ?? ""),
      supplier: String(row.supplier ?? ""),
      brand: String(row.brand ?? ""),
    }));
}

/**
 * Match priority:
 * 1. SKU exact (when SKU present)
 * 2. Model exact (when Model present)
 * 3. Product Name + Supplier exact
 * 4. Product Name + Brand exact
 */
export function findDuplicateInCatalog(
  values: Partial<Record<ImportFieldKey, string>>,
  existing: ExistingProductIdentity[],
): DuplicateMatch | null {
  const sku = cell(values, "SKU");
  const model = cell(values, "Model");
  const name = cell(values, "Product Name");
  const supplier = supplierOf(values);
  const brand = cell(values, "Brand");

  if (sku) {
    const hit = existing.find((product) => norm(product.code) === sku);
    if (hit) {
      return {
        productId: hit.id,
        productName: hit.name || hit.code || "Existing product",
        rule: "sku",
      };
    }
  }

  if (model) {
    const hit = existing.find((product) => norm(product.model) === model);
    if (hit) {
      return {
        productId: hit.id,
        productName: hit.name || hit.model || "Existing product",
        rule: "model",
      };
    }
  }

  if (name && supplier) {
    const hit = existing.find(
      (product) =>
        norm(product.name) === name && norm(product.supplier) === supplier,
    );
    if (hit) {
      return {
        productId: hit.id,
        productName: hit.name,
        rule: "name_supplier",
      };
    }
  }

  if (name && brand) {
    const hit = existing.find(
      (product) =>
        norm(product.name) === name && norm(product.brand) === brand,
    );
    if (hit) {
      return {
        productId: hit.id,
        productName: hit.name,
        rule: "name_brand",
      };
    }
  }

  return null;
}

/** Keys used to detect duplicates within the same import file. */
export function buildBatchDuplicateKeys(
  values: Partial<Record<ImportFieldKey, string>>,
): string[] {
  const sku = cell(values, "SKU");
  const model = cell(values, "Model");
  const name = cell(values, "Product Name");
  const supplier = supplierOf(values);
  const brand = cell(values, "Brand");
  const keys: string[] = [];

  if (sku) keys.push(`sku:${sku}`);
  if (model) keys.push(`model:${model}`);
  if (name && supplier) keys.push(`name_supplier:${name}::${supplier}`);
  if (name && brand) keys.push(`name_brand:${name}::${brand}`);

  return keys;
}

export function findDuplicateInBatch(
  values: Partial<Record<ImportFieldKey, string>>,
  batchIndex: Map<string, { displayName: string }>,
): DuplicateMatch | null {
  for (const key of buildBatchDuplicateKeys(values)) {
    const prior = batchIndex.get(key);
    if (prior) {
      return {
        productId: null,
        productName: prior.displayName,
        rule: "file_batch",
      };
    }
  }
  return null;
}

export function registerBatchKeys(
  values: Partial<Record<ImportFieldKey, string>>,
  displayName: string,
  batchIndex: Map<string, { displayName: string }>,
): void {
  for (const key of buildBatchDuplicateKeys(values)) {
    if (!batchIndex.has(key)) {
      batchIndex.set(key, { displayName });
    }
  }
}

export function duplicateSkipMessage(match: DuplicateMatch): string {
  return `Duplicate product found: ${match.productName}`;
}
