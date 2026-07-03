import { evalExtras } from "@/lib/product-detail-defaults";
import type {
  OemType,
  Product,
  ProductCertification,
  ProductCustomOptions,
  ProductPriceOption,
} from "@/types/product";

export interface ProductSeedInput {
  id: string;
  name: string;
  code: string;
  supplier: string;
  brand?: string;
  factoryLocation?: string;
  category: string;
  description: string;
  opportunityScore: number;
  latestNote: string;
  updatedAt: string;
  businessType: string;
  oemType: OemType;
  factoryContact: string;
  productSystem: string;
  packagingNotes: string;
  marginTarget: number;
  annualVolumeTarget: number;
  imageUrl?: string | null;
  imageAlt?: string;
  certifications: string[];
  customOptions?: Partial<ProductCustomOptions>;
  certification?: Partial<Omit<ProductCertification, "certifications">>;
}

function oemTypeDefaults(oemType: OemType): ProductCustomOptions {
  switch (oemType) {
    case "OEM":
      return evalExtras({
        oem: true,
        privateLabel: true,
        packagingCustom: true,
        colorCustom: true,
        customLevel: "Medium",
      });
    case "ODM":
      return evalExtras({
        odm: true,
        packagingCustom: true,
        customLevel: "Low",
      });
    case "Custom":
      return evalExtras({
        oem: true,
        odm: true,
        specCustom: true,
        colorCustom: true,
        packagingCustom: true,
        exclusive: true,
        customLevel: "High",
      });
  }
}

function defaultProductSystems(category: string, name: string): string[] {
  if (name.includes("Air Purifier")) return ["HEPA", "Smart"];
  if (name.includes("Water")) return ["RO", "PP", "CTO"];
  if (name.includes("Lamp")) return ["LED", "Smart"];
  if (name.includes("Door Lock")) return ["Smart", "PCB"];
  if (name.includes("Dash Cam")) return ["Smart", "PCB"];
  if (name.includes("Blender")) return ["PP", "PCB"];
  if (name.includes("Vacuum")) return ["PP", "HEPA"];
  if (name.includes("Robot")) return ["Smart", "PCB"];
  if (name.includes("Massage")) return ["PP", "PCB"];
  if (category === "health") return ["PP", "CTO"];
  return ["PP"];
}

function inferFactoryLocation(supplier: string): string {
  const city = supplier.split(/[\s,]+/)[0];
  return `${city}, China`;
}

export function createProduct(seed: ProductSeedInput): Product {
  const typeDefaults = oemTypeDefaults(seed.oemType);

  return {
    id: seed.id,
    name: seed.name,
    code: seed.code,
    brand: seed.brand ?? seed.productSystem,
    supplier: seed.supplier,
    factoryLocation: seed.factoryLocation ?? inferFactoryLocation(seed.supplier),
    category: seed.category,
    description: seed.description,
    opportunityScore: seed.opportunityScore,
    latestNote: seed.latestNote,
    updatedAt: seed.updatedAt,
    businessType: seed.businessType,
    oemType: seed.oemType,
    factoryContact: seed.factoryContact,
    productSystem: seed.productSystem,
    packagingNotes: seed.packagingNotes,
    marginTarget: seed.marginTarget,
    annualVolumeTarget: seed.annualVolumeTarget,
    imageUrl: seed.imageUrl ?? null,
    imageAlt: seed.imageAlt ?? seed.name,
    customOptions: {
      ...typeDefaults,
      customNotes: seed.packagingNotes,
      ...seed.customOptions,
    },
    certification: {
      iso1: "ISO 9001",
      iso2: "ISO 14001",
      iso3: seed.certifications.includes("TISI") ? "TISI Certified" : "",
      certifications: seed.certifications,
      productSystems: defaultProductSystems(seed.category, seed.name),
      ...seed.certification,
    },
  };
}

export function priceOption(
  id: string,
  productId: string,
  moq: number,
  usdCost: number,
  exchangeRate: number,
  wholesaleGp: number,
  dealerGp: number,
  label?: string,
  leadTime = "45 days",
): ProductPriceOption {
  return {
    id,
    productId,
    moq,
    usdCost,
    exchangeRate,
    wholesaleGp,
    dealerGp,
    label,
    leadTime,
  };
}
