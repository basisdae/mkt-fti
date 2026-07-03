import { generateId } from "@/lib/generate-id";
import type { Supplier, SupplierContact } from "@/types/supplier";

export interface SupplierSeedInput {
  id?: string;
  factoryName: string;
  displayName?: string;
  country?: string;
  provinceRegion?: string;
  cityDistrict?: string;
  fullAddress?: string;
  locationNote?: string;
  website?: string;
  alibabaLink?: string;
  mainProductCategory?: string;
  imageUrl?: string | null;
  notes?: string;
  contacts?: Omit<SupplierContact, "id" | "imageUrl">[];
  updatedAt: string;
}

export function createSupplierContact(
  input: Omit<SupplierContact, "id" | "imageUrl">,
  id: string = generateId(),
): SupplierContact {
  return {
    id,
    imageUrl: null,
    ...input,
  };
}

export function createSupplier(seed: SupplierSeedInput): Supplier {
  const supplierId = seed.id ?? generateId();
  const contacts = (seed.contacts ?? []).map((contact) =>
    createSupplierContact(contact),
  );

  if (contacts.length > 0 && !contacts.some((c) => c.isPrimary)) {
    contacts[0]!.isPrimary = true;
  }

  return {
    id: supplierId,
    factoryName: seed.factoryName,
    displayName: seed.displayName ?? seed.factoryName,
    country: seed.country ?? "China",
    provinceRegion: seed.provinceRegion ?? "",
    cityDistrict: seed.cityDistrict ?? "",
    fullAddress: seed.fullAddress ?? "",
    locationNote: seed.locationNote ?? "",
    website: seed.website ?? "",
    alibabaLink: seed.alibabaLink ?? "",
    mainProductCategory: seed.mainProductCategory ?? "",
    imageUrl: seed.imageUrl ?? null,
    notes: seed.notes ?? "",
    contacts,
    updatedAt: seed.updatedAt,
  };
}
