import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  createEmptyEvaluationScorecard,
  normalizeEvaluationScorecard,
} from "@/lib/evaluation-scorecard";
import type {
  EvaluationCriterionId,
  EvaluationCriterionInput,
  EvaluationScore,
  ProductEvaluationScorecard,
} from "@/types/product";

function getClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return createClient();
}

function throwOnError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export async function listProducts() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("updated_at", { ascending: false });

  throwOnError(error);
  return data ?? [];
}

export async function getProduct(id: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  throwOnError(error);
  return data;
}

export async function createProduct(record: Record<string, unknown>) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("products")
    .insert(record)
    .select()
    .single();

  throwOnError(error);
  return data;
}

export async function updateProduct(
  id: string,
  patch: Record<string, unknown>,
) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  throwOnError(error);
  return data;
}

export async function deleteProduct(id: string) {
  const supabase = getClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  throwOnError(error);
}

export async function listProductMoqPrices(productId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("product_moq_prices")
    .select("*")
    .eq("product_id", productId)
    .order("moq", { ascending: true });

  throwOnError(error);
  return data ?? [];
}

export async function upsertProductMoqPrices(
  rows: Record<string, unknown>[],
) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("product_moq_prices")
    .upsert(rows)
    .select();

  throwOnError(error);
  return data ?? [];
}

const CRITERION_IDS: EvaluationCriterionId[] = [
  "market_potential",
  "innovation_interest",
  "product_quality",
  "price_competitiveness",
  "oem_opportunity",
  "brand_fit",
  "marketing_potential",
  "supplier_reliability",
];

function isScore(value: unknown): value is EvaluationScore {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

function parseCriteriaMap(
  value: unknown,
): Record<EvaluationCriterionId, EvaluationCriterionInput> | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const hasCriterion = CRITERION_IDS.some((id) => id in record);
  if (!hasCriterion) return null;

  const criteria = createEmptyEvaluationScorecard().criteria;
  for (const id of CRITERION_IDS) {
    const entry = record[id];
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    criteria[id] = {
      score: isScore(row.score) ? row.score : 3,
      note: typeof row.note === "string" ? row.note : "",
    };
  }
  return criteria;
}

function mapScorecardRow(
  row: {
    criteria?: unknown;
    evaluated_at?: string | null;
    evaluator?: string | null;
  } | null,
): ProductEvaluationScorecard | null {
  if (!row) return null;

  const payload =
    row.criteria && typeof row.criteria === "object"
      ? (row.criteria as Record<string, unknown>)
      : {};

  const criteriaFromItems = parseCriteriaMap(payload.items);
  const criteriaFromRoot = parseCriteriaMap(payload);
  const criteria = criteriaFromItems ?? criteriaFromRoot;

  if (!criteria) return null;

  return normalizeEvaluationScorecard({
    criteria,
    evaluatedAt: row.evaluated_at ?? undefined,
    evaluator: row.evaluator ?? "",
    overallComment:
      typeof payload.overallComment === "string" ? payload.overallComment : "",
    nextAction:
      typeof payload.nextAction === "string" ? payload.nextAction : "",
  });
}

function scorecardToDbPayload(scorecard: ProductEvaluationScorecard) {
  return {
    items: scorecard.criteria,
    overallComment: scorecard.overallComment,
    nextAction: scorecard.nextAction,
  };
}

export async function getProductScorecard(
  productId: string,
): Promise<ProductEvaluationScorecard | null> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("product_scorecards")
    .select("*")
    .eq("product_id", productId)
    .maybeSingle();

  throwOnError(error);
  return mapScorecardRow(data);
}

export async function listAllProductScorecards(): Promise<
  Map<string, ProductEvaluationScorecard>
> {
  const supabase = getClient();
  const { data, error } = await supabase.from("product_scorecards").select("*");
  throwOnError(error);
  const map = new Map<string, ProductEvaluationScorecard>();
  for (const row of data ?? []) {
    const productId = String(
      (row as { product_id?: string }).product_id ?? "",
    );
    if (!productId) continue;
    const mapped = mapScorecardRow(row);
    if (mapped) map.set(productId, mapped);
  }
  return map;
}

export async function upsertProductScorecard(
  productId: string,
  scorecard: ProductEvaluationScorecard,
): Promise<ProductEvaluationScorecard> {
  const supabase = getClient();
  const normalized = normalizeEvaluationScorecard({
    ...scorecard,
    evaluatedAt: new Date().toISOString(),
  });

  const { data, error } = await supabase
    .from("product_scorecards")
    .upsert(
      {
        product_id: productId,
        criteria: scorecardToDbPayload(normalized),
        evaluated_at: normalized.evaluatedAt,
        evaluator: normalized.evaluator,
      },
      { onConflict: "product_id" },
    )
    .select()
    .single();

  throwOnError(error);
  return mapScorecardRow(data) ?? normalized;
}
