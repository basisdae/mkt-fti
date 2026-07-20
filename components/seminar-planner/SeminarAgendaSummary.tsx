"use client";

import { formatSeminarMinutes, formatSeminarClockTime } from "@/lib/seminar-planner-format";
import {
  countAgendaOverlaps,
  countIncompleteAgendaItems,
  type AgendaWarningCategory,
  type AgendaWarningReport,
} from "@/lib/seminar-planner-agenda-warnings";
import { SeminarAgendaWarningsBanner } from "@/components/seminar-planner/SeminarAgendaWarningsBanner";
import { SEMINAR_PLANNER_COPY as t } from "@/lib/seminar-planner-i18n";
import { summarizeAgendaTimes } from "@/lib/seminar-planner-time";
import type { SeminarAgendaItemInput } from "@/types/seminar-planner";
import { cn } from "@/lib/utils";

interface SeminarAgendaSummaryProps {
  items: SeminarAgendaItemInput[];
  warningReport: AgendaWarningReport;
  onOpenWarnings?: (category?: AgendaWarningCategory) => void;
}

type SummaryTone =
  | "sessions"
  | "duration"
  | "earliest"
  | "latest"
  | "incomplete"
  | "overlapOk"
  | "overlapBad";

const TONE_STYLES: Record<
  SummaryTone,
  { card: string; label: string; value: string }
> = {
  sessions: {
    card: "border-violet-100 bg-violet-50/90",
    label: "text-violet-900",
    value: "text-violet-950",
  },
  duration: {
    card: "border-sky-100 bg-sky-50/90",
    label: "text-sky-900",
    value: "text-sky-950",
  },
  earliest: {
    card: "border-emerald-100 bg-emerald-50/90",
    label: "text-emerald-900",
    value: "text-emerald-950",
  },
  latest: {
    card: "border-purple-100 bg-purple-50/90",
    label: "text-purple-900",
    value: "text-purple-950",
  },
  incomplete: {
    card: "border-amber-100 bg-amber-50/90",
    label: "text-amber-900",
    value: "text-amber-950",
  },
  overlapOk: {
    card: "border-gray-100 bg-gray-50/90",
    label: "text-gray-700",
    value: "text-gray-900",
  },
  overlapBad: {
    card: "border-red-100 bg-red-50/90",
    label: "text-red-900",
    value: "text-red-950",
  },
};

function SummaryStatCard({
  label,
  value,
  tone,
  clickable = false,
  onClick,
}: {
  label: string;
  value: string;
  tone: SummaryTone;
  clickable?: boolean;
  onClick?: () => void;
}) {
  const styles = TONE_STYLES[tone];
  const className = cn(
    "rounded-xl border p-3 text-left transition-colors",
    styles.card,
    clickable &&
      "cursor-pointer hover:ring-2 hover:ring-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
  );

  if (clickable && onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        <p className={cn("text-sm font-medium leading-snug", styles.label)}>{label}</p>
        <p className={cn("mt-1 text-2xl font-semibold tabular-nums", styles.value)}>
          {value}
        </p>
      </button>
    );
  }

  return (
    <div className={className}>
      <p className={cn("text-sm font-medium leading-snug", styles.label)}>{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold tabular-nums", styles.value)}>
        {value}
      </p>
    </div>
  );
}

export function SeminarAgendaSummary({
  items,
  warningReport,
  onOpenWarnings,
}: SeminarAgendaSummaryProps) {
  const summary = summarizeAgendaTimes(items);
  const incompleteCount = countIncompleteAgendaItems(items);
  const overlapCount = countAgendaOverlaps(items);

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-gray-900">{t.agendaSummaryTitle}</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 lg:gap-3">
          <SummaryStatCard
            label={t.agendaSessionCount}
            value={summary.sessionCount.toLocaleString("th-TH")}
            tone="sessions"
          />
          <SummaryStatCard
            label={t.agendaTotalMinutes}
            value={formatSeminarMinutes(summary.totalMinutes)}
            tone="duration"
          />
          <SummaryStatCard
            label={t.agendaEarliestStart}
            value={formatSeminarClockTime(summary.earliestStart)}
            tone="earliest"
          />
          <SummaryStatCard
            label={t.agendaLatestEnd}
            value={formatSeminarClockTime(summary.latestEnd)}
            tone="latest"
          />
          <SummaryStatCard
            label={t.agendaIncompleteCount}
            value={incompleteCount.toLocaleString("th-TH")}
            tone="incomplete"
            clickable={incompleteCount > 0 && Boolean(onOpenWarnings)}
            onClick={
              incompleteCount > 0 && onOpenWarnings
                ? () => onOpenWarnings()
                : undefined
            }
          />
          <SummaryStatCard
            label={t.agendaOverlapCount}
            value={overlapCount.toLocaleString("th-TH")}
            tone={overlapCount > 0 ? "overlapBad" : "overlapOk"}
            clickable={overlapCount > 0 && Boolean(onOpenWarnings)}
            onClick={
              overlapCount > 0 && onOpenWarnings
                ? () => onOpenWarnings("time_overlap")
                : undefined
            }
          />
        </div>
      </div>

      {onOpenWarnings ? (
        <SeminarAgendaWarningsBanner
          report={warningReport}
          onOpen={() => onOpenWarnings()}
        />
      ) : null}
    </div>
  );
}
