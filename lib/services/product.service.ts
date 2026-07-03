import { createProduct, emptyProductCertification, priceOption } from "@/lib/product-builder";
import { defaultBrandStrategy } from "@/lib/brand-strategy";
import { createEmptyEvaluationScorecard } from "@/lib/evaluation-scorecard";
import { generateId } from "@/lib/generate-id";
import { syncCoverFields } from "@/lib/product-gallery";
import type { ProductCreateBundle } from "@/lib/repositories/types";
import {
  createMoqRow,
  type NewProductFormData,
} from "@/types/product-form";
import type {
  OemType,
  Product,
  ProductGalleryImage,
  ProductStatus,
  ProductView,
} from "@/types/product";

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
  const leadTime = form.leadTime.trim() || "—";
  const images = options.images ?? [];
  const cover = syncCoverFields(images, form.productName.trim());
  const notes = form.notes.trim();
  const productSystem = form.productSystem.trim();
  const brand = form.brand.trim();

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
    certification: emptyProductCertification(form.certifications),
    brandStrategy: {
      factory: options.supplierName,
      internalProjectName: form.productName.trim(),
      businessUnit: productSystem,
      reason: "",
    },
  });

  const product = {
    ...base,
    brandStrategy: defaultBrandStrategy({
      ...base.brandStrategy,
      factory: options.supplierName,
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

  return {
    productName: product.name,
    brand: emptyPlaceholder(product.brand),
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
    leadTime:
      firstTier?.leadTime && firstTier.leadTime !== "—"
        ? firstTier.leadTime
        : "",
    oemAvailable: product.customOptions.oem,
    odmAvailable: product.customOptions.odm,
    packagingCustom: product.customOptions.packagingCustom,
    colorCustom: product.customOptions.colorCustom,
    specCustom: product.customOptions.specCustom,
    certifications: [...product.certification.certifications],
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
  const leadTime = form.leadTime.trim() || "—";
  const images = options.images ?? existing.images ?? [];
  const cover = syncCoverFields(images, form.productName.trim());
  const notes = form.notes.trim();
  const productSystem = form.productSystem.trim();
  const brand = form.brand.trim();

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
    certification: emptyProductCertification(form.certifications),
    brandStrategy: {
      ...existing.brandStrategy,
      factory: options.supplierName,
      internalProjectName: form.productName.trim(),
      businessUnit: productSystem,
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
