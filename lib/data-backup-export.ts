/**
 * Read-only full-data backup export.
 * Uses SELECT only — never inserts, updates, or deletes.
 * Sales Plan Projects are read from localStorage only (no mutation).
 */
import type ExcelJS from "exceljs";
import { logActivity } from "@/lib/activity-log";
import {
  addExportMetaSheet,
  applyWorkbookIdentity,
  buildBackupExportFileName,
  downloadWorkbook,
  exportCell,
  finalizeDataSheet,
  styleExportHeader,
} from "@/lib/export-standard";
import { listSalesProjects } from "@/lib/sales-projects";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type RowRecord = Record<string, unknown>;

export interface DataBackupResult {
  fileName: string;
  sheetCounts: Record<string, number>;
  warnings: string[];
}

/** Read-only fetch; missing tables become empty with a warning. */
async function selectAll(
  table: string,
): Promise<{ rows: RowRecord[]; warning?: string }> {
  if (!isSupabaseConfigured()) {
    return {
      rows: [],
      warning: `${table}: Supabase is not configured`,
    };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase.from(table).select("*");
    if (error) {
      return {
        rows: [],
        warning: `${table}: ${error.message}`,
      };
    }
    return { rows: (data ?? []) as RowRecord[] };
  } catch (err) {
    return {
      rows: [],
      warning:
        err instanceof Error
          ? `${table}: ${err.message}`
          : `${table}: failed to load`,
    };
  }
}

function cellValue(value: unknown): ExcelJS.CellValue {
  if (value == null) return "";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (value instanceof Date) return value.toISOString();
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function addSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  rows: RowRecord[],
): number {
  const sheet = workbook.addWorksheet(name);

  if (rows.length === 0) {
    sheet.addRow(["(no rows)"]);
    styleExportHeader(sheet.getRow(1));
    finalizeDataSheet(sheet);
    return 0;
  }

  const columns = [
    ...new Set(rows.flatMap((row) => Object.keys(row))),
  ].sort();

  sheet.addRow(columns);
  styleExportHeader(sheet.getRow(1));

  for (const row of rows) {
    sheet.addRow(columns.map((key) => cellValue(row[key])));
  }

  finalizeDataSheet(sheet, { maxWidth: 40 });
  return rows.length;
}

function addSalesPlanProjectsSheet(workbook: ExcelJS.Workbook): number {
  const sheet = workbook.addWorksheet("sales_plan_projects");
  const headers = [
    "id",
    "name",
    "description",
    "status",
    "createdAt",
    "updatedAt",
    "lastSavedAt",
    "productCount",
    "estimatedRevenue",
    "estimatedGp",
    "productId",
    "tierId",
    "targetRevenue",
    "expectedQty",
    "scenarioRowsJson",
    "notesJson",
  ];
  sheet.addRow(headers);
  styleExportHeader(sheet.getRow(1));

  let projects: ReturnType<typeof listSalesProjects> = [];
  try {
    projects = listSalesProjects({ includeArchived: true });
  } catch {
    projects = [];
  }

  for (const project of projects) {
    try {
      sheet.addRow([
        exportCell(project.id),
        exportCell(project.name),
        exportCell(project.description),
        exportCell(project.status),
        exportCell(project.createdAt),
        exportCell(project.updatedAt),
        exportCell(project.lastSavedAt),
        exportCell(project.summary.productCount),
        exportCell(project.summary.estimatedRevenue),
        exportCell(project.summary.estimatedGp),
        exportCell(project.productId),
        exportCell(project.tierId),
        exportCell(project.targetRevenue),
        exportCell(project.expectedQty),
        exportCell(JSON.stringify(project.scenarioRows ?? [])),
        exportCell(JSON.stringify(project.notes ?? {})),
      ]);
    } catch {
      sheet.addRow([exportCell(project.id), exportCell(project.name)]);
    }
  }

  finalizeDataSheet(sheet, {
    priceColumns: [9, 10, 13],
    moqColumns: [8, 14],
    maxWidth: 48,
  });

  return projects.length;
}

/**
 * Export core operational tables to Excel (metadata only for images).
 * Read-only: no database mutations. Sales plans read from localStorage only.
 */
export async function exportFullDataBackup(): Promise<DataBackupResult> {
  const warnings: string[] = [];
  const loaded: { name: string; rows: RowRecord[] }[] = [];

  if (!isSupabaseConfigured()) {
    warnings.push(
      "Supabase is not configured — product/supplier tables are empty in this backup.",
    );
  } else {
    const tables = [
      "products",
      "product_moq_prices",
      "suppliers",
      "supplier_contacts",
      "product_images",
      "product_tag_groups",
      "product_tags",
      "product_tag_links",
    ] as const;

    for (const table of tables) {
      const result = await selectAll(table);
      if (result.warning) warnings.push(result.warning);
      loaded.push({ name: table, rows: result.rows });
    }
  }

  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const generatedAt = new Date();
  applyWorkbookIdentity(workbook, "MKT HQ Data Backup", generatedAt);

  addExportMetaSheet(
    workbook,
    "MKT HQ — Data Backup",
    [
      [
        "Contents",
        "Products, MOQ prices, suppliers, contacts, image metadata, tags, sales plan projects (local)",
      ],
      [
        "Images",
        "Metadata and URLs only — binary files are not included",
      ],
      [
        "Sales Plan Projects",
        "Read from browser localStorage (mkt_sales_projects)",
      ],
    ],
    generatedAt,
  );

  const sheetCounts: Record<string, number> = {};
  for (const item of loaded) {
    sheetCounts[item.name] = addSheet(workbook, item.name, item.rows);
  }

  sheetCounts.sales_plan_projects = addSalesPlanProjectsSheet(workbook);

  if (warnings.length > 0) {
    const warnSheet = workbook.addWorksheet("_warnings");
    warnSheet.addRow(["warning"]);
    styleExportHeader(warnSheet.getRow(1));
    for (const warning of warnings) {
      warnSheet.addRow([warning]);
    }
    finalizeDataSheet(warnSheet, { maxWidth: 80 });
  }

  const fileName = buildBackupExportFileName(generatedAt);
  await downloadWorkbook(workbook, fileName);

  void logActivity({
    action: "export.backup",
    entityType: "export",
    entityId: fileName,
    entityName: fileName,
    metadata: { sheetCounts, warningCount: warnings.length },
  });

  return { fileName, sheetCounts, warnings };
}
