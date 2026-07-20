import type { MktWorkStatus } from "@/types/monthly-plan";
import { formatWorkStatusLabel } from "@/lib/monthly-plan-format";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<MktWorkStatus, string> = {
  PLAN: "bg-slate-100 text-slate-700",
  WORK: "bg-amber-100 text-amber-800",
  DONE: "bg-emerald-100 text-emerald-800",
};

export function MonthlyPlanStatusBadge({
  status,
  className,
}: {
  status: MktWorkStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        STATUS_STYLES[status],
        className,
      )}
    >
      {formatWorkStatusLabel(status)}
    </span>
  );
}
