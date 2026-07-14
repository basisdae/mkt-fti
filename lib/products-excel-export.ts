/**
 * Products list Excel export (read-only).
 * Does not write to the database or modify products.
 */
import type ExcelJS from "exceljs";
import { logActivity } from "@/lib/activity-log";
import { formatProductBrand } from "@/lib/brand-strategy";
import { PRODUCT_STATUS_LABELS } from "@/lib/constants";
import {
  getEvaluationStatusLabel,
  getEvaluationTotalScore,
} from "@/lib/evaluation-scorecard";
import {
  applyWorkbookIdentity,
  buildProductsListExportFileName,
  downloadWorkbook,
  exportCell,
  exportPercentPoints,
  EXPORT_VERSION_LABEL,
  finalizeDataSheet,
  getExportDateParts,
  styleExportHeader,
} from "@/lib/export-standard";
import { formatLeadTimeDays } from "@/lib/lead-time";
import { formatOutputFunctionExportCell } from "@/lib/output-function";
import { formatPipelineStep } from "@/lib/pipeline";
import { calculatePricing, getLowestMoqPriceTier } from "@/lib/pricing";
import { PRODUCT_RELATION_TYPE_LABELS } from "@/lib/product-related";
import { getProductPerformanceFromSpecification } from "@/lib/product-performance";
import {
  PRODUCT_SPEC_STATUS_LABELS,
  resolveProductSpecStatus,
} from "@/lib/product-specification";
import {
  describeActiveFilters,
  describePipelineStatuses,
  getScopeFileNameSlug,
  PRODUCTS_EXPORT_SCOPE_LABELS,
  type ProductsExportScope,
} from "@/lib/products-export-scope";
import type { ProductFilterState } from "@/lib/product-filters";
import { loadProductsExportBatchData } from "@/lib/services/products-export-data";
import type { ProductWaterTreatmentContext } from "@/lib/services/water-treatment";
import {
  buildSystemSequence,
  WATER_MAIN_SYSTEMS,
} from "@/lib/water-treatment";
import type {
  ProductFiltrationStage,
  ProductRelatedLink,
  ProductRelationType,
  ProductStatus,
  ProductView,
} from "@/types/product";

const EXPORT_CURRENCY = "THB";
const PRICE_NUM_FMT = "#,##0.00";

export interface ProductsListExportInput {
  products: ProductView[];
  scope: ProductsExportScope;
  filters: ProductFilterState;
  pipelineStatuses: ProductStatus[];
  selectedCount: number;
  generatedBy?: string;
}

function formatExportDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

function formatMainWaterSystems(
  context: ProductWaterTreatmentContext | undefined,
): string {
  const systems = context?.config?.mainSystems ?? [];
  if (systems.length === 0) return "";
  const labels = new Map(
    WATER_MAIN_SYSTEMS.map((item) => [item.value, item.label]),
  );
  return systems.map((system) => labels.get(system) ?? system).join(", ");
}

function productLookupLabel(
  productId: string,
  byId: Map<string, ProductView>,
): string {
  const product = byId.get(productId);
  if (!product) return productId;
  const code = product.code?.trim();
  const name = product.name?.trim();
  if (code && name) return `${code} — ${name}`;
  return code || name || productId;
}

function relatedProductsByType(
  links: ProductRelatedLink[],
  relationType: ProductRelationType,
  byId: Map<string, ProductView>,
): string {
  return links
    .filter((link) => link.relationType === relationType)
    .map((link) => {
      const product = byId.get(link.relatedProductId);
      return product?.code?.trim() || product?.name?.trim() || "";
    })
    .filter(Boolean)
    .join(" | ");
}

function replacementFields(
  stages: ProductFiltrationStage[],
  byId: Map<string, ProductView>,
): { skus: string; costs: string } {
  const replaceable = stages.filter(
    (stage) => stage.replaceable && stage.relatedProductId,
  );
  const skus: string[] = [];
  const costs: string[] = [];

  for (const stage of replaceable) {
    const related = byId.get(stage.relatedProductId!);
    if (!related) continue;
    const sku = related.code?.trim();
    if (sku) skus.push(sku);
    const tier = getLowestMoqPriceTier(related.priceOptions);
    const cost = tier
      ? Math.round(calculatePricing(tier).costThb)
      : Math.round(related.costThb);
    if (Number.isFinite(cost)) costs.push(String(cost));
  }

  return { skus: skus.join(" | "), costs: costs.join(" | ") };
}

function oemAvailableLabel(product: ProductView): string {
  return product.customOptions?.oem ? "Yes" : "No";
}

function imageUrl(product: ProductView): string {
  return product.imageUrl?.trim() || "";
}

