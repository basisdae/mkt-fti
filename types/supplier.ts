export type SupplierGalleryCategory =
  | "factory_visit"
  | "production_line"
  | "warehouse"
  | "laboratory"
  | "showroom"
  | "certificate"
  | "office"
  | "other";

export interface SupplierGalleryImage {
  id: string;
  supplierId: string;
  imageUrl: string;
  imagePath: string;
  altText: string;
  category: SupplierGalleryCategory;
  sortOrder: number;
  isCover: boolean;
}

export interface SupplierContact {
  id: string;
  contactName: string;
  position: string;
  salesRepCode: string;
  wechatId: string;
  whatsapp: string;
  phone: string;
  email: string;
  line: string;
  imageUrl: string | null;
  isPrimary: boolean;
  isActive: boolean;
  notes: string;
}

export interface Supplier {
  id: string;
  factoryName: string;
  displayName: string;
  country: string;
  provinceRegion: string;
  cityDistrict: string;
  fullAddress: string;
  locationNote: string;
  website: string;
  alibabaLink: string;
  mainProductCategory: string;
  imageUrl: string | null;
  /** Company logo (secondary visual) — not the system factory icon. */
  logoUrl: string | null;
  /** Supabase Storage path for logo cleanup. */
  logoPath: string | null;
  notes: string;
  contacts: SupplierContact[];
  updatedAt: string;
}

export interface SupplierContactInput {
  contactName: string;
  position: string;
  salesRepCode: string;
  wechatId: string;
  whatsapp: string;
  phone: string;
  email: string;
  line: string;
  isPrimary: boolean;
  isActive: boolean;
  notes: string;
}

/** Contact row in supplier form — includes id when editing existing contacts. */
export interface SupplierFormContactInput extends SupplierContactInput {
  id?: string;
}

/** Contact fields for create — no id (Supabase generates UUID). */
export type NewSupplierContactInput = SupplierContactInput;

/** Supplier fields for create — no id (Supabase generates UUID). */
export interface NewSupplierInput {
  factoryName: string;
  displayName: string;
  country: string;
  provinceRegion: string;
  cityDistrict: string;
  fullAddress: string;
  locationNote: string;
  website: string;
  alibabaLink: string;
  mainProductCategory: string;
  imageUrl: string | null;
  logoUrl: string | null;
  logoPath: string | null;
  notes: string;
  contacts: NewSupplierContactInput[];
}

export interface NewSupplierFormData {
  factoryName: string;
  displayName: string;
  country: string;
  provinceRegion: string;
  cityDistrict: string;
  fullAddress: string;
  locationNote: string;
  website: string;
  alibabaLink: string;
  mainProductCategory: string;
  notes: string;
  contacts: SupplierFormContactInput[];
}

export function createEmptyContactInput(): SupplierFormContactInput {
  return {
    contactName: "",
    position: "",
    salesRepCode: "",
    wechatId: "",
    whatsapp: "",
    phone: "",
    email: "",
    line: "",
    isPrimary: true,
    isActive: true,
    notes: "",
  };
}

export const INITIAL_SUPPLIER_FORM: NewSupplierFormData = {
  factoryName: "",
  displayName: "",
  country: "China",
  provinceRegion: "",
  cityDistrict: "",
  fullAddress: "",
  locationNote: "",
  website: "",
  alibabaLink: "",
  mainProductCategory: "",
  notes: "",
  contacts: [createEmptyContactInput()],
};
