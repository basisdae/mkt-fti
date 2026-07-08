/**
 * Sales Plan Project Excel export (read-only).
 * Does not modify localStorage projects or product data.
 */
import type { ScenarioRow } from "@/lib/pricing";
import { calculatePricing, sumScenarioRows } from "@/lib/pricing";
import type { ProductView } from "@/types/product";
import { formatProductBrand } from "@/lib/brand-strategy";
import {
  addExportMetaSheet,
  applyWorkbookIdentity,
  buildComparisonExportFileName,
  buildSalesPlanExportFileName,
  downloadWorkbook,
  exportCell,
  exportPercentPoints,
  finalizeDataSheet,
  styleExportHeader,
} from "@/lib/export-standard";
import {
  EMPTY_SIMULATOR_NOTES,
  type SimulatorPlanNotes,
} from "@/lib/simulator-plans";

export interface SimulatorPlanExportInput {
  name: string;
  createdAt: string;
  updatedAt: string;
  productId: string;
  tierId: string;
  targetRevenue: number;
  expectedQty: number;
  scenarioRows: ScenarioRow[];
  notes?: SimulatorPlanNotes;
  description?: string;
}

function displayDate(iso: string): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString();
  } catch {
    return "";
  }
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Export sales plan project to Excel.
 * Sheets: Summary, Product Items, Monthly Tracking, Assumptions / Notes
 */
export async function exportSimulatorPlanExcel(
  plan: SimulatorPlanExportInput,
  products: ProductView[],
): Promise<string> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const generatedAt = new Date();
  applyWorkbookIdentity(workbook, "MKT HQ Sales Plan Export", generatedAt);

  const byId = new Map(products.map((product) => [product.id, product]));
  const totals = sumScenarioRows(plan.scenarioRows ?? []);
  const totalTargetSales = (plan.scenarioRows ?? []).reduce(
    (sum, row) => sum + (Number(row.targetRevenue) || 0),
    0,
  );

  addExportMetaSheet(
    workbook,
    "MKT HQ — Sales Plan Project Export",
    [
      ["Project name", plan.name || ""],
      ["Product items", (plan.scenarioRows ?? []).length],
      [
        "Sheets",
        "Summary, Product Items, Monthly Tracking, Assumptions / Notes",
      ],
    ],
    generatedAt,
  );

  // Sheet 1: Summary
  const summary = workbook.addWorksheet("Summary");
  summary.getColumn(1).width = 28;
  summary.getColumn(2).width = 40;
  summary.getCell("A1").value = "Sales Plan Project — Summary";
  summary.getCell("A1").font = {
    bold: true,
    size: 14,
    color: { argb: "FF7A1F2B" },
  };

  const summaryRows: Array<[string, string | number]> = [
    ["Project name", plan.name || ""],
    ["Description", plan.description || ""],
    ["Created date", displayDate(plan.createdAt)],
    ["Updated date", displayDate(plan.updatedAt)],
    ["Product count", (plan.scenarioRows ?? []).length],
    ["Total target sales", totalTargetSales],
    ["Estimated revenue", totals.revenue],
    ["Estimated cost", totals.totalCost],
    ["Estimated GP", totals.grossProfit],
    ["GP %", exportPercentPoints(totals.grossProfitPercent)],
  ];

  summaryRows.forEach(([label, value], index) => {
    const row = index + 3;
    summary.getCell(`A${row}`).value = label;
    summary.getCell(`A${row}`).font = { bold: true, color: { argb: "FF4B5563" } };
    summary.getCell(`B${row}`).value = value;
    if (
      typeof value === "number" &&
      label !== "GP %" &&
      label !== "Product count"
    ) {
      summary.getCell(`B${row}`).numFmt = "#,##0";
    }
    if (label === "GP %") {
      summary.getCell(`B${row}`).numFmt = "0.00%";
    }
  });

  // Sheet 2: Product Items
  const items = workbook.addWorksheet("Product Items");
  const itemHeaders = [
    "Product name",
    "Supplier",
    "Brand",
    "MOQ",
    "Quantity",
    "Cost",
    "FTI Price",
    "Dealer Price",
    "Revenue",
    "Cost Total",
    "Profit",
    "GP %",
  ];
  items.addRow(itemHeaders);
  styleExportHeader(items.getRow(1));

  for (const row of plan.scenarioRows ?? []) {
    try {
      const product = byId.get(row.productId);
      const tier =
        product?.priceOptions.find((option) => option.id === row.moqTierId) ??
        product?.priceOptions[0];
      const tierPricing = tier ? calculatePricing(tier) : null;

      items.addRow([
        exportCell(row.productName || product?.name),
        exportCell(product?.supplier),
        product ? exportCell(formatProductBrand(product.brand)) : "",
        exportCell(row.moq || tier?.moq),
        exportCell(row.qty),
        exportCell(row.unitCost),
        exportCell(row.sellingPrice),
        tierPricing ? Math.round(tierPricing.dealerSellingPrice) : "",
        exportCell(row.revenue),
        exportCell(row.totalCost),
        exportCell(row.grossProfit),
        exportPercentPoints(row.grossProfitPercent),
      ]);
    } catch {
      items.addRow([
        exportCell(row.productName),
        "",
        "",
        "",
        exportCell(row.qty),
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ]);
    }
  }

  finalizeDataSheet(items, {
    priceColumns: [6, 7, 8, 9, 10, 11],
    percentColumns: [12],
    moqColumns: [4, 5],
  });

  // Sheet 3: Monthly Tracking (template prefilled with equal monthly targets)
  const monthly = workbook.addWorksheet("Monthly Tracking");
  monthly.addRow([
    "Month",
    "Target Revenue",
    "Actual Revenue",
    "Variance",
    "Notes",
  ]);
  styleExportHeader(monthly.getRow(1));

  const monthlyTarget =
    totals.revenue > 0 ? Math.round(totals.revenue / 12) : "";
  for (const month of MONTHS) {
    monthly.addRow([month, monthlyTarget, "", "", ""]);
  }
  finalizeDataSheet(monthly, {
    priceColumns: [2, 3, 4],
  });
  // Variance formula for user fill-in (Actual - Target)
  for (let r = 2; r <= 13; r++) {
    monthly.getCell(`D${r}`).value = {
      formula: `IF(OR(C${r}="",B${r}=""),"",C${r}-B${r})`,
    };
    monthly.getCell(`D${r}`).numFmt = "#,##0";
  }

  // Sheet 4: Assumptions / Notes
  const notes = workbook.addWorksheet("Assumptions / Notes");
  notes.addRow(["Field", "Value"]);
  styleExportHeader(notes.getRow(1));

  const selectedProduct = byId.get(plan.productId);
  const selectedTier =
    selectedProduct?.priceOptions.find((option) => option.id === plan.tierId) ??
    selectedProduct?.priceOptions[0];
  const notesData = plan.notes ?? EMPTY_SIMULATOR_NOTES;

  const assumptionRows: Array<[string, string | number]> = [
    ["Sales target (unit input)", plan.targetRevenue ?? ""],
    ["Expected quantity (unit input)", plan.expectedQty ?? ""],
    ["Selected product", selectedProduct?.name || plan.productId || ""],
    [
      "Pricing tier (MOQ)",
      selectedTier
        ? `${selectedTier.moq.toLocaleString()} pcs${selectedTier.label ? ` · ${selectedTier.label}` : ""}`
        : plan.tierId || "",
    ],
    ["Scenario rows", (plan.scenarioRows ?? []).length],
    ["Campaign Objective", notesData.campaignObjective || ""],
    ["Target Customer / Dealer Group", notesData.targetCustomer || ""],
    ["Key Assumptions", notesData.keyAssumptions || ""],
    ["Risks", notesData.risks || ""],
    ["Follow-up Actions", notesData.followUpActions || ""],
    [
      "Export note",
      "Exported from MKT HQ Sales Plan Projects. Project data is local to the browser unless shared via this file.",
    ],
  ];

  for (const [field, value] of assumptionRows) {
    notes.addRow([field, exportCell(value)]);
  }
  notes.getRow(2).getCell(2).numFmt = "#,##0";
  notes.getRow(3).getCell(2).numFmt = "#,##0";
  finalizeDataSheet(notes, { maxWidth: 56 });

  const fileName = buildSalesPlanExportFileName(plan.name || "Project", generatedAt);
  await downloadWorkbook(workbook, fileName);

  try {
    const { logActivity } = await import("@/lib/activity-log");
    void logActivity({
      action: "export.sales_plan",
      entityType: "export",
      entityId: fileName,
      entityName: fileName,
      metadata: { projectName: plan.name, rowCount: (plan.scenarioRows ?? []).length },
    });
  } catch {
    // Activity log is optional; export already succeeded.
  }

  return fileName;
}

