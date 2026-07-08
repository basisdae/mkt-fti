/**
 * Product catalog Excel export (read-only).
 * Does not write to the database or modify products.
 */
import type ExcelJS from "exceljs";
import { logActivity } from "@/lib/activity-log";
import { formatProductBrand } from "@/lib/brand-strategy";
import { PRODUCT_CATEGORY_LABELS, PRODUCT_STATUS_LABELS } from "@/lib/constants";
import { getEvaluationTotalScore } from "@/lib/evaluation-scorecard";
import {
  addExportMetaSheet,
  applyWorkbookIdentity,
  buildProductExportFileName,
  downloadWorkbook,
  exportCell,
  exportPercentPoints,
  finalizeDataSheet,
  styleExportHeader,
} from "@/lib/export-standard";
import { formatLeadTimeDays } from "@/lib/lead-time";
import { calculatePricing, getLowestMoqPriceTier } from "@/lib/pricing";
import {
  formatTagExportCell,
  type ProductTagGroupWithTags,
} from "@/lib/product-tags";
import type { ProductView } from "@/types/product";

/** Column headers for future Excel import mapping. */
export function productMasterTagColumnHeaders(
  groups: ProductTagGroupWithTags[],
): string[] {
  return groups.map((group) => `Tag: ${group.name}`);
}

function imageUrls(product: ProductView): string {
  const urls: string[] = [];
  if (product.imageUrl?.trim()) urls.push(product.imageUrl.trim());
  for (const image of product.images ?? []) {
    const url = image.url?.trim();
    if (url && !urls.includes(url)) urls.push(url);
  }
  return urls.join(" | ");
}

function moqTiersLabel(product: ProductView): string {
  const tiers = product.priceOptions ?? product.moqTiers ?? [];
  if (tiers.length === 0) return "";
  return tiers
    .map((tier) => {
      const moq = Number(tier.moq);
      return Number.isFinite(moq) ? String(moq) : "";
    })
    .filter(Boolean)
    .join(" | ");
}

function classificationLabel(
  product: ProductView,
  tagGroups: ProductTagGroupWithTags[],
): string {
  const parts = tagGroups
    .map((group) => formatTagExportCell(product.tagLinks, group.key, ", "))
    .filter(Boolean);
  return parts.join(" · ");
}

