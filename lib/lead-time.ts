/** Extract numeric days from values like "25", "25 days", "45 day". */
export function parseLeadTimeDays(value: string | null | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed || trimmed === "—") return "";
  const match = trimmed.match(/(\d+)/);
  return match?.[1] ?? "";
}

/** Persist numeric days only, or "—" when empty. */
export function serializeLeadTimeDays(value: string | null | undefined): string {
  const days = parseLeadTimeDays(value);
  return days || "—";
}

/** Display as "{n} days", or "—" when empty. */
export function formatLeadTimeDays(value: string | null | undefined): string {
  const days = parseLeadTimeDays(value);
  if (!days) return "—";
  return `${days} days`;
}