function buildProductListRow(
  product: ProductView,
  byId: Map<string, ProductView>,
  linksByProductId: Map<string, ProductRelatedLink[]>,
  waterTreatmentByProductId: Map<string, ProductWaterTreatmentContext>,
): Array<string | number | boolean> {
  const tier = getLowestMoqPriceTier(product.priceOptions);
  const pricing = tier ? calculatePricing(tier) : null;
  const performance = getProductPerformanceFromSpecification(
    product.specification,
  );
  const score = getEvaluationTotalScore(product.evaluationScorecard);
  const outgoing = linksByProductId.get(product.id) ?? [];
  const waterContext = waterTreatmentByProductId.get(product.id);
  const stages = waterContext?.stages ?? [];
  const replacements = replacementFields(stages, byId);

  return [
    exportCell(product.code),
    exportCell(product.name),
    exportCell(product.productSystem),
    exportCell(formatProductBrand(product.brand)),
    exportCell(product.supplier),
    exportCell(product.brandStrategy.factory),
    exportCell(product.brandStrategy.businessUnit),
    exportCell(PRODUCT_STATUS_LABELS[product.status] ?? product.status),
    exportCell(formatPipelineStep(product.pipelineStage)),
    exportCell(score),
    exportCell(getEvaluationStatusLabel(score)),
    tier ? exportCell(tier.moq) : "",
    pricing ? Math.round(pricing.costThb) : exportCell(product.costThb),
    pricing
      ? Math.round(pricing.ftiSellingPrice)
      : exportCell(product.ftiSellingPrice),
    pricing
      ? Math.round(pricing.dealerSellingPrice)
      : exportCell(product.dealerPrice),
    pricing
      ? exportPercentPoints(pricing.wholesaleGpPercent)
      : exportPercentPoints(product.gpPercent),
    EXPORT_CURRENCY,
    tier ? exportCell(formatLeadTimeDays(tier.leadTime)) : "",
    exportCell(oemAvailableLabel(product)),
    exportCell(formatOutputFunctionExportCell(product.tagLinks)),
    exportCell(performance.gpd),
    exportCell(performance.ratedFlowLh),
    exportCell(performance.capacityL),
    exportCell(formatMainWaterSystems(waterContext)),
    stages.length > 0 ? exportCell(stages.length) : "",
    exportCell(buildSystemSequence(stages)),
    exportCell(relatedProductsByType(outgoing, "consumable", byId)),
    exportCell(relatedProductsByType(outgoing, "spare_part", byId)),
    exportCell(replacements.skus),
    exportCell(replacements.costs),
    exportCell(relatedProductsByType(outgoing, "compatible", byId)),
    exportCell((product.certification?.certifications ?? []).join(" | ")),
    exportCell((product.certification?.iso ?? []).join(" | ")),
    exportCell(
      PRODUCT_SPEC_STATUS_LABELS[resolveProductSpecStatus(product)] ??
        resolveProductSpecStatus(product),
    ),
    exportCell(imageUrl(product)),
    exportCell(formatExportDateTime(product.updatedAt)),
    exportCell(product.latestNote || product.description || ""),
  ];
}

const PRODUCT_LIST_HEADERS = [
  "Item Code / SKU",
  "Product Name",
  "Model",
  "Brand",
  "Supplier",
  "Factory",
  "Business Unit",
  "Status",
  "Pipeline Step",
  "Score",
  "Priority",
  "Lowest MOQ",
  "Cost per Unit",
  "FTI Selling Price",
  "Dealer Price",
  "GP",
  "Currency",
  "Lead Time",
  "OEM Available",
  "Output Function",
  "GPD",
  "Rated Flow",
  "Capacity",
  "Main Water System",
  "Filtration Stage Count",
  "Filtration Sequence",
  "Consumables",
  "Spare Parts",
  "Replacement Filter SKU",
  "Replacement Cost",
  "Compatible Products",
  "Certificates",
  "ISO",
  "Spec Status",
  "Main Image URL",
  "Updated At",
  "Notes",
];

