"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AgendaWarningReport } from "@/lib/seminar-planner-agenda-warnings";
import { SEMINAR_PLANNER_COPY as t } from "@/lib/seminar-planner-i18n";

interface SeminarAgendaWarningsBannerProps {
  report: AgendaWarningReport;
  onOpen: () => void;
}

export function SeminarAgendaWarningsBanner({
  report,
  onOpen,
}: SeminarAgendaWarningsBannerProps) {
  if (report.totalIssueCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex min-w-0 items-start gap-2 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>{t.warningBannerSummary(report.totalIssueCount, report.affectedSessionCount)}</p>
      </div>
      <Button type="button" variant="secondary" size="sm" onClick={onOpen}>
        {t.warningBannerOpen}
      </Button>
    </div>
  );
}
