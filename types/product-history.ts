import type { AppRole } from "@/types/auth";

export interface ProductHistoryChange {
  field: string;
  oldValue: string;
  newValue: string;
}

export interface ProductHistoryEntry {
  id: string;
  productId: string;
  occurredAt: string;
  userId: string;
  userName: string;
  userRole: AppRole | string;
  action: string;
  changes: ProductHistoryChange[];
}
