import type { SupplierRepository } from "@/lib/repositories/types";

/** Initial empty state — SupplierStore loads from Supabase on the client. */
export const localSupplierRepository: SupplierRepository = {
  listInitial() {
    return [];
  },
};
