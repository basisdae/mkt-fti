import {
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGE_TONES,
  PIPELINE_TONE_STYLES,
} from "@/lib/constants";
import {
  formatPipelineProductCount,
  formatPipelineStepBadge,
} from "@/lib/pipeline";
import { cn } from "@/lib/utils";
import type { PipelineStage } from "@/types/product";

interface PipelineStageHeaderProps {
  stage: PipelineStage;
  productCount: number;
}

export function PipelineStageHeader({
  stage,
  productCount,
}: PipelineStageHeaderProps) {
  const tone = PIPELINE_STAGE_TONES[stage];
  const toneStyles = PIPELINE_TONE_STYLES[tone];
  const stepBadge = formatPipelineStepBadge(stage);
  const title = PIPELINE_STAGE_LABELS[stage];

  return (
    <div className="mb-3 flex items-start justify-between gap-2 px-0.5">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] text-[13px] font-extrabold leading-none tabular-nums",
            toneStyles.stepBadgeBg,
            toneStyles.stepBadgeText,
          )}
          aria-hidden
        >
          {stepBadge}
        </span>
        <h2 className="truncate text-[15px] font-bold leading-snug text-[#0F172A] sm:text-base">
          {title}
        </h2>
      </div>
      <span className="shrink-0 pt-0.5 text-[11px] text-[#8A94A6]">
        {formatPipelineProductCount(productCount)}
      </span>
    </div>
  );
}
