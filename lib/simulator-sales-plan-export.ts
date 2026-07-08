import type ExcelJS from "exceljs";
import type { ScenarioRow } from "@/lib/pricing";
import type { ProductView } from "@/types/product";

export interface SalesPlanExportRow {
  productCode: string;
  productName: string;
  supplierFactory: string;
  brand: string;
  moq: number;
  dealerPrice: number;
  targetQty: number;
  targetSales: number;
}

function formatFileDate(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function formatDisplayDate(date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function buildSalesPlanExportRows(
  scenarioRows: ScenarioRow[],
  products: ProductView[],
): SalesPlanExportRow[] {
  const byId = new Map(products.map((product) => [product.id, product]));

  return scenarioRows.map((row) => {
    const product = byId.get(row.productId);
    const dealerPrice = product?.dealerPrice ?? 0;
    const targetQty = row.qty;
    const targetSales = dealerPrice > 0 ? dealerPrice * targetQty : 0;

    return {
      productCode: product?.code?.trim() || "—",
      productName: product?.name?.trim() || row.productName,
      supplierFactory:
        product?.brandStrategy?.factory?.trim() ||
        product?.supplier?.trim() ||
        "—",
      brand: product?.brand?.trim() || "—",
      moq: row.moq || product?.moq || 0,
      dealerPrice,
      targetQty,
      targetSales,
    };
  });
}

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF7A1F2B" },
};

const EDITABLE_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFF8E7" },
};

const STATUS_OPTIONS = ["Not Started", "In Progress", "Completed", "Risk"];

/** Status from progress cell (0–1). Risk is manual override via dropdown. */
function statusFormula(progressCell: string): string {
  return `IF(${progressCell}=0,"Not Started",IF(${progressCell}<1,"In Progress","Completed"))`;
}

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  row.fill = HEADER_FILL;
  row.alignment = { vertical: "middle", wrapText: true, horizontal: "center" };
  row.height = 22;
}

function applyAutoFilter(sheet: ExcelJS.Worksheet, lastCol: number, lastRow: number) {
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(lastRow, 1), column: lastCol },
  };
}

function addStatusValidation(
  sheet: ExcelJS.Worksheet,
  range: string,
) {
  // exceljs typings vary; cast keeps runtime data-validation intact.
  (sheet as ExcelJS.Worksheet & {
    dataValidations: { add: (range: string, options: object) => void };
  }).dataValidations.add(range, {
    type: "list",
    allowBlank: true,
    formulae: [`"${STATUS_OPTIONS.join(",")}"`],
    showErrorMessage: true,
    errorTitle: "Status",
    error: "Select Not Started, In Progress, Completed, or Risk.",
  });
}

function addStatusConditionalFormatting(
  sheet: ExcelJS.Worksheet,
  columnLetter: string,
  lastDataRow: number,
) {
  const ref = `${columnLetter}2:${columnLetter}${lastDataRow}`;
  const rules: {
    text: string;
    fill: string;
    font: string;
  }[] = [
    { text: "Completed", fill: "FFDCFCE7", font: "FF166534" },
    { text: "In Progress", fill: "FFDBEAFE", font: "FF1E40AF" },
    { text: "Risk", fill: "FFFEE2E2", font: "FF991B1B" },
    { text: "Not Started", fill: "FFF3F4F6", font: "FF4B5563" },
  ];

  rules.forEach((rule, index) => {
    sheet.addConditionalFormatting({
      ref,
      rules: [
        {
          type: "expression",
          priority: index + 1,
          formulae: [`TRIM(${columnLetter}2)="${rule.text}"`],
          style: {
            fill: {
              type: "pattern",
              pattern: "solid",
              bgColor: { argb: rule.fill },
            },
            font: { color: { argb: rule.font } },
          },
        },
      ],
    });
  });
}

function applyColumnWidths(
  sheet: ExcelJS.Worksheet,
  widths: number[],
) {
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
}

