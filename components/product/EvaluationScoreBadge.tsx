import { cn } from "@/lib/utils";
import {
  computeEvaluationResult,
  EVALUATION_MAX_SCORE,
  getTotalScoreBadgeClasses,
} from "@/lib/evaluation-scorecard";
import type { ProductEvaluationScorecard } from "@/types/product";

interface EvaluationScoreBadgeProps {
  scorecard: ProductEvaluationScorecard;
  compact?: boolean;
  className?: string;
}

export function EvaluationScoreBadge({
  scorecard,
  compact = false,
  className,
}: EvaluationScoreBadgeProps) {
  const { totalScore } = computeEvaluationResult(scorecard);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full font-bold tabular-nums ring-1 ring-inset",
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        getTotalScoreBadgeClasses(totalScore),
        className,
      )}
      title="คะแนนประเมินผลิตภัณฑ์"
    >
      {totalScore}/{EVALUATION_MAX_SCORE}
    </span>
  );
}
