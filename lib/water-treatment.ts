import type {
  FiltrationComponentType,
  ProductFiltrationStage,
  WaterMainSystem,
} from "@/types/product";

export const WATER_MAIN_SYSTEMS: {
  value: WaterMainSystem;
  label: string;
}[] = [
  { value: "ro", label: "RO" },
  { value: "uf", label: "UF" },
  { value: "nf", label: "NF" },
  { value: "mf", label: "MF" },
  { value: "uv", label: "UV" },
  { value: "carbon", label: "Carbon" },
  { value: "sediment", label: "Sediment" },
  { value: "softener", label: "Softener" },
  { value: "mineral", label: "Mineral" },
  { value: "alkaline", label: "Alkaline" },
  { value: "hydrogen", label: "Hydrogen" },
  { value: "other", label: "Other" },
];

export const FILTRATION_COMPONENT_TYPES: {
  value: FiltrationComponentType;
  label: string;
  shortLabel: string;
}[] = [
  { value: "pp_sediment", label: "PP Sediment", shortLabel: "PP" },
  { value: "cto_carbon", label: "CTO Carbon", shortLabel: "CTO" },
  { value: "gac_carbon", label: "GAC Carbon", shortLabel: "GAC" },
  { value: "ro_membrane", label: "RO Membrane", shortLabel: "RO" },
  { value: "uf_membrane", label: "UF Membrane", shortLabel: "UF" },
  { value: "nf_membrane", label: "NF Membrane", shortLabel: "NF" },
  { value: "mineral", label: "Mineral", shortLabel: "Mineral" },
  { value: "alkaline", label: "Alkaline", shortLabel: "Alkaline" },
  { value: "post_carbon", label: "Post Carbon", shortLabel: "Post Carbon" },
  { value: "resin", label: "Resin", shortLabel: "Resin" },
  { value: "softener", label: "Softener", shortLabel: "Softener" },
  { value: "uv", label: "UV", shortLabel: "UV" },
  { value: "other", label: "Other", shortLabel: "Other" },
];

const mainSystemLabels = new Map(
  WATER_MAIN_SYSTEMS.map((item) => [item.value, item.label]),
);

const componentShortLabels = new Map(
  FILTRATION_COMPONENT_TYPES.map((item) => [item.value, item.shortLabel]),
);

export function isWaterMainSystem(value: string): value is WaterMainSystem {
  return WATER_MAIN_SYSTEMS.some((item) => item.value === value);
}

export function isFiltrationComponentType(
  value: string,
): value is FiltrationComponentType {
  return FILTRATION_COMPONENT_TYPES.some((item) => item.value === value);
}

export function normalizeMainSystems(values: unknown): WaterMainSystem[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  const result: WaterMainSystem[] = [];
  for (const raw of values) {
    if (typeof raw !== "string") continue;
    const value = raw.trim().toLowerCase();
    if (!value || seen.has(value) || !isWaterMainSystem(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

export function stageSequenceLabel(stage: ProductFiltrationStage): string {
  const name = stage.displayName.trim();
  if (name) return name;
  return componentShortLabels.get(stage.componentType) ?? stage.componentType;
}

export function buildSystemSequence(stages: ProductFiltrationStage[]): string {
  const ordered = [...stages].sort((a, b) => a.sortOrder - b.sortOrder);
  const labels = ordered.map(stageSequenceLabel).filter(Boolean);
  return labels.join(" → ");
}

export function buildTechnicalSummary(
  mainSystems: WaterMainSystem[],
  stageCount: number,
): string {
  if (stageCount <= 0) return "";
  const primary =
    mainSystems.find((system) => system !== "other") ??
    mainSystems[0] ??
    "filtration";
  const systemLabel = mainSystemLabels.get(primary) ?? primary.toUpperCase();
  return `${stageCount}-stage ${systemLabel} filtration system`;
}

export function hasWaterTreatmentConfig(
  mainSystems: WaterMainSystem[],
  stages: ProductFiltrationStage[],
): boolean {
  return mainSystems.length > 0 || stages.length > 0;
}

export function createEmptyFiltrationStage(
  productId: string,
  sortOrder: number,
): ProductFiltrationStage {
  return {
    id: "",
    productId,
    sortOrder,
    componentType: "pp_sediment",
    displayName: "",
    specification: "",
    quantity: 1,
    replaceable: false,
    replacementInterval: "",
    relatedProductId: null,
    notes: "",
  };
}

export function renumberFiltrationStages(
  stages: ProductFiltrationStage[],
): ProductFiltrationStage[] {
  return stages.map((stage, index) => ({
    ...stage,
    sortOrder: index,
  }));
}
