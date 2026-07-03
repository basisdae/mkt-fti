import { calculatePricing } from "@/lib/pricing";
import { createMoqRow, type MoqOptionRow } from "@/types/product-form";

export function moqRowHasValues(
  row: Pick<MoqOptionRow, "quantity" | "usdPerUnit" | "label">,
): boolean {
  return (
    row.quantity.trim() !== "" ||
    row.usdPerUnit.trim() !== "" ||
    row.label.trim() !== ""
  );
}

export function clearMoqRow(row: MoqOptionRow): MoqOptionRow {
  return { ...row, quantity: "", usdPerUnit: "", label: "" };
}

export function ensureTrailingEmptyMoqRow(rows: MoqOptionRow[]): MoqOptionRow[] {
  if (rows.length === 0) return [createMoqRow()];
  const last = rows[rows.length - 1]!;
  if (moqRowHasValues(last)) return [...rows, createMoqRow()];
  return rows;
}

export interface MoqRowPreview {
  moq: number;
  usdPerUnit: number;
  usdTotal: number;
  thbPerUnit: number;
  ftiSellingPrice: number;
  dealerSellingPrice: number;
}

export function computeMoqRowPreview(
  row: Pick<MoqOptionRow, "quantity" | "usdPerUnit">,
  exchangeRate: number,
  wholesaleGpPercent: number,
  dealerGpPercent: number,
): MoqRowPreview | null {
  const moq = parseFloat(row.quantity);
  const usdPerUnit = parseFloat(row.usdPerUnit);
  if (!Number.isFinite(moq) || moq <= 0 || !Number.isFinite(usdPerUnit) || usdPerUnit < 0) {
    return null;
  }

  const wholesaleGp = wholesaleGpPercent / 100;
  const dealerGp = dealerGpPercent / 100;
  if (wholesaleGp >= 1 || dealerGp >= 1) return null;

  const pricing = calculatePricing({
    id: "preview",
    productId: "preview",
    moq,
    usdCost: usdPerUnit,
    exchangeRate,
    wholesaleGp,
    dealerGp,
    leadTime: "—",
  });

  return {
    moq,
    usdPerUnit,
    usdTotal: moq * usdPerUnit,
    thbPerUnit: pricing.costThb,
    ftiSellingPrice: pricing.ftiSellingPrice,
    dealerSellingPrice: pricing.dealerSellingPrice,
  };
}

export function parseMoqPaste(
  text: string,
): Array<{ quantity: string; usdPerUnit: string }> {
  return text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const tabParts = line
        .split("\t")
        .map((part) => part.trim())
        .filter(Boolean);
      if (tabParts.length >= 2) {
        return { quantity: tabParts[0]!, usdPerUnit: tabParts[1]! };
      }

      const spaceParts = line.split(/\s+/).filter(Boolean);
      if (spaceParts.length >= 2) {
        return { quantity: spaceParts[0]!, usdPerUnit: spaceParts[1]! };
      }

      return null;
    })
    .filter(
      (row): row is { quantity: string; usdPerUnit: string } => row !== null,
    );
}

export function isMultiRowMoqPaste(text: string): boolean {
  return text.includes("\n") || text.includes("\t") || /\s+\S+\s+\S+/.test(text);
}
