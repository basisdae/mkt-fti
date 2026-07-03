import type { ProductStatus } from "@/types/product";

export interface MoqOptionRow {
  id: string;
  quantity: string;
  label: string;
}

export interface NewProductFormData {
  productName: string;
  brand: string;
  supplierId: string | null;
  supplier: string;
  factoryLocation: string;
  category: string;
  status: ProductStatus | "";
  moqOptions: MoqOptionRow[];
  usdCost: string;
  exchangeRate: string;
  wholesaleGp: string;
  dealerGp: string;
  leadTime: string;
  oemAvailable: boolean;
  odmAvailable: boolean;
  packagingCustom: boolean;
  colorCustom: boolean;
  specCustom: boolean;
  certifications: string[];
  productSystem: string;
  notes: string;
}

export function createMoqRow(): MoqOptionRow {
  return {
    id: `moq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    quantity: "",
    label: "",
  };
}

export const INITIAL_FORM_DATA: NewProductFormData = {
  productName: "",
  brand: "",
  supplierId: null,
  supplier: "",
  factoryLocation: "",
  category: "",
  status: "",
  moqOptions: [createMoqRow()],
  usdCost: "",
  exchangeRate: "36.00",
  wholesaleGp: "42",
  dealerGp: "14",
  leadTime: "",
  oemAvailable: false,
  odmAvailable: false,
  packagingCustom: false,
  colorCustom: false,
  specCustom: false,
  certifications: [],
  productSystem: "",
  notes: "",
};

export const CERTIFICATION_OPTIONS = [
  "TISI",
  "CE",
  "RoHS",
  "FCC",
  "FDA",
  "NSF",
  "CB",
  "Bluetooth SIG",
] as const;

export const PRODUCT_SYSTEM_OPTIONS = [
  "FTI Home Living",
  "FTI Kitchen",
  "FTI Wellness",
  "FTI Smart Home",
  "FTI Auto",
  "FTI Lifestyle",
  "FTI Industrial",
] as const;
