import type ExcelJS from "exceljs";
import {
  buildGiftPlanExportFileName,
  exportCell,
  EXPORT_HEADER_FILL,
  EXPORT_HEADER_FONT,
  getExportDateParts,
} from "@/lib/export-standard";
import {
  calcGiftCampaign,
  calcGiftItem,
  toCampaignCalcInput,
} from "@/lib/gift-plan-calculations";
import {
  GIFT_ITEM_CATEGORY_LABELS,
  GIFT_ITEM_SOURCE_LABELS,
  GIFT_PLAN_STATUS_LABELS,
  formatGiftMoney,
  formatGiftPercent,
  formatGiftQty,
} from "@/lib/gift-plan-format";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import { formatOperationalStatus } from "@/lib/gift-catalog-format";
import { buildCommunicationReport } from "@/lib/gift-plan-communication";
import type { GiftPlanEditorBundle } from "@/types/gift-plan";
import type { PurchasingSummaryRow } from "@/lib/gift-plan-calculations";

function styleHeaderRow(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: EXPORT_HEADER_FONT } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: EXPORT_HEADER_FILL },
  };
  row.alignment = { vertical: "middle", wrapText: true };
}

function addSheetTitle(
  sheet: ExcelJS.Worksheet,
  title: string,
  subtitle?: string,
) {
  sheet.mergeCells("A1", "F1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = title;
  titleCell.font = { bold: true, size: 14 };

  if (subtitle) {
    sheet.mergeCells("A2", "F2");
    sheet.getCell("A2").value = subtitle;
    sheet.getCell("A2").font = { italic: true, size: 10 };
  }
}

export async function exportGiftPlanWorkbook(input: {
  bundle: GiftPlanEditorBundle;
  purchasing: PurchasingSummaryRow[];
}): Promise<{ fileName: string; buffer: ArrayBuffer }> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MKT HQ";
  workbook.created = new Date();

  const { bundle, purchasing } = input;
  const campaign = calcGiftCampaign(
    toCampaignCalcInput(bundle.plan, bundle.tiers, bundle.items),
  );
  const { display } = getExportDateParts();

  const summarySheet = workbook.addWorksheet("Campaign Summary");
  addSheetTitle(
    summarySheet,
    bundle.plan.name,
    `Campaign Year ${bundle.plan.campaign_year} · Exported ${display}`,
  );
  const summaryRows: Array<[string, string | number]> = [
    ["Status", GIFT_PLAN_STATUS_LABELS[bundle.plan.status]],
    ["Owner", bundle.plan.owner],
    ["Total Customer Sales", formatGiftMoney(bundle.plan.total_customer_sales)],
    ["Total Customers", campaign.total_customers],
    ["Total Gift Units", campaign.total_gift_units],
    ["Total Actual Cost", formatGiftMoney(campaign.total_campaign_actual_cost)],
    [
      "Total Estimated Gift Value",
      formatGiftMoney(campaign.total_campaign_estimated_value),
    ],
    ["Budget Limit %", formatGiftPercent(bundle.plan.budget_limit_percent)],
    [
      "Max Actual Cost Budget",
      formatGiftMoney(bundle.plan.max_actual_cost_budget),
    ],
    [
      "Actual Gift Budget %",
      formatGiftPercent(campaign.actual_gift_budget_percent),
    ],
    [
      "Remaining Actual Cost Budget",
      formatGiftMoney(campaign.remaining_actual_cost_budget),
    ],
    ["Voucher Actual Cost", formatGiftMoney(campaign.total_voucher_actual_cost)],
    ["Premium Actual Cost", formatGiftMoney(campaign.total_premium_actual_cost)],
    ["Sales Gift Actual Cost", formatGiftMoney(campaign.total_sales_gift_actual_cost)],
  ];
  summarySheet.addRow([]);
  for (const [label, value] of summaryRows) {
    summarySheet.addRow([label, exportCell(value)]);
  }
  summarySheet.getColumn(1).width = 34;
  summarySheet.getColumn(2).width = 24;

  const tierSheet = workbook.addWorksheet("Tier Plan");
  tierSheet.addRow([
    "Tier",
    "Sort",
    "Sales Threshold",
    "Threshold Label",
    "Customers",
    "Actual / Customer",
    "Estimated / Customer",
    "Total Actual",
    "Total Estimated",
    "Gift Policy",
    "Notes",
  ]);
  styleHeaderRow(tierSheet.getRow(1));
  for (const tier of bundle.tiers.sort((a, b) => a.sort_order - b.sort_order)) {
    const calcTier = campaign.tiers.find((row) => row.id === tier.id);
    tierSheet.addRow([
      tier.name,
      tier.sort_order,
      tier.sales_threshold ?? "",
      tier.sales_threshold_label,
      tier.customer_count,
      calcTier?.actual_cost_per_customer ?? 0,
      calcTier?.estimated_value_per_customer ?? 0,
      calcTier?.total_actual_cost ?? 0,
      calcTier?.total_estimated_value ?? 0,
      tier.gift_policy,
      tier.notes,
    ]);
  }
  tierSheet.columns.forEach((col) => {
    col.width = 16;
  });

  const itemsSheet = workbook.addWorksheet("Gift Items");
  itemsSheet.addRow([
    "Tier",
    "Sort",
    "Gift Name",
    "Category",
    "Source",
    "Qty / Customer",
    "Unit Actual Cost",
    "Est. Value / Unit",
    "Supplier",
    "Purchase Group",
    "Notes",
    "Total Qty",
    "Total Actual",
    "Total Estimated",
  ]);
  styleHeaderRow(itemsSheet.getRow(1));
  const groupLabel = new Map(
    bundle.purchase_groups.map((group) => [group.id, group.label || group.id]),
  );
  for (const tier of bundle.tiers.sort((a, b) => a.sort_order - b.sort_order)) {
    const tierItems = bundle.items
      .filter((item) => item.tier_id === tier.id)
      .sort((a, b) => a.sort_order - b.sort_order);
    for (const item of tierItems) {
      const calc = calcGiftItem(
        {
          id: item.id,
          tier_id: item.tier_id,
          category: item.category,
          qty_per_customer: item.qty_per_customer,
          unit_actual_cost: item.unit_actual_cost,
          estimated_gift_value_per_unit: item.estimated_gift_value_per_unit,
          purchase_group_id: item.purchase_group_id,
        },
        tier.customer_count,
      );
      itemsSheet.addRow([
        tier.name,
        item.sort_order,
        item.gift_name,
        GIFT_ITEM_CATEGORY_LABELS[item.category],
        GIFT_ITEM_SOURCE_LABELS[item.source],
        formatGiftQty(item.qty_per_customer),
        item.unit_actual_cost,
        item.estimated_gift_value_per_unit,
        item.supplier ?? "",
        item.purchase_group_id
          ? groupLabel.get(item.purchase_group_id) ?? item.purchase_group_id
          : "",
        item.notes ?? "",
        calc.total_quantity,
        calc.total_actual_cost,
        calc.total_estimated_value,
      ]);
    }
  }

  const purchasingSheet = workbook.addWorksheet("Purchasing Summary");
  purchasingSheet.addRow([
    t.purchasingGiftItem,
    t.specification,
    t.purchasingSupplier,
    t.source,
    t.usedInTiers,
    t.baseRequiredQty,
    t.bufferPercentCol,
    t.bufferQtyCol,
    t.finalRequiredQty,
    t.purchasingUnitCost,
    t.baseActualCostCol,
    t.bufferCostCol,
    t.finalPurchaseCostCol,
    t.purchasingOperationalStatus,
    t.purchasingReferenceUrl,
    t.purchasingNotes,
  ]);
  styleHeaderRow(purchasingSheet.getRow(1));
  for (const row of purchasing) {
    const provisional =
      row.is_provisional_qty && row.base_required_qty_status !== "ready";
    const baseQty =
      row.base_required_qty_status === "pending"
        ? t.pendingCustomerCount
        : formatGiftQty(row.base_required_qty);
    const finalQty = provisional
      ? `${formatGiftQty(row.final_required_qty)} (${t.provisionalQtyLabel})`
      : formatGiftQty(row.final_required_qty);

    const dataRow = purchasingSheet.addRow([
      row.gift_name,
      row.specification ?? "",
      row.supplier ?? "",
      GIFT_ITEM_SOURCE_LABELS[row.source as keyof typeof GIFT_ITEM_SOURCE_LABELS] ??
        row.source,
      row.tier_names.join(", "),
      baseQty,
      formatGiftPercent(row.buffer_percentage),
      formatGiftQty(row.buffer_qty),
      finalQty,
      row.unit_actual_cost === "mixed" ? t.purchasingMixed : row.unit_actual_cost,
      row.base_actual_cost,
      row.buffer_actual_cost,
      row.final_purchase_cost,
      formatOperationalStatus(row.operational_status),
      row.reference_url ?? "",
      row.notes ?? "",
    ]);
    if (row.reference_url?.trim()) {
      const urlCell = dataRow.getCell(15);
      urlCell.value = {
        text: row.reference_url,
        hyperlink: row.reference_url,
      };
      urlCell.font = { color: { argb: "FF0563C1" }, underline: true };
    }
  }

  const communication = buildCommunicationReport(bundle);
  const commSheet = workbook.addWorksheet("Sales Communication");
  commSheet.addRow([
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
  styleHeaderRow(commSheet.getRow(1));
  for (const tier of communication.tiers) {
    for (const item of tier.items) {
      commSheet.addRow([
        tier.name,
        tier.sales_threshold_label,
        item.gift_name,
        formatGiftQty(item.qty_per_customer),
        item.voucher_value ?? "",
        item.estimated_gift_value_per_unit,
        item.estimated_value_per_customer,
        tier.total_estimated_value_per_customer,
        tier.gift_policy,
        tier.public_conditions,
      ]);
    }
  }

  const notesSheet = workbook.addWorksheet("Notes / Conditions");
  notesSheet.addRow(["Campaign Conditions", bundle.plan.campaign_conditions]);
  notesSheet.addRow(["Approval Notes", bundle.plan.approval_notes]);
  notesSheet.addRow(["Description", bundle.plan.description]);
  notesSheet.getColumn(1).width = 24;
  notesSheet.getColumn(2).width = 80;

  const buffer = await workbook.xlsx.writeBuffer();
  return {
    fileName: buildGiftPlanExportFileName(
      bundle.plan.name,
      bundle.plan.campaign_year,
    ),
    buffer,
  };
}

export function downloadGiftPlanExport(buffer: ArrayBuffer, fileName: string) {
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
