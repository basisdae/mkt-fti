/**
 * Apply validated import rows to the products table (Supabase).
 * Incomplete rows are saved as status "draft".
 * Missing optional fields stay empty/null — no invented pricing.
 */
import { defaultBrandStrategy } from "@/lib/brand-strategy";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants";
import { createEmptyEvaluationScorecard } from "@/lib/evaluation-scorecard";
import { generateId } from "@/lib/generate-id";
import {
  createProduct,
  emptyProductCertification,
  priceOption,
} from "@/lib/product-builder";
import type { ProductCreateBundle } from "@/lib/repositories/types";
import { loadExistingProductIdentities } from "@/lib/product-import-duplicates";
import {
  createProductInSupabase,
  isProductSupabaseEnabled,
} from "@/lib/services/product-persist";
import {
  applyDuplicateChecks,
  type ImportRunSummary,
  type ImportFieldKey,
  type ValidatedImportRow,
} from "@/lib/product-import-validate";
import type { PipelineStage, ProductStatus } from "@/types/product";

function cell(
  values: ValidatedImportRow["values"],
  key: ImportFieldKey,
): string {
  return (values[key] ?? "").trim();
}

function parseNumber(raw: string): number | null {
  if (!raw.trim()) return null;
  const cleaned = raw.replace(/,/g, "").replace(/%/g, "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function resolveCategory(raw: string): string {
  const text = raw.trim().toLowerCase();
  if (!text) return "";
  for (const [key, label] of Object.entries(PRODUCT_CATEGORY_LABELS)) {
    if (key === text || label.toLowerCase() === text) return key;
  }
  return raw.trim();
}

function splitList(raw: string): string[] {
  return raw
    .split(/[|,;]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function resolveCode(row: ValidatedImportRow): string {
  const sku = cell(row.values, "SKU");
  if (sku) return sku;
  const model = cell(row.values, "Model");
  if (model) return `MDL-${model}`.slice(0, 40);
  const name = cell(row.values, "Product Name");
  if (!name) return "";
  const slug = name
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 16)
    .toUpperCase();
  return `${slug || "PRD"}-${String(Date.now()).slice(-4)}`;
}

function resolveName(row: ValidatedImportRow): string {
  return (
    cell(row.values, "Product Name") ||
    cell(row.values, "Model") ||
    cell(row.values, "SKU")
  );
}

function buildPriceOptions(
  productId: string,
  row: ValidatedImportRow,
): ProductCreateBundle["priceOptions"] {
  const moq = parseNumber(cell(row.values, "MOQ"));
  const cost = parseNumber(cell(row.values, "Cost"));
  if (moq == null || moq <= 0 || cost == null || cost < 0) {
    return [];
  }

  const gpRaw = parseNumber(cell(row.values, "GP"));
  const wholesaleGp =
    gpRaw == null ? 0 : gpRaw > 1 ? gpRaw / 100 : gpRaw;

  return [
    priceOption(
      generateId(),
      productId,
      Math.round(moq),
      cost,
      1,
      wholesaleGp,
      0,
      `${Math.round(moq)} MOQ`,
      "",
    ),
  ];
}

function formatImportError(err: unknown): string {
  if (err && typeof err === "object") {
    const record = err as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };
    const parts = [
      record.message,
      record.details,
      record.hint,
      record.code ? `code ${record.code}` : "",
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(" — ");
  }
  if (err instanceof Error) return err.message;
  return "Failed to import this row";
}

export function buildBundleFromImportRow(
  row: ValidatedImportRow,
): ProductCreateBundle {
  const productId = generateId();
  const now = new Date().toISOString();
  const name = resolveName(row);
  const code = resolveCode(row);
  const supplier = cell(row.values, "Supplier");
  const factory = cell(row.values, "Factory");
  const brand = cell(row.values, "Brand");
  const notes = cell(row.values, "Notes");
  const imageUrl = cell(row.values, "Image URL") || null;
  const certs = splitList(cell(row.values, "Certificate"));
  const iso = splitList(cell(row.values, "ISO"));
  const model = cell(row.values, "Model");
  const country = cell(row.values, "Country");

  const status: ProductStatus = row.markAsDraft ? "draft" : "interested";
  const pipelineStage: PipelineStage =
    status === "draft" ? "interested" : status;

  const product = {
    ...createProduct({
      id: productId,
      name,
      code,
      supplier,
      supplierId: null,
      brand,
      factoryLocation: country,
      category: resolveCategory(cell(row.values, "Category")),
      description: notes,
      opportunityScore: 0,
      latestNote: notes,
      updatedAt: now,
      businessType: "",
      oemType: "OEM",
      factoryContact: "",
      productSystem: model,
      packagingNotes: "",
      marginTarget: 0,
      annualVolumeTarget: 0,
      imageUrl,
      imageAlt: name,
      images: imageUrl
        ? [
            {
              id: generateId(),
              url: imageUrl,
              alt: name,
              sortOrder: 0,
              isCover: true,
            },
          ]
        : [],
      certifications: certs,
      certification: emptyProductCertification(certs, iso),
      brandStrategy: {
        factory: factory || supplier,
        internalProjectName: name,
        businessUnit: model,
        reason: "",
        currentBrand: null,
      },
    }),
    brandStrategy: defaultBrandStrategy({
      factory: factory || supplier,
      internalProjectName: name,
      businessUnit: model,
      reason: "",
      currentBrand: null,
    }),
    evaluationScorecard: createEmptyEvaluationScorecard(),
  };

  if (!country && !supplier && !factory) {
    product.factoryLocation = "";
  }

  return {
    product,
    status: {
      productId,
      status,
      pipelineStage,
      updatedAt: now,
    },
    priceOptions: buildPriceOptions(productId, row),
  };
}

/**
 * Import valid rows into Supabase products (+ MOQ prices when present).
 * Duplicates are skipped only — existing products are never updated.
 * Updates local catalog only after each successful DB write.
 */
export async function applyProductImport(
  rows: ValidatedImportRow[],
  registerLocally: (bundle: ProductCreateBundle) => void,
): Promise<ImportRunSummary> {
  const summary: ImportRunSummary = {
    imported: 0,
    warnings: 0,
    criticalErrors: 0,
    skippedDuplicates: 0,
    skipped: 0,
    importedIds: [],
    draftIds: [],
    errors: [],
  };

  if (!isProductSupabaseEnabled()) {
    throw new Error(
      "Supabase is not configured. Product import requires a database connection.",
    );
  }

  // Fresh catalog check at import time (skip-only, no updates).
  const existing = await loadExistingProductIdentities();
  const checkedRows = applyDuplicateChecks(
    rows.map((row) => ({
      ...row,
      issues: row.issues.filter((issue) => issue.level !== "duplicate"),
    })),
    existing,
  );

  for (const row of checkedRows) {
    if (row.isDuplicate) {
      summary.skippedDuplicates += 1;
      summary.skipped += 1;
      const duplicate = row.issues.find((issue) => issue.level === "duplicate");
      const message =
        duplicate?.message.replace(/\s*\(Will be skipped\)\s*$/i, "") ??
        "Duplicate product found";
      summary.errors.push({
        rowNumber: row.rowNumber,
        message,
      });
      continue;
    }

    if (!row.canImport) {
      summary.criticalErrors += 1;
      summary.skipped += 1;
      const critical = row.issues.find((issue) => issue.level === "critical");
      summary.errors.push({
        rowNumber: row.rowNumber,
        message: critical?.message ?? "Row skipped",
      });
      continue;
    }

    try {
      const bundle = buildBundleFromImportRow(row);
      if (!bundle.product.name.trim()) {
        summary.criticalErrors += 1;
        summary.skipped += 1;
        summary.errors.push({
          rowNumber: row.rowNumber,
          message: "Cannot identify product — empty name after mapping.",
        });
        continue;
      }

      await createProductInSupabase(bundle);
      registerLocally(bundle);

      summary.imported += 1;
      summary.importedIds.push(bundle.product.id);
      if (row.hasWarnings || row.markAsDraft) {
        summary.warnings += 1;
        summary.draftIds.push(bundle.product.id);
      }
    } catch (err) {
      console.error("product import error", err);
      summary.skipped += 1;
      summary.criticalErrors += 1;
      summary.errors.push({
        rowNumber: row.rowNumber,
        message: formatImportError(err),
      });
    }
  }

  return summary;
}