export async function exportProductsListExcel(
  input: ProductsListExportInput,
): Promise<string> {
  const {
    products,
    scope,
    filters,
    pipelineStatuses,
    selectedCount,
    generatedBy,
  } = input;

  if (products.length === 0) {
    throw new Error("No products to export.");
  }

  const productIds = new Set(products.map((product) => product.id));
  const byId = new Map(products.map((product) => [product.id, product]));
  const batchData = await loadProductsExportBatchData(productIds);

  const linksByProductId = new Map<string, ProductRelatedLink[]>();
  for (const link of batchData.relatedLinks) {
    const existing = linksByProductId.get(link.productId) ?? [];
    existing.push(link);
    linksByProductId.set(link.productId, existing);
  }

  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const generatedAt = new Date();
  applyWorkbookIdentity(workbook, "MKT HQ Products Export", generatedAt);

  const productSheet = workbook.addWorksheet("Product List");
  productSheet.addRow(PRODUCT_LIST_HEADERS);
  styleExportHeader(productSheet.getRow(1));

  for (const product of products) {
    try {
      productSheet.addRow(
        buildProductListRow(
          product,
          byId,
          linksByProductId,
          batchData.waterTreatmentByProductId,
        ),
      );
    } catch (err) {
      console.error("Product export row failed:", product.id, err);
      productSheet.addRow([
        exportCell(product.code),
        exportCell(product.name),
        ...PRODUCT_LIST_HEADERS.slice(2).map(() => ""),
      ]);
    }
  }

  finalizeDataSheet(productSheet, {
    priceColumns: [13, 14, 15],
    percentColumns: [16],
    moqColumns: [12],
    maxWidth: 48,
  });

  for (let row = 2; row <= productSheet.rowCount; row++) {
    for (const col of [13, 14, 15, 30]) {
      const cell = productSheet.getRow(row).getCell(col);
      if (typeof cell.value === "number") {
        cell.numFmt = PRICE_NUM_FMT;
      }
    }
  }

  const moqSheet = workbook.addWorksheet("MOQ Pricing");
  const moqHeaders = [
    "Product SKU",
    "Product Name",
    "MOQ",
    "Cost",
    "FTI Price",
    "Dealer Price",
    "GP",
  ];
  moqSheet.addRow(moqHeaders);
  styleExportHeader(moqSheet.getRow(1));

  for (const product of products) {
    const tiers = product.priceOptions ?? product.moqTiers ?? [];
    if (tiers.length === 0) {
      moqSheet.addRow([
        exportCell(product.code),
        exportCell(product.name),
        "",
        "",
        "",
        "",
        "",
      ]);
      continue;
    }

    for (const tier of tiers) {
      try {
        const pricing = calculatePricing(tier);
        moqSheet.addRow([
          exportCell(product.code),
          exportCell(product.name),
          exportCell(tier.moq),
          Math.round(pricing.costThb),
          Math.round(pricing.ftiSellingPrice),
          Math.round(pricing.dealerSellingPrice),
          exportPercentPoints(pricing.wholesaleGpPercent),
        ]);
      } catch (err) {
        console.error("MOQ export row failed:", product.id, err);
        moqSheet.addRow([
          exportCell(product.code),
          exportCell(product.name),
          exportCell(tier.moq),
          "",
          "",
          "",
          "",
        ]);
      }
    }
  }

  finalizeDataSheet(moqSheet, {
    priceColumns: [4, 5, 6],
    percentColumns: [7],
    moqColumns: [3],
  });

  for (let row = 2; row <= moqSheet.rowCount; row++) {
    for (const col of [4, 5, 6]) {
      const cell = moqSheet.getRow(row).getCell(col);
      if (typeof cell.value === "number") {
        cell.numFmt = PRICE_NUM_FMT;
      }
    }
  }

  const relatedSheet = workbook.addWorksheet("Related Products");
  relatedSheet.addRow([
    "Source Product",
    "Relation Type",
    "Related Product",
    "Quantity",
    "Notes",
  ]);
  styleExportHeader(relatedSheet.getRow(1));

  for (const link of batchData.relatedLinks) {
    const source = byId.get(link.productId);
    const related = byId.get(link.relatedProductId);
    if (!source || !related) continue;

    relatedSheet.addRow([
      exportCell(source.code || source.name),
      exportCell(
        PRODUCT_RELATION_TYPE_LABELS[link.relationType] ?? link.relationType,
      ),
      exportCell(related.code || related.name),
      "",
      "",
    ]);
  }

  finalizeDataSheet(relatedSheet, { maxWidth: 48 });

  const parts = getExportDateParts(generatedAt);
  const infoSheet = workbook.addWorksheet("Export Info");
  infoSheet.getColumn(1).width = 28;
  infoSheet.getColumn(2).width = 56;

  infoSheet.getCell("A1").value = "MKT HQ — Products Export";
  infoSheet.getCell("A1").font = { bold: true, size: 14 };

  const infoRows: Array<[string, string | number]> = [
    ["Export Scope", PRODUCTS_EXPORT_SCOPE_LABELS[scope]],
    ["Products Exported", products.length],
    ["Selected Pipeline Steps", describePipelineStatuses(pipelineStatuses)],
    ["Current Filters", describeActiveFilters(filters)],
    ["Generated Date/Time", parts.display],
    ["Generated By", generatedBy?.trim() || EXPORT_VERSION_LABEL],
    ["MKT HQ Version", EXPORT_VERSION_LABEL],
    ["Mode", "Read-only export (no database changes)"],
  ];

  infoRows.forEach(([label, value], index) => {
    const row = index + 3;
    infoSheet.getCell(`A${row}`).value = label;
    infoSheet.getCell(`A${row}`).font = { bold: true };
    infoSheet.getCell(`B${row}`).value = value;
  });

  const scopeSlug = getScopeFileNameSlug(scope, {
    pipelineStatuses,
    selectedCount,
  });
  const fileName = buildProductsListExportFileName(scopeSlug, generatedAt);
  await downloadWorkbook(workbook, fileName);

  void logActivity({
    action: "export.products_list",
    entityType: "export",
    entityId: fileName,
    entityName: fileName,
    metadata: {
      scope,
      productCount: products.length,
      pipelineStatuses,
    },
  });

  return fileName;
}