export async function exportProductMasterExcel(
  products: ProductView[],
  tagGroups: ProductTagGroupWithTags[],
): Promise<string> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const generatedAt = new Date();
  applyWorkbookIdentity(workbook, "MKT HQ Product Export", generatedAt);

  addExportMetaSheet(
    workbook,
    "MKT HQ — Product Export",
    [
      ["Products exported", products.length],
      ["Sheets", "Products, MOQ Tiers, Tag Import Guide"],
    ],
    generatedAt,
  );

  const tagHeaders = productMasterTagColumnHeaders(tagGroups);
  const headers = [
    "SKU",
    "Product Name",
    "Brand",
    "Supplier",
    "Model",
    "Category",
    "Status",
    "Score",
    "MOQ Tiers",
    "MOQ (Primary)",
    "Cost",
    "FTI Price",
    "Dealer Price",
    "GP",
    "Lead Time",
    "Classification",
    "Certificates",
    "ISO",
    ...tagHeaders,
    "Notes",
    "Image URLs",
  ];

  const sheet = workbook.addWorksheet("Products");
  sheet.addRow(headers);
  styleExportHeader(sheet.getRow(1));

  for (const product of products) {
    try {
      const tier = getLowestMoqPriceTier(product.priceOptions);
      const pricing = tier ? calculatePricing(tier) : null;
      const categoryLabel =
        PRODUCT_CATEGORY_LABELS[product.category] ?? product.category ?? "";
      const tagCells = tagGroups.map((group) =>
        formatTagExportCell(product.tagLinks, group.key, "|"),
      );

      sheet.addRow([
        exportCell(product.code),
        exportCell(product.name),
        exportCell(formatProductBrand(product.brand)),
        exportCell(product.supplier),
        "", // Model — not stored on product yet
        exportCell(categoryLabel),
        exportCell(PRODUCT_STATUS_LABELS[product.status] ?? product.status),
        exportCell(getEvaluationTotalScore(product.evaluationScorecard)),
        exportCell(moqTiersLabel(product)),
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
        tier ? exportCell(formatLeadTimeDays(tier.leadTime)) : "",
        exportCell(classificationLabel(product, tagGroups)),
        exportCell((product.certification?.certifications ?? []).join(" | ")),
        exportCell((product.certification?.iso ?? []).join(" | ")),
        ...tagCells.map((cell) => exportCell(cell)),
        exportCell(product.latestNote || product.description || ""),
        exportCell(imageUrls(product)),
      ]);
    } catch {
      sheet.addRow([
        exportCell(product.code),
        exportCell(product.name),
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        ...tagGroups.map(() => ""),
        "",
        "",
      ]);
    }
  }

  const priceStart = 11;
  finalizeDataSheet(sheet, {
    priceColumns: [priceStart, priceStart + 1, priceStart + 2],
    percentColumns: [priceStart + 3],
    moqColumns: [10],
    maxWidth: 48,
  });

  // Detail sheet: one row per MOQ tier
  const tierSheet = workbook.addWorksheet("MOQ Tiers");
  const tierHeaders = [
    "SKU",
    "Product Name",
    "Supplier",
    "MOQ",
    "Tier Label",
    "Cost",
    "FTI Price",
    "Dealer Price",
    "GP",
    "Lead Time",
  ];
  tierSheet.addRow(tierHeaders);
  styleExportHeader(tierSheet.getRow(1));

  for (const product of products) {
    const tiers = product.priceOptions ?? product.moqTiers ?? [];
    if (tiers.length === 0) {
      tierSheet.addRow([
        exportCell(product.code),
        exportCell(product.name),
        exportCell(product.supplier),
        "",
        "",
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
        tierSheet.addRow([
          exportCell(product.code),
          exportCell(product.name),
          exportCell(product.supplier),
          exportCell(tier.moq),
          exportCell(tier.label ?? ""),
          Math.round(pricing.costThb),
          Math.round(pricing.ftiSellingPrice),
          Math.round(pricing.dealerSellingPrice),
          exportPercentPoints(pricing.wholesaleGpPercent),
          exportCell(formatLeadTimeDays(tier.leadTime)),
        ]);
      } catch {
        tierSheet.addRow([
          exportCell(product.code),
          exportCell(product.name),
          exportCell(product.supplier),
          exportCell(tier.moq),
          exportCell(tier.label ?? ""),
          "",
          "",
          "",
          "",
          "",
        ]);
      }
    }
  }

  finalizeDataSheet(tierSheet, {
    priceColumns: [6, 7, 8],
    percentColumns: [9],
    moqColumns: [4],
  });

  const guide = workbook.addWorksheet("Tag Import Guide");
  guide.addRow(["Group Key", "Group Name", "Example Cell Value", "Separators"]);
  styleExportHeader(guide.getRow(1));
  for (const group of tagGroups) {
    const sample = group.tags
      .filter((tag) => tag.value !== "other")
      .slice(0, 3)
      .map((tag) => tag.label)
      .join("|");
    guide.addRow([
      group.key,
      group.name,
      sample || "TagA|TagB",
      "Pipe | or comma , or semicolon ;",
    ]);
  }
  finalizeDataSheet(guide);

  const fileName = buildProductExportFileName(generatedAt);
  await downloadWorkbook(workbook, fileName);

  void logActivity({
    action: "export.product_master",
    entityType: "export",
    entityId: fileName,
    entityName: fileName,
    metadata: { productCount: products.length },
  });

  return fileName;
}
