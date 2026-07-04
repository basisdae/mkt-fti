import { createProduct, emptyProductCertification, priceOption } from "@/lib/product-builder";
import {
  defaultBrandStrategy,
  parseProductBrandKey,
  resolveProductBrandLabel,
} from "@/lib/brand-strategy";
import {
  parseLeadTimeDays,
  serializeLeadTimeDays,
} from "@/lib/lead-time";
import { createEmptyEvaluationScorecard } from "@/lib/evaluation-scorecard";
import { generateId } from "@/lib/generate-id";
import { syncCoverFields } from "@/lib/product-gallery";
import type { ProductCreateBundle } from "@/lib/repositories/types";
import {
  createMoqRow,
  type NewProductFormData,
} from "@/types/product-form";
import type {
  FtiBrand,
  OemType,
  Product,
  ProductGalleryImage,
  ProductStatus,
  ProductView,
} from "@/types/product";

function brandFromForm(form: NewProductFormData): string {
  return resolveProductBrandLabel(form.brandOption, form.brandCustom);
}

function currentBrandFromForm(form: NewProductFormData): FtiBrand | null {
  if (!form.brandOption || form.brandOption === "other") return null;
  return form.brandOption;
}

function slugCode(name: string): string {
  const words = name
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 3);
  const prefix = words.map((w) => w.slice(0, 3).toUpperCase()).join("");
  const suffix = String(Date.now()).slice(-4);
  return `${prefix || "PRD"}-${suffix}`;
}

function inferOemType(form: NewProductFormData): OemType {
  if (form.specCustom) return "Custom";
  if (form.odmAvailable) return "ODM";
  return "OEM";
}

export function buildProductBundleFromForm(
  form: NewProductFormData,
  options: {
    images?: ProductGalleryImage[];
    imageUrl?: string | null;
    imageAlt?: string;
    supplierName: string;
    supplierId: string | null;
    exchangeRate: number;
  },
): ProductCreateBundle {
  const now = new Date().toISOString();
  const productId = generateId();
  const code = slugCode(form.productName);
  const status = form.status as ProductStatus;
  const exchangeRate = options.exchangeRate;
  const wholesaleGp = (parseFloat(form.wholesaleGp) || 42) / 100;
  const dealerGp = (parseFloat(form.dealerGp) || 14) / 100;
  const leadTime = serializeLeadTimeDays(form.leadTime);
  const images = options.images ?? [];
  const cover = syncCoverFields(images, form.productName.trim());
  const notes = form.notes.trim();
  const productSystem = form.productSystem.trim();
  const brand = brandFromForm(form);
  const currentBrand = currentBrandFromForm(form);

  const base = createProduct({
    id: productId,
    name: form.productName.trim(),
    code,
    supplier: options.supplierName,
    supplierId: options.supplierId,
    brand,
    category: form.category,
    description: notes,
    opportunityScore: 0,
    latestNote: notes,
    updatedAt: now,
    businessType: "New Product",
    oemType: inferOemType(form),
    factoryContact: "",
    productSystem,
    packagingNotes: "",
    marginTarget: Math.round(wholesaleGp * 100),
    annualVolumeTarget: 0,
    imageUrl: cover.imageUrl,
    imageAlt: cover.imageAlt,
    images,
    certifications: form.certifications,
    certification: emptyProductCertification(form.certifications, form.iso),
    brandStrategy: {
      factory: options.supplierName,
      internalProjectName: form.productName.trim(),
      businessUnit: productSystem,
      reason: "",
      currentBrand,
    },
  });

  const product = {
    ...base,
    brandStrategy: defaultBrandStrategy({
      ...base.brandStrategy,
      factory: options.supplierName,
      currentBrand,
    }),
    evaluationScorecard: createEmptyEvaluationScorecard(),
  };

  const priceOptions = form.moqOptions
    .filter((row) => row.quantity.trim() && row.usdPerUnit.trim())
    .map((row, index) =>
      priceOption(
        row.id || generateId(),
        productId,
        parseInt(row.quantity, 10) || 0,
        parseFloat(row.usdPerUnit) || 0,
        exchangeRate,
        wholesaleGp,
        dealerGp,
        row.label.trim() || `${row.quantity} MOQ`,
        leadTime,
      ),
    );

  return {
    product,
    status: {
      productId,
      status,
      pipelineStage: status,
      updatedAt: now,
    },
    priceOptions:
      priceOptions.length > 0
        ? priceOptions
        : [
            priceOption(
              generateId(),
              productId,
              500,
              25,
              exchangeRate,
              wholesaleGp,
              dealerGp,
              "500 MOQ",
              leadTime,
            ),
          ],
  };
}

