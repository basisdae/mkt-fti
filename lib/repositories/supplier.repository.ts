import { loadSuppliersFromStorage } from "@/lib/supplier-storage";
import type { SupplierRepository } from "@/lib/repositories/types";

/** Loads from localStorage on the client; empty on the server. */
export const localSupplierRepository: SupplierRepository = {
  listInitial() {
    return loadSuppliersFromStorage();
  },
};
