import type { Product } from "@/types/product";
import type { Supplier, SupplierContact } from "@/types/supplier";

export function getPrimaryContact(
  supplier: Supplier,
): SupplierContact | undefined {
  return (
    supplier.contacts.find((c) => c.isPrimary && c.isActive) ??
    supplier.contacts.find((c) => c.isActive) ??
    supplier.contacts[0]
  );
}

export function formatSupplierLocation(supplier: Supplier): string {
  const parts = [
    supplier.cityDistrict,
    supplier.provinceRegion,
    supplier.country,
  ].filter(Boolean);
  return parts.join(", ") || "—";
}

export function formatSupplierShortLocation(supplier: Supplier): string {
  const parts = [supplier.cityDistrict, supplier.provinceRegion].filter(
    Boolean,
  );
  return parts.join(", ") || "—";
}

export function countLinkedProducts(
  supplierId: string,
  products: Pick<Product, "supplierId">[],
): number {
  return products.filter((p) => p.supplierId === supplierId).length;
}

export function getLinkedProducts<T extends Pick<Product, "id" | "name" | "supplierId">>(
  supplierId: string,
  products: T[],
): T[] {
  return products.filter((product) => product.supplierId === supplierId);
}

export function matchesSupplierSearch(supplier: Supplier, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    supplier.factoryName,
    supplier.displayName,
    supplier.country,
    supplier.provinceRegion,
    supplier.cityDistrict,
    supplier.mainProductCategory,
    ...supplier.contacts.map(
      (c) =>
        `${c.contactName} ${c.wechatId} ${c.email} ${c.phone} ${c.salesRepCode}`,
    ),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

export function searchSuppliers(
  suppliers: Supplier[],
  query: string,
  limit = 8,
): Supplier[] {
  if (!query.trim()) return suppliers.slice(0, limit);
  return suppliers
    .filter((s) => matchesSupplierSearch(s, query))
    .slice(0, limit);
}

export function supplierDisplayName(supplier: Supplier): string {
  return supplier.displayName || supplier.factoryName;
}
