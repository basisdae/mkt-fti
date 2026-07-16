export function parseGiftPlanNumber(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "").trim();
  if (!cleaned) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

export function formatGiftPlanNumberInput(
  value: number | null | undefined,
  options?: { maxFractionDigits?: number },
): string {
  if (value == null || !Number.isFinite(value)) return "";
  return value.toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: options?.maxFractionDigits ?? 4,
  });
}

export function parseGiftPlanInteger(raw: string): number | null {
  const parsed = parseGiftPlanNumber(raw);
  if (parsed == null) return null;
  const rounded = Math.floor(parsed);
  return rounded >= 0 ? rounded : null;
}

export function formatGiftPlanIntegerInput(
  value: number | null | undefined,
): string {
  if (value == null || !Number.isFinite(value)) return "";
  return Math.floor(value).toLocaleString("th-TH");
}
