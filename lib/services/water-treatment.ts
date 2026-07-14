import { generateId } from "@/lib/generate-id";
import {
  isFiltrationComponentType,
  isWaterMainSystem,
  normalizeMainSystems,
  renumberFiltrationStages,
} from "@/lib/water-treatment";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  ProductFiltrationStage,
  ProductWaterTreatment,
  WaterMainSystem,
} from "@/types/product";

function getClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  return createClient();
}

function isMissingWaterTreatmentError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("product_water_treatment") ||
    lower.includes("product_filtration_stages") ||
    lower.includes("schema cache") ||
    lower.includes("does not exist")
  );
}

function mapConfigRow(row: Record<string, unknown>): ProductWaterTreatment {
  return {
    productId: String(row.product_id),
    mainSystems: normalizeMainSystems(row.main_systems),
  };
}

function mapStageRow(row: Record<string, unknown>): ProductFiltrationStage {
  const componentType = String(row.component_type ?? "other");
  return {
    id: String(row.id),
    productId: String(row.product_id),
    sortOrder: Number(row.sort_order) || 0,
    componentType: isFiltrationComponentType(componentType)
      ? componentType
      : "other",
    displayName: String(row.display_name ?? ""),
    specification: String(row.specification ?? ""),
    quantity: Math.max(1, Number(row.quantity) || 1),
    replaceable: Boolean(row.replaceable),
    replacementInterval: String(row.replacement_interval ?? ""),
    relatedProductId:
      typeof row.related_product_id === "string" && row.related_product_id
        ? row.related_product_id
        : null,
    notes: String(row.notes ?? ""),
  };
}

export interface ProductWaterTreatmentContext {
  config: ProductWaterTreatment | null;
  stages: ProductFiltrationStage[];
}

export async function listAllWaterTreatmentExportContexts(): Promise<
  Map<string, ProductWaterTreatmentContext>
> {
  const result = new Map<string, ProductWaterTreatmentContext>();

  if (!isSupabaseConfigured()) {
    return result;
  }

  try {
    const supabase = getClient();
    const [configRes, stagesRes] = await Promise.all([
      supabase.from("product_water_treatment").select("*"),
      supabase
        .from("product_filtration_stages")
        .select("*")
        .order("sort_order", { ascending: true }),
    ]);

    if (
      configRes.error &&
      !isMissingWaterTreatmentError(configRes.error.message)
    ) {
      throw new Error(configRes.error.message);
    }
    if (
      stagesRes.error &&
      !isMissingWaterTreatmentError(stagesRes.error.message)
    ) {
      throw new Error(stagesRes.error.message);
    }

    if (
      configRes.error &&
      isMissingWaterTreatmentError(configRes.error.message)
    ) {
      return result;
    }

    for (const row of configRes.data ?? []) {
      const config = mapConfigRow(row as Record<string, unknown>);
      result.set(config.productId, { config, stages: [] });
    }

    for (const row of stagesRes.data ?? []) {
      const stage = mapStageRow(row as Record<string, unknown>);
      const existing = result.get(stage.productId) ?? {
        config: null,
        stages: [],
      };
      existing.stages.push(stage);
      result.set(stage.productId, existing);
    }

    return result;
  } catch {
    return result;
  }
}

export async function loadProductWaterTreatmentContext(
  productId: string,
): Promise<ProductWaterTreatmentContext> {
  if (!isSupabaseConfigured()) {
    return { config: null, stages: [] };
  }

  try {
    const supabase = getClient();
    const [configRes, stagesRes] = await Promise.all([
      supabase
        .from("product_water_treatment")
        .select("*")
        .eq("product_id", productId)
        .maybeSingle(),
      supabase
        .from("product_filtration_stages")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true }),
    ]);

    if (configRes.error && !isMissingWaterTreatmentError(configRes.error.message)) {
      throw new Error(configRes.error.message);
    }
    if (stagesRes.error && !isMissingWaterTreatmentError(stagesRes.error.message)) {
      throw new Error(stagesRes.error.message);
    }

    if (
      configRes.error &&
      isMissingWaterTreatmentError(configRes.error.message)
    ) {
      return { config: null, stages: [] };
    }

    return {
      config: configRes.data
        ? mapConfigRow(configRes.data as Record<string, unknown>)
        : null,
      stages: (stagesRes.data ?? []).map((row) =>
        mapStageRow(row as Record<string, unknown>),
      ),
    };
  } catch {
    return { config: null, stages: [] };
  }
}

export async function saveProductWaterTreatmentContext(
  productId: string,
  mainSystems: WaterMainSystem[],
  stages: ProductFiltrationStage[],
): Promise<ProductWaterTreatmentContext> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = getClient();
  const normalizedSystems = normalizeMainSystems(mainSystems);
  const normalizedStages = renumberFiltrationStages(
    stages.map((stage) => ({
      ...stage,
      id: stage.id || generateId(),
      productId,
      componentType: isFiltrationComponentType(stage.componentType)
        ? stage.componentType
        : "other",
      quantity: Math.max(1, stage.quantity || 1),
    })),
  );

  const hasConfig =
    normalizedSystems.length > 0 || normalizedStages.length > 0;

  if (hasConfig) {
    const { error: upsertError } = await supabase
      .from("product_water_treatment")
      .upsert(
        {
          product_id: productId,
          main_systems: normalizedSystems,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "product_id" },
      );

    if (upsertError) {
      if (isMissingWaterTreatmentError(upsertError.message)) {
        throw new Error(
          "Tables product_water_treatment / product_filtration_stages are missing. Run migration 20260714170000_product_water_treatment_and_relation_types.sql in Supabase, then retry.",
        );
      }
      throw new Error(upsertError.message);
    }
  } else {
    const { error: deleteConfigError } = await supabase
      .from("product_water_treatment")
      .delete()
      .eq("product_id", productId);

    if (
      deleteConfigError &&
      !isMissingWaterTreatmentError(deleteConfigError.message)
    ) {
      throw new Error(deleteConfigError.message);
    }
  }

  const { error: deleteStagesError } = await supabase
    .from("product_filtration_stages")
    .delete()
    .eq("product_id", productId);

  if (deleteStagesError) {
    if (isMissingWaterTreatmentError(deleteStagesError.message)) {
      throw new Error(
        "Tables product_water_treatment / product_filtration_stages are missing. Run migration 20260714170000_product_water_treatment_and_relation_types.sql in Supabase, then retry.",
      );
    }
    throw new Error(deleteStagesError.message);
  }

  if (normalizedStages.length > 0) {
    const { data, error: insertError } = await supabase
      .from("product_filtration_stages")
      .insert(
        normalizedStages.map((stage) => ({
          id: stage.id,
          product_id: productId,
          sort_order: stage.sortOrder,
          component_type: stage.componentType,
          display_name: stage.displayName,
          specification: stage.specification,
          quantity: stage.quantity,
          replaceable: stage.replaceable,
          replacement_interval: stage.replacementInterval,
          related_product_id: stage.relatedProductId,
          notes: stage.notes,
          updated_at: new Date().toISOString(),
        })),
      )
      .select();

    if (insertError) {
      throw new Error(insertError.message);
    }

    return {
      config: hasConfig
        ? { productId, mainSystems: normalizedSystems }
        : null,
      stages: (data ?? []).map((row) =>
        mapStageRow(row as Record<string, unknown>),
      ),
    };
  }

  return {
    config: hasConfig ? { productId, mainSystems: normalizedSystems } : null,
    stages: [],
  };
}
