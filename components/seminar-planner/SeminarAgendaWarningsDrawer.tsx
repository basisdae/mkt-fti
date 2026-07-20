"use client";

import { useEffect, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  AGENDA_WARNING_CATEGORY_ORDER,
  agendaWarningCategoryLabel,
  type AgendaWarningCategory,
  type AgendaWarningIssue,
  type AgendaWarningReport,
} from "@/lib/seminar-planner-agenda-warnings";
import { SEMINAR_PLANNER_COPY as t } from "@/lib/seminar-planner-i18n";
import { cn } from "@/lib/utils";

interface SeminarAgendaWarningsDrawerProps {
  open: boolean;
  report: AgendaWarningReport;
  focusCategory?: AgendaWarningCategory | null;
  onClose: () => void;
  onSelectIssue: (issue: AgendaWarningIssue) => void;
}

export function SeminarAgendaWarningsDrawer({
  open,
  report,
  focusCategory = null,
  onClose,
  onSelectIssue,
}: SeminarAgendaWarningsDrawerProps) {
  const focusRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !focusCategory) return;
    const timer = window.setTimeout(() => {
      focusRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [open, focusCategory]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t.warningDrawerTitle}
      className="max-w-xl"
      footer={
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose} autoFocus>
            {t.cancel}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
          <span>{t.warningDrawerSessionCount(report.affectedSessionCount)}</span>
          <span>{t.warningDrawerIssueCount(report.totalIssueCount)}</span>
        </div>

        {AGENDA_WARNING_CATEGORY_ORDER.map((category) => {
          const issues = report.groupedIssues[category];
          if (issues.length === 0) return null;
          const isFocused = focusCategory === category;

          return (
            <section
              key={category}
              ref={isFocused ? focusRef : undefined}
              className={cn("space-y-2", isFocused && "rounded-xl bg-amber-50/50 p-2")}
            >
              <h3 className="text-sm font-semibold text-gray-800">
                {agendaWarningCategoryLabel(category)}
              </h3>
              <ul className="space-y-1.5">
                {issues.map((issue) => (
                  <li key={issue.warningId}>
                    <button
                      type="button"
                      onClick={() => onSelectIssue(issue)}
                      className={cn(
                        "w-full rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-gray-50",
                        issue.severity === "error"
                          ? "border-red-100 bg-red-50/60 text-gray-900"
                          : "border-amber-100 bg-amber-50/60 text-gray-900",
                      )}
                    >
                      <span className="text-sm font-semibold text-primary">
                        {issue.itemIndex + 1}.
                      </span>{" "}
                      <span className="text-sm font-semibold">{issue.sessionLabel}</span>
                      <span className="mt-1 block text-sm leading-snug text-gray-700">
                        {issue.message}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </Modal>
  );
}