function notesFromProduct(product: Product): string {
  if (product.latestNote && product.latestNote !== "—") {
    return product.latestNote;
  }
  if (product.description && product.description !== "—") {
    return product.description;
  }
  return "";
}

export function productViewToFormData(product: ProductView): NewProductFormData {
  const firstTier = product.priceOptions[0];
  const emptyPlaceholder = (value: string) =>
    !value || value === "—" ? "" : value;

  const brandValue = emptyPlaceholder(product.brand);
  const brandOptionFromField = parseProductBrandKey(brandValue);
  const brandOption =
    brandOptionFromField ||
    product.brandStrategy.currentBrand ||
    "";

  return {
    productName: product.name,
    brandOption,
    brandCustom: brandOption === "other" ? brandValue : "",
    supplierId: product.supplierId,
    category: product.category,
    status: product.status,
    moqOptions:
      product.priceOptions.length > 0
        ? product.priceOptions.map((tier) => ({
            id: tier.id,
            quantity: String(tier.moq),
            usdPerUnit: String(tier.usdCost),
            label: tier.label ?? "",
          }))
        : [createMoqRow()],
    wholesaleGp: firstTier
      ? String(Math.round(firstTier.wholesaleGp * 100))
      : "42",
    dealerGp: firstTier ? String(Math.round(firstTier.dealerGp * 100)) : "14",
    leadTime: parseLeadTimeDays(firstTier?.leadTime),
    oemAvailable: product.customOptions.oem,
    odmAvailable: product.customOptions.odm,
    packagingCustom: product.customOptions.packagingCustom,
    colorCustom: product.customOptions.colorCustom,
    specCustom: product.customOptions.specCustom,
    iso: [...(product.certification.iso ?? [])],
    isoCustom: "",
    certifications: [...(product.certification.certifications ?? [])],
    certificationCustom: "",
    productSystem: emptyPlaceholder(product.productSystem),
    notes: notesFromProduct(product),
  };
}

export function updateProductBundleFromForm(
  productId: string,
  existing: Product,
  form: NewProductFormData,
  options: {
    images?: ProductGalleryImage[];
    supplierName: string;
    supplierId: string | null;
    exchangeRate: number;
  },
): ProductCreateBundle {
  const now = new Date().toISOString();
  const status = form.status as ProductStatus;
  const exchangeRate = options.exchangeRate;
  const wholesaleGp = (parseFloat(form.wholesaleGp) || 42) / 100;
  const dealerGp = (parseFloat(form.dealerGp) || 14) / 100;
  const leadTime = serializeLeadTimeDays(form.leadTime);
  const images = options.images ?? existing.images ?? [];
  const cover = syncCoverFields(images, form.productName.trim());
  const notes = form.notes.trim();
  const productSystem = form.productSystem.trim();
  const brand = brandFromForm(form);
  const currentBrand = currentBrandFromForm(form);

  const product: Product = {
    ...existing,
    id: productId,
    name: form.productName.trim(),
    supplier: options.supplierName,
    supplierId: options.supplierId,
    brand,
    category: form.category,
    description: notes,
    latestNote: notes,
    updatedAt: now,
    oemType: inferOemType(form),
    productSystem,
    marginTarget: Math.round(wholesaleGp * 100),
    imageUrl: cover.imageUrl,
    imageAlt: cover.imageAlt,
    images,
    customOptions: {
      ...existing.customOptions,
      oem: form.oemAvailable,
      odm: form.odmAvailable,
      packagingCustom: form.packagingCustom,
      colorCustom: form.colorCustom,
      specCustom: form.specCustom,
    },
    certification: {
      ...emptyProductCertification(form.certifications, form.iso),
      productSystems: existing.certification?.productSystems ?? [],
    },
    brandStrategy: {
      ...existing.brandStrategy,
      factory: options.supplierName,
      internalProjectName: form.productName.trim(),
      businessUnit: productSystem,
      currentBrand,
    },
  };

  const priceOptions = form.moqOptions
    .filter((row) => row.quantity.trim() && row.usdPerUnit.trim())
    .map((row) =>
      priceOption(
        row.id || generateId(),
        productId,
        parseInt(row.quantity, 10) || 0,
        parseFloat(row.usdPerUnit) || 0,
        exchangeRate,
        wholesaleGp,
        dealerGp,
        row.label.trim() || `${row.quantity} MOQ`,
        leadTime,
      ),
    );

  return {
    product,
    status: {
      productId,
      status,
      pipelineStage: status,
      updatedAt: now,
    },
    priceOptions:
      priceOptions.length > 0
        ? priceOptions
        : [
            priceOption(
              generateId(),
              productId,
              500,
              25,
              exchangeRate,
              wholesaleGp,
              dealerGp,
              "500 MOQ",
              leadTime,
            ),
          ],
  };
}
