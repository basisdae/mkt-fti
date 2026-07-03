import { cn } from "@/lib/utils";
import {
  computeEvaluationResult,
  EVALUATION_MAX_SCORE,
  getEvaluationStatusBadgeClasses,
  getEvaluationStatusLabel,
  getTotalScoreBadgeClasses,
} from "@/lib/evaluation-scorecard";
import type { ProductEvaluationScorecard } from "@/types/product";

interface EvaluationScoreBadgeProps {
  scorecard: ProductEvaluationScorecard;
  compact?: boolean;
  /** Show English status label (Strong Candidate, etc.) */
  showStatus?: boolean;
  className?: string;
}

export function EvaluationScoreBadge({
  scorecard,
  compact = false,
  showStatus = false,
  className,
}: EvaluationScoreBadgeProps) {
  const { totalScore } = computeEvaluationResult(scorecard);
  const statusLabel = getEvaluationStatusLabel(totalScore);

  if (showStatus) {
    return (
      <div
        className={cn(
          "inline-flex shrink-0 flex-col items-end gap-1",
          className,
        )}
      >
        <span
          className={cn(
            "inline-flex items-center rounded-full font-bold tabular-nums ring-1 ring-inset",
            compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
            getTotalScoreBadgeClasses(totalScore),
          )}
          title="คะแนนประเมินผลิตภัณฑ์"
        >
          {totalScore}/{EVALUATION_MAX_SCORE}
        </span>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-tight",
            getEvaluationStatusBadgeClasses(totalScore),
          )}
        >
          {statusLabel}
        </span>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full font-bold tabular-nums ring-1 ring-inset",
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        getTotalScoreBadgeClasses(totalScore),
        className,
      )}
      title={`${statusLabel} · คะแนนประเมินผลิตภัณฑ์`}
    >
      {totalScore}/{EVALUATION_MAX_SCORE}
    </span>
  );
}
