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
  contacts: SupplierContactInput[];
}

export function createEmptyContactInput(): SupplierContactInput {
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
