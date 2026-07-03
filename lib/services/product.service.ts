import { createProduct, priceOption } from "@/lib/product-builder";
import { defaultBrandStrategy } from "@/lib/brand-strategy";
import { createEmptyEvaluationScorecard } from "@/lib/evaluation-scorecard";
import type { ProductCreateBundle } from "@/lib/repositories/types";
import type { NewProductFormData } from "@/types/product-form";
import type { OemType, ProductStatus } from "@/types/product";

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
    imageUrl?: string | null;
    imageAlt?: string;
    supplierName: string;
    supplierId: string | null;
  },
): ProductCreateBundle {
  const now = new Date().toISOString();
  const productId = `prod-${Date.now()}`;
  const code = slugCode(form.productName);
  const status = (form.status || "interested") as ProductStatus;
  const usdCost = parseFloat(form.usdCost) || 0;
  const exchangeRate = parseFloat(form.exchangeRate) || 36;
  const wholesaleGp = (parseFloat(form.wholesaleGp) || 42) / 100;
  const dealerGp = (parseFloat(form.dealerGp) || 14) / 100;
  const leadTime = form.leadTime.trim() || "—";

  const base = createProduct({
    id: productId,
    name: form.productName.trim(),
    code,
    supplier: options.supplierName,
    supplierId: options.supplierId,
    brand: form.brand.trim() || "—",
    category: form.category,
    description: form.notes.trim() || "—",
    opportunityScore: 0,
    latestNote: form.notes.trim() || "—",
    updatedAt: now,
    businessType: "New Product",
    oemType: inferOemType(form),
    factoryContact: "",
    productSystem: form.productSystem || "—",
    packagingNotes: "",
    marginTarget: Math.round(wholesaleGp * 100),
    annualVolumeTarget: 0,
    imageUrl: options.imageUrl ?? null,
    imageAlt: options.imageAlt || form.productName.trim(),
    certifications: form.certifications,
    brandStrategy: {
      factory: options.supplierName,
      internalProjectName: form.productName.trim(),
      businessUnit: form.productSystem || "—",
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
    .filter((row) => row.quantity.trim())
    .map((row, index) =>
      priceOption(
        row.id || `moq-${productId}-${index}`,
        productId,
        parseInt(row.quantity, 10) || 0,
        usdCost,
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
              `moq-${productId}-default`,
              productId,
              500,
              usdCost || 25,
              exchangeRate,
              wholesaleGp,
              dealerGp,
              "500 MOQ",
              leadTime,
            ),
          ],
  };
}
