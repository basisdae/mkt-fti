import type { ProductPerformance } from "@/types/product";
import { sanitizeNumericInput } from "@/lib/product-specification";

/** Structured performance metrics stored at specification.performance (numeric strings). */
export function createEmptyProductPerformance(): ProductPerformance {
  return {
    gpd: "",
    ratedFlowLh: "",
    capacityL: "",
  };
}

export function normalizePerformanceField(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value !== "string") return "";
  return sanitizeNumericInput(value.trim());
}

export function normalizeProductPerformance(
  input?: Partial<ProductPerformance> | Record<string, unknown> | null,
): ProductPerformance {
  const empty = createEmptyProductPerformance();
  if (!input || typeof input !== "object") return empty;

  const raw = input as Record<string, unknown>;
  return {
    gpd: normalizePerformanceField(raw.gpd),
    ratedFlowLh: normalizePerformanceField(raw.ratedFlowLh),
    capacityL: normalizePerformanceField(raw.capacityL),
  };
}

export function hasProductPerformance(
  performance?: ProductPerformance | null,
): boolean {
  const perf = normalizeProductPerformance(performance);
  return Boolean(perf.gpd || perf.ratedFlowLh || perf.capacityL);
}

export function formatGpdDisplay(gpd: string): string {
  const value = normalizePerformanceField(gpd);
  return value ? `${value} GPD` : "—";
}

export function formatRatedFlowLhDisplay(ratedFlowLh: string): string {
  const value = normalizePerformanceField(ratedFlowLh);
  return value ? `${value} L/H` : "—";
}

export function formatCapacityLDisplay(capacityL: string): string {
  const value = normalizePerformanceField(capacityL);
  return value ? `${value} L` : "—";
}

/** Search tokens for product list / global search (e.g. "75 gpd"). */
export function getProductPerformanceSearchTokens(
  performance?: ProductPerformance | null,
): string[] {
  const perf = normalizeProductPerformance(performance);
  const tokens: string[] = [];

  if (perf.gpd) {
    tokens.push(perf.gpd, `${perf.gpd} gpd`, `${perf.gpd}GPD`);
  }
  if (perf.ratedFlowLh) {
    tokens.push(perf.ratedFlowLh, `${perf.ratedFlowLh} l/h`, `${perf.ratedFlowLh}L/H`);
  }
  if (perf.capacityL) {
    tokens.push(perf.capacityL, `${perf.capacityL} l`, `${perf.capacityL}L`);
  }

  return tokens;
}

export function getProductPerformanceFromSpecification(
  specification?: { performance?: ProductPerformance | null } | null,
): ProductPerformance {
  return normalizeProductPerformance(specification?.performance);
}