export async function exportSalesPlanWorkbook(
  scenarioRows: ScenarioRow[],
  products: ProductView[],
): Promise<Blob> {
  const ExcelJS = (await import("exceljs")).default;
  const rows = buildSalesPlanExportRows(scenarioRows, products);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MKT Headquarter";
  workbook.created = new Date();

  const lastDataRow = Math.max(rows.length + 1, 2);
  const hasRows = rows.length > 0;

  // -------------------------------------------------------------------------
  // 1. Summary
  // -------------------------------------------------------------------------
  const summary = workbook.addWorksheet("Summary");
  applyColumnWidths(summary, [28, 22]);

  summary.getCell("A1").value = "Sales Execution Plan";
  summary.getCell("A1").font = {
    bold: true,
    size: 16,
    color: { argb: "FF7A1F2B" },
  };
  summary.mergeCells("A1:B1");

  summary.getCell("A3").value = "Generated From";
  summary.getCell("B3").value = "MKT Headquarter";
  summary.getCell("A4").value = "Generated Date";
  summary.getCell("B4").value = formatDisplayDate();

  // KPI block — formulas pull from Sales Plan (same column layout as before)
  summary.getCell("A6").value = "Total SKUs";
  summary.getCell("B6").value = hasRows
    ? { formula: `COUNTA('Sales Plan'!A2:A${lastDataRow})` }
    : 0;

  summary.getCell("A7").value = "Total Target Sales";
  summary.getCell("B7").value = hasRows
    ? { formula: `SUM('Sales Plan'!H2:H${lastDataRow})` }
    : 0;

  summary.getCell("A8").value = "Total Actual Sales";
  summary.getCell("B8").value = hasRows
    ? { formula: `SUM('Sales Plan'!J2:J${lastDataRow})` }
    : 0;

  summary.getCell("A9").value = "Overall Progress %";
  summary.getCell("B9").value = { formula: "IF(B7=0,0,B8/B7)" };

  summary.getCell("A10").value = "Remaining Sales";
  summary.getCell("B10").value = { formula: "B7-B8" };

  for (const row of [3, 4, 6, 7, 8, 9, 10]) {
    summary.getCell(`A${row}`).font = { bold: true, color: { argb: "FF374151" } };
    summary.getCell(`A${row}`).alignment = { vertical: "middle" };
  }

  summary.getCell("B6").numFmt = "#,##0";
  summary.getCell("B7").numFmt = "#,##0";
  summary.getCell("B8").numFmt = "#,##0";
  summary.getCell("B9").numFmt = "0.00%";
  summary.getCell("B10").numFmt = "#,##0";

  for (const row of [6, 7, 8, 9, 10]) {
    summary.getCell(`B${row}`).font = { bold: true, size: 12 };
    summary.getCell(`B${row}`).alignment = { horizontal: "right" };
  }

  summary.getCell("A12").value =
    "Yellow cells are for Sales input (Actual Qty, Note, monthly actuals). Target Sales, Actual Sales, Progress, Remaining, and Status use formulas. Status can be overridden via dropdown (including Risk). Internal cost and profit are not included.";
  summary.getCell("A12").font = {
    italic: true,
    color: { argb: "FF667085" },
    size: 10,
  };
  summary.getCell("A12").alignment = { wrapText: true, vertical: "top" };
  summary.mergeCells("A12:B14");
  summary.getRow(12).height = 48;

  // -------------------------------------------------------------------------
  // 2. Sales Plan
  // -------------------------------------------------------------------------
  const planSheet = workbook.addWorksheet("Sales Plan", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  // Column keys preserved for compatibility with existing exports/imports.
  planSheet.columns = [
    { header: "Product Code", key: "code", width: 14 },
    { header: "Product Name", key: "name", width: 28 },
    { header: "Supplier / Factory", key: "supplier", width: 24 },
    { header: "Brand", key: "brand", width: 14 },
    { header: "MOQ", key: "moq", width: 10 },
    { header: "Dealer Price", key: "dealerPrice", width: 14 },
    { header: "Target Qty", key: "targetQty", width: 12 },
    { header: "Target Sales", key: "targetSales", width: 14 },
    { header: "Actual Qty", key: "actualQty", width: 12 },
    { header: "Actual Sales", key: "actualSales", width: 14 },
    { header: "Progress %", key: "progress", width: 12 },
    { header: "Remaining Sales", key: "remaining", width: 14 },
    { header: "Status", key: "status", width: 14 },
    { header: "Note", key: "note", width: 24 },
  ];

  styleHeader(planSheet.getRow(1));
  applyAutoFilter(planSheet, 14, lastDataRow);

  rows.forEach((row, index) => {
    const excelRow = index + 2;
    planSheet.addRow({
      code: row.productCode,
      name: row.productName,
      supplier: row.supplierFactory,
      brand: row.brand,
      moq: row.moq,
      dealerPrice: row.dealerPrice,
      targetQty: row.targetQty,
      // Target Sales = Target Qty × Dealer Price (same as prior export math)
      targetSales: {
        formula: `IF(OR(F${excelRow}="",G${excelRow}=""),0,F${excelRow}*G${excelRow})`,
      },
      actualQty: null,
      // Actual Sales = Total Actual from Monthly Tracking (same SKU row)
      actualSales: {
        formula: `'Monthly Tracking'!P${excelRow}`,
      },
      progress: {
        formula: `IF(H${excelRow}=0,0,J${excelRow}/H${excelRow})`,
      },
      remaining: {
        formula: `H${excelRow}-J${excelRow}`,
      },
      status: { formula: statusFormula(`K${excelRow}`) },
      note: "",
    });

    const dataRow = planSheet.getRow(excelRow);
    dataRow.getCell("moq").numFmt = "#,##0";
    dataRow.getCell("dealerPrice").numFmt = "#,##0";
    dataRow.getCell("targetQty").numFmt = "#,##0";
    dataRow.getCell("targetSales").numFmt = "#,##0";
    dataRow.getCell("actualQty").numFmt = "#,##0";
    dataRow.getCell("actualSales").numFmt = "#,##0";
    dataRow.getCell("remaining").numFmt = "#,##0";
    dataRow.getCell("progress").numFmt = "0.00%";

    // Editable inputs only
    dataRow.getCell("actualQty").fill = EDITABLE_FILL;
    dataRow.getCell("note").fill = EDITABLE_FILL;
    dataRow.getCell("status").fill = EDITABLE_FILL;
  });

  if (hasRows) {
    addStatusValidation(planSheet, `M2:M${lastDataRow}`);
    addStatusConditionalFormatting(planSheet, "M", lastDataRow);
  }

  // -------------------------------------------------------------------------
  // 3. Monthly Tracking
  // -------------------------------------------------------------------------
  const monthly = workbook.addWorksheet("Monthly Tracking", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Existing columns preserved; Remaining + Status appended for usability.
  monthly.columns = [
    { header: "Product", key: "product", width: 28 },
    { header: "Target Qty", key: "targetQty", width: 12 },
    { header: "Target Sales", key: "targetSales", width: 14 },
    ...months.map((month) => ({
      header: month,
      key: month.toLowerCase(),
      width: 11,
    })),
    { header: "Total Actual", key: "totalActual", width: 14 },
    { header: "Progress %", key: "progress", width: 12 },
    { header: "Remaining", key: "remaining", width: 14 },
    { header: "Status", key: "status", width: 14 },
  ];

  styleHeader(monthly.getRow(1));
  applyAutoFilter(monthly, 19, lastDataRow);

  rows.forEach((row, index) => {
    const excelRow = index + 2;
    const values: Record<string, ExcelJS.CellValue> = {
      product: `${row.productCode} — ${row.productName}`,
      // Keep in sync with Sales Plan targets
      targetQty: { formula: `'Sales Plan'!G${excelRow}` },
      targetSales: { formula: `'Sales Plan'!H${excelRow}` },
      // D–O = Jan–Dec (user enters monthly actual sales only)
      totalActual: { formula: `SUM(D${excelRow}:O${excelRow})` },
      progress: {
        formula: `IF(C${excelRow}=0,0,P${excelRow}/C${excelRow})`,
      },
      remaining: {
        formula: `C${excelRow}-P${excelRow}`,
      },
      status: { formula: statusFormula(`Q${excelRow}`) },
    };

    for (const month of months) {
      values[month.toLowerCase()] = null;
    }

    monthly.addRow(values);
    const dataRow = monthly.getRow(excelRow);
    dataRow.getCell("targetQty").numFmt = "#,##0";
    dataRow.getCell("targetSales").numFmt = "#,##0";
    dataRow.getCell("totalActual").numFmt = "#,##0";
    dataRow.getCell("remaining").numFmt = "#,##0";
    dataRow.getCell("progress").numFmt = "0.00%";

    for (let col = 4; col <= 15; col++) {
      dataRow.getCell(col).numFmt = "#,##0";
      dataRow.getCell(col).fill = EDITABLE_FILL;
    }

    dataRow.getCell("status").fill = EDITABLE_FILL;
  });

  if (hasRows) {
    addStatusValidation(monthly, `S2:S${lastDataRow}`);
    addStatusConditionalFormatting(monthly, "S", lastDataRow);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function salesPlanFileName(date = new Date()): string {
  return `FTI_Sales_Plan_${formatFileDate(date)}.xlsx`;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
