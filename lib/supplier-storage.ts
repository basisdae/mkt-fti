import type { Supplier } from "@/types/supplier";

export const SUPPLIERS_STORAGE_KEY = "mkt-fti-suppliers";

function isSupplierRecord(value: unknown): value is Supplier {
  if (!value || typeof value !== "object") return false;
  const record = value as Supplier;
  return (
    typeof record.id === "string" &&
    typeof record.factoryName === "string" &&
    Array.isArray(record.contacts)
  );
}

export function loadSuppliersFromStorage(): Supplier[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(SUPPLIERS_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isSupplierRecord);
  } catch {
    return [];
  }
}

export function saveSuppliersToStorage(suppliers: Supplier[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SUPPLIERS_STORAGE_KEY, JSON.stringify(suppliers));
}
