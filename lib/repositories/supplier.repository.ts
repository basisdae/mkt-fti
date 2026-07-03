import type { SupplierRepository } from "@/lib/repositories/types";

/** Empty initial state — production starts with no suppliers. */
export const localSupplierRepository: SupplierRepository = {
  listInitial() {
    return [];
  },
};
