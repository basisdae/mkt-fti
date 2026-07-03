import { evalExtras } from "@/lib/product-detail-defaults";
import { defaultBrandStrategy } from "@/lib/brand-strategy";
import { createEmptyEvaluationScorecard } from "@/lib/evaluation-scorecard";
import type {
  OemType,
  Product,
  ProductBrandStrategy,
  ProductCertification,
  ProductCustomOptions,
  ProductGalleryImage,
  ProductPriceOption,
} from "@/types/product";

export interface ProductSeedInput {
  id: string;
  name: string;
  code: string;
  supplier: string;
  supplierId?: string | null;
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
  images?: ProductGalleryImage[];
  certifications: string[];
  customOptions?: Partial<ProductCustomOptions>;
  certification?: Partial<Omit<ProductCertification, "certifications">>;
  brandStrategy?: Partial<ProductBrandStrategy> & {
    factory?: string;
    internalProjectName?: string;
    businessUnit?: string;
  };
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

function inferFactoryLocation(supplier: string): string {
  const city = supplier.split(/[\s,]+/)[0];
  return `${city}, China`;
}

export function emptyProductCertification(
  certifications: string[] = [],
): ProductCertification {
  const validCerts = certifications.filter((item) => item.trim());
  return {
    iso1: "",
    iso2: "",
    iso3: "",
    certifications: validCerts,
    productSystems: [],
  };
}

export function createProduct(seed: ProductSeedInput): Product {
  const typeDefaults = oemTypeDefaults(seed.oemType);

  const strategy = defaultBrandStrategy({
    factory: seed.brandStrategy?.factory ?? seed.supplier,
    internalProjectName:
      seed.brandStrategy?.internalProjectName ?? `Project ${seed.code}`,
    businessUnit: seed.brandStrategy?.businessUnit ?? seed.productSystem,
    currentBrand: seed.brandStrategy?.currentBrand ?? null,
    candidateBrands: seed.brandStrategy?.candidateBrands ?? [],
    reason: seed.brandStrategy?.reason ?? "",
    decisionDate: seed.brandStrategy?.decisionDate ?? null,
    owner: seed.brandStrategy?.owner ?? "",
    brandFitScore: seed.brandStrategy?.brandFitScore ?? null,
  });

  return {
    id: seed.id,
    name: seed.name,
    code: seed.code,
    brand: seed.brand ?? "",
    brandStrategy: strategy,
    supplierId: seed.supplierId ?? null,
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
    images: seed.images ?? [],
    customOptions: {
      ...typeDefaults,
      customNotes: seed.packagingNotes,
      ...seed.customOptions,
    },
    certification: {
      ...emptyProductCertification(seed.certifications),
      ...seed.certification,
    },
    evaluationScorecard: createEmptyEvaluationScorecard(),
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
