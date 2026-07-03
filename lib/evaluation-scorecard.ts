import type {
  EvaluationCriterionId,
  EvaluationScore,
  ProductEvaluationScorecard,
} from "@/types/product";

export const EVALUATION_MAX_SCORE = 100;

export const EVALUATION_CRITERIA: {
  id: EvaluationCriterionId;
  label: string;
  weight: number;
}[] = [
  { id: "market_potential", label: "ศักยภาพทางการตลาด", weight: 20 },
  { id: "innovation_interest", label: "ความน่าสนใจของนวัตกรรม", weight: 15 },
  { id: "product_quality", label: "คุณภาพสินค้า", weight: 15 },
  { id: "price_competitiveness", label: "ความสามารถในการแข่งขันด้านราคา", weight: 15 },
  { id: "oem_opportunity", label: "โอกาสในการทำ OEM", weight: 10 },
  { id: "brand_fit", label: "ความเหมาะสมกับแบรนด์ FTI", weight: 10 },
  { id: "marketing_potential", label: "ศักยภาพด้านการตลาด", weight: 10 },
  { id: "supplier_reliability", label: "ความน่าเชื่อถือของผู้ผลิต", weight: 5 },
];

export type EvaluationRecommendationTier =
  | "promote"
  | "interested"
  | "hold"
  | "reject";

export interface EvaluationCriterionComputed {
  id: EvaluationCriterionId;
  label: string;
  weight: number;
  score: EvaluationScore;
  weightedScore: number;
  note: string;
}

export interface EvaluationResult {
  rows: EvaluationCriterionComputed[];
  totalScore: number;
  maxScore: number;
  recommendation: {
    tier: EvaluationRecommendationTier;
    label: string;
  };
}

export function computeWeightedScore(
  score: EvaluationScore,
  weight: number,
): number {
  return (score * weight) / 5;
}

export function computeEvaluationResult(
  scorecard: ProductEvaluationScorecard,
): EvaluationResult {
  const rows: EvaluationCriterionComputed[] = EVALUATION_CRITERIA.map(
    (template) => {
      const entry = scorecard.criteria[template.id];
      const score = entry?.score ?? 3;
      const note = entry?.note ?? "";
      return {
        id: template.id,
        label: template.label,
        weight: template.weight,
        score,
        weightedScore: computeWeightedScore(score, template.weight),
        note,
      };
    },
  );

  const totalScore = Math.round(
    rows.reduce((sum, row) => sum + row.weightedScore, 0),
  );

  return {
    rows,
    totalScore,
    maxScore: EVALUATION_MAX_SCORE,
    recommendation: getEvaluationRecommendation(totalScore),
  };
}

export function getEvaluationTotalScore(
  scorecard: ProductEvaluationScorecard,
): number {
  return computeEvaluationResult(scorecard).totalScore;
}

export function getEvaluationRecommendation(totalScore: number): {
  tier: EvaluationRecommendationTier;
  label: string;
} {
  if (totalScore >= 85) {
    return { tier: "promote", label: "น่าดันขึ้นไลน์สินค้า" };
  }
  if (totalScore >= 70) {
    return { tier: "interested", label: "น่าสนใจ แต่ต้องเช็กเพิ่ม" };
  }
  if (totalScore >= 50) {
    return { tier: "hold", label: "ยังไม่ควรรีบตัดสินใจ" };
  }
  return { tier: "reject", label: "ไม่แนะนำ" };
}

export function getScoreColorClasses(score: EvaluationScore): {
  cell: string;
  text: string;
  dot: string;
} {
  switch (score) {
    case 5:
      return {
        cell: "bg-green-100 border-green-200",
        text: "text-green-800",
        dot: "bg-success",
      };
    case 4:
      return {
        cell: "bg-green-50 border-green-100",
        text: "text-green-700",
        dot: "bg-green-400",
      };
    case 3:
      return {
        cell: "bg-amber-50 border-amber-100",
        text: "text-amber-800",
        dot: "bg-amber-400",
      };
    case 2:
      return {
        cell: "bg-red-50 border-red-100",
        text: "text-red-600",
        dot: "bg-red-300",
      };
    case 1:
    default:
      return {
        cell: "bg-red-100 border-red-200",
        text: "text-fti-red",
        dot: "bg-fti-red",
      };
  }
}

export function getRecommendationBadgeClasses(
  tier: EvaluationRecommendationTier,
): string {
  switch (tier) {
    case "promote":
      return "bg-green-50 text-green-800 border-green-200";
    case "interested":
      return "bg-light-purple text-primary border-primary/20";
    case "hold":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "reject":
      return "bg-red-50 text-fti-red border-red-200";
  }
}

export function getTotalScoreBadgeClasses(totalScore: number): string {
  const tier = getEvaluationRecommendation(totalScore).tier;
  switch (tier) {
    case "promote":
      return "bg-success/10 text-green-800 ring-green-200";
    case "interested":
      return "bg-light-purple text-primary ring-primary/20";
    case "hold":
      return "bg-amber-50 text-amber-800 ring-amber-200";
    case "reject":
      return "bg-red-50 text-fti-red ring-red-200";
  }
}

export function createEmptyEvaluationScorecard(): ProductEvaluationScorecard {
  const criteria = Object.fromEntries(
    EVALUATION_CRITERIA.map((c) => [
      c.id,
      { score: 3 as EvaluationScore, note: "" },
    ]),
  ) as ProductEvaluationScorecard["criteria"];

  return {
    criteria,
    evaluatedAt: new Date().toISOString(),
    evaluator: "",
  };
}
