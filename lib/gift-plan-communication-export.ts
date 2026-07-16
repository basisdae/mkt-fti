import type ExcelJS from "exceljs";
import {
  buildGiftPlanCommunicationExportFileName,
  exportCell,
  EXPORT_HEADER_FILL,
  EXPORT_HEADER_FONT,
  getExportDateParts,
} from "@/lib/export-standard";
import { formatGiftMoney, formatGiftQty } from "@/lib/gift-plan-format";
import type { GiftPlanCommunicationReport } from "@/types/gift-plan";

function styleHeaderRow(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: EXPORT_HEADER_FONT } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: EXPORT_HEADER_FILL },
  };
  row.alignment = { vertical: "middle", wrapText: true };
}

export async function exportCommunicationWorkbook(
  report: GiftPlanCommunicationReport,
): Promise<{ fileName: string; buffer: ArrayBuffer }> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MKT HQ";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Sales Communication");
  sheet.addRow([
    "Tier",
    "Sales Threshold",
    "Gift Item",
    "Quantity per Customer",
    "Voucher Value",
    "Estimated Gift Value per Unit",
    "Estimated Value per Customer",
    "Total Estimated Gift Value per Customer",
    "Gift Policy",
    "Public Conditions",
  ]);
  styleHeaderRow(sheet.getRow(1));

  for (const tier of report.tiers) {
    if (tier.items.length === 0) {
      sheet.addRow([
        tier.name,
        tier.sales_threshold_label,
        "",
        "",
        "",
        "",
        "",
        tier.total_estimated_value_per_customer,
        tier.gift_policy,
        tier.public_conditions,
      ]);
      continue;
    }

    for (const item of tier.items) {
      sheet.addRow([
        tier.name,
        tier.sales_threshold_label,
        item.gift_name,
        formatGiftQty(item.qty_per_customer),
        item.voucher_value != null ? formatGiftMoney(item.voucher_value) : "",
        formatGiftMoney(item.estimated_gift_value_per_unit),
        formatGiftMoney(item.estimated_value_per_customer),
        formatGiftMoney(tier.total_estimated_value_per_customer),
        tier.gift_policy,
        tier.public_conditions,
      ]);
    }
  }

  sheet.columns.forEach((col) => {
    col.width = 22;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return {
    fileName: buildGiftPlanCommunicationExportFileName(
      report.campaign_name,
      report.campaign_year,
    ),
    buffer,
  };
}

export function downloadCommunicationExport(
  buffer: ArrayBuffer,
  fileName: string,
) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function formatCommunicationGeneratedLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

export function communicationPrintTitle(report: GiftPlanCommunicationReport): string {
  const { datePart } = getExportDateParts(new Date(report.generated_at));
  return `Gift_Plan_Communication_${report.campaign_name}_${report.campaign_year}_${datePart}`;
}
