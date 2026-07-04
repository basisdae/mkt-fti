import type { ProductBrandOption } from "@/lib/brand-strategy";
import { PIPELINE_STAGES } from "@/lib/constants";
import { generateId } from "@/lib/generate-id";
import type { ProductStatus } from "@/types/product";

/** True when status is after Contact Factory in the lifecycle. */
export function isStatusBeyondContactFactory(
  status: ProductStatus | "",
): boolean {
  if (!status) return false;
  const idx = PIPELINE_STAGES.indexOf(status);
  const contactIdx = PIPELINE_STAGES.indexOf("contact_factory");
  if (idx === -1 || contactIdx === -1) return false;
  return idx > contactIdx;
}

export function canSaveWithoutSupplier(status: ProductStatus | ""): boolean {
  return status === "interested";
}

export interface MoqOptionRow {
  id: string;
  quantity: string;
  usdPerUnit: string;
  label: string;
}

export interface NewProductFormData {
  productName: string;
  brandOption: ProductBrandOption;
  brandCustom: string;
  supplierId: string | null;
  category: string;
  status: ProductStatus | "";
  moqOptions: MoqOptionRow[];
  wholesaleGp: string;
  dealerGp: string;
  leadTime: string;
  oemAvailable: boolean;
  odmAvailable: boolean;
  packagingCustom: boolean;
  colorCustom: boolean;
  specCustom: boolean;
  iso: string[];
  isoCustom: string;
  certifications: string[];
  certificationCustom: string;
  productSystem: string;
  notes: string;
}

export function createMoqRow(): MoqOptionRow {
  return {
    id: generateId(),
    quantity: "",
    usdPerUnit: "",
    label: "",
  };
}

export const INITIAL_FORM_DATA: NewProductFormData = {
  productName: "",
  brandOption: "",
  brandCustom: "",
  supplierId: null,
  category: "",
  status: "",
  moqOptions: [createMoqRow()],
  wholesaleGp: "42",
  dealerGp: "14",
  leadTime: "",
  oemAvailable: false,
  odmAvailable: false,
  packagingCustom: false,
  colorCustom: false,
  specCustom: false,
  iso: [],
  isoCustom: "",
  certifications: [],
  certificationCustom: "",
  productSystem: "",
  notes: "",
};

export const ISO_OPTIONS = [
  "ISO 9001",
  "ISO 14001",
  "ISO 45001",
  "ISO 22000",
  "ISO 13485",
  "ISO 17025",
] as const;

export const CERTIFICATION_OPTIONS = [
  "TISI",
  "CE",
  "RoHS",
  "FCC",
  "FDA",
  "NSF",
  "CB",
  "Bluetooth SIG",
  "WRAS",
  "WQA",
  "SGS",
  "UL",
  "ETL",
  "LFGB",
  "REACH",
  "BPA Free",
  "WaterMark",
  "ISO",
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
