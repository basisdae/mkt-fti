import type {
  GiftPlanItemInput,
  PurchaseGroupCompatibilityIssue,
} from "@/types/gift-plan";

function normText(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function normCost(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

export function checkPurchaseGroupCompatibility(
  items: Pick<
    GiftPlanItemInput,
    "supplier" | "source" | "unit_actual_cost" | "specification" | "notes"
  >[],
): PurchaseGroupCompatibilityIssue[] {
  if (items.length < 2) return [];

  const issues: PurchaseGroupCompatibilityIssue[] = [];
  const first = items[0]!;

  const suppliers = new Set(items.map((item) => normText(item.supplier)));
  if (suppliers.size > 1) {
    issues.push({
      field: "supplier",
      message: "Selected items have different suppliers.",
    });
  }

  const sources = new Set(items.map((item) => item.source));
  if (sources.size > 1) {
    issues.push({
      field: "source",
      message: "Selected items have different sources.",
    });
  }

  const costs = new Set(items.map((item) => normCost(item.unit_actual_cost)));
  if (costs.size > 1) {
    issues.push({
      field: "unit_actual_cost",
      message: "Selected items have different unit actual costs.",
    });
  }

  const specs = new Set(
    items.map((item) =>
      normText(
        "specification" in item && typeof item.specification === "string"
          ? item.specification
          : item.notes,
      ),
    ),
  );
  if (specs.size > 1) {
    issues.push({
      field: "specification",
      message: "Selected items have different specifications/notes.",
    });
  }

  if (issues.length === 0 && !first) {
    return issues;
  }

  return issues;
}

export function canGroupWithoutConfirm(
  items: Pick<
    GiftPlanItemInput,
    "supplier" | "source" | "unit_actual_cost" | "specification" | "notes"
  >[],
): boolean {
  return checkPurchaseGroupCompatibility(items).length === 0;
}
