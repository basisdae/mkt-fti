/**
 * Product Excel import template — download only.
 * Does not read or write product records in the database.
 */
import type ExcelJS from "exceljs";

export const PRODUCT_IMPORT_TEMPLATE_FILE_NAME =
  "MKT_HQ_Product_Import_Template.xlsx";

export const PRODUCT_IMPORT_TEMPLATE_HEADERS = [
  "SKU",
  "Product Name",
  "Brand",
  "Supplier",
  "Model",
  "Category",
  "MOQ",
  "Cost",
  "FTI Price",
  "Dealer Price",
  "GP",
  "Status",
  "Score",
  "Country",
  "Factory",
  "Certificate",
  "ISO",
  "Classification",
  "Image URL",
  "Notes",
] as const;

const EXAMPLE_ROW = [
  "RO-2520",
  "RO Countertop 2520",
  "FTI",
  "ABC Factory Co.",
  "2520",
  "Water Purifier",
  "100",
  "1200",
  "2100",
  "2450",
  "34",
  "interested",
  "80",
  "Thailand",
  "ABC Factory Co.",
  "CE|RoHS",
  "ISO 9001",
  "RO",
  "",
  "Sample row — replace with real data",
] as const;

const INSTRUCTIONS: string[] = [
  "Identity: provide at least ONE of SKU, Product Name, or Model.",
  "All other columns are optional. Incomplete rows import as Draft.",
  "Warnings (missing brand, supplier, MOQ, pricing, images, certificates, classification) do not block import.",
  "Critical errors (no identity, corrupted/invalid file) skip the row.",
  "Draft products appear in Missing Data Center for later completion.",
  "Price fields (Cost, FTI Price, Dealer Price, GP) should be numbers only (no currency symbols).",
  "MOQ must be a number (units) when provided.",
  "Certificate and ISO may list multiple values separated by | or comma.",
  "Delete the example row before preparing your real file.",
];

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF7A1F2B" },
  };
  row.alignment = { vertical: "middle", wrapText: true };
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Generate and download the product import Excel template (no DB access). */
export async function downloadProductImportTemplate(): Promise<string> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MKT Headquarter";
  workbook.created = new Date();

  const products = workbook.addWorksheet("Products");
  products.addRow([...PRODUCT_IMPORT_TEMPLATE_HEADERS]);
  styleHeader(products.getRow(1));
  products.addRow([...EXAMPLE_ROW]);

  products.columns.forEach((column, index) => {
    const header = PRODUCT_IMPORT_TEMPLATE_HEADERS[index] ?? "";
    column.width = Math.min(Math.max(header.length + 2, 12), 28);
  });
  products.views = [{ state: "frozen", ySplit: 1 }];

  const instructions = workbook.addWorksheet("Instructions");
  instructions.addRow(["Instructions"]);
  styleHeader(instructions.getRow(1));
  instructions.getColumn(1).width = 88;

  for (const line of INSTRUCTIONS) {
    instructions.addRow([line]);
  }

  instructions.addRow([]);
  instructions.addRow(["Column list"]);
  instructions.getRow(instructions.rowCount).font = { bold: true };
  for (const header of PRODUCT_IMPORT_TEMPLATE_HEADERS) {
    instructions.addRow([header]);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, PRODUCT_IMPORT_TEMPLATE_FILE_NAME);
  return PRODUCT_IMPORT_TEMPLATE_FILE_NAME;
}