/** Export a side-by-side comparison of 2–4 plans (read-only). */
export async function exportSimulatorPlanComparison(
  plans: SimulatorPlanExportInput[],
): Promise<string> {
  const { buildPlanCompareRows } = await import("@/lib/simulator-plan-compare");
  const compareRows = buildPlanCompareRows(
    plans.map((plan, index) => ({
      id: `export-${index}`,
      name: plan.name,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      productId: plan.productId,
      tierId: plan.tierId,
      targetRevenue: plan.targetRevenue,
      expectedQty: plan.expectedQty,
      scenarioRows: plan.scenarioRows ?? [],
      notes: plan.notes ?? EMPTY_SIMULATOR_NOTES,
      summary: {
        productCount: (plan.scenarioRows ?? []).length,
        totalTargetRevenue: (plan.scenarioRows ?? []).reduce(
          (sum, row) => sum + (Number(row.targetRevenue) || 0),
          0,
        ),
        totalRevenue: sumScenarioRows(plan.scenarioRows ?? []).revenue,
      },
    })),
  );

  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const generatedAt = new Date();
  applyWorkbookIdentity(workbook, "MKT HQ Sales Plan Comparison", generatedAt);

  addExportMetaSheet(
    workbook,
    "MKT HQ — Sales Plan Comparison",
    [["Plans compared", plans.length]],
    generatedAt,
  );

  const sheet = workbook.addWorksheet("Comparison");
  const headers = [
    "Plan name",
    "Updated date",
    "Product count",
    "Total target sales",
    "Total estimated revenue",
    "Total cost",
    "Gross profit",
    "GP %",
    "Risks count",
  ];
  sheet.addRow(headers);
  styleExportHeader(sheet.getRow(1));

  for (const row of compareRows) {
    sheet.addRow([
      exportCell(row.plan.name),
      displayDate(row.plan.updatedAt),
      exportCell(row.productCount),
      exportCell(row.totalTargetSales),
      exportCell(row.totalRevenue),
      exportCell(row.totalCost),
      exportCell(row.grossProfit),
      exportPercentPoints(row.gpPercent),
      exportCell(row.risksCount),
    ]);
  }

  finalizeDataSheet(sheet, {
    priceColumns: [4, 5, 6, 7],
    percentColumns: [8],
  });

  const fileName = buildComparisonExportFileName(generatedAt);
  await downloadWorkbook(workbook, fileName);
  return fileName;
}
