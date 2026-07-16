"use client";

import { formatSeminarMinutes } from "@/lib/seminar-planner-format";
import { SEMINAR_PLANNER_COPY as t } from "@/lib/seminar-planner-i18n";
import { summarizeAgendaTimes } from "@/lib/seminar-planner-time";
import type { SeminarAgendaItemInput } from "@/types/seminar-planner";

interface SeminarAgendaSummaryProps {
  items: SeminarAgendaItemInput[];
}

export function SeminarAgendaSummary({ items }: SeminarAgendaSummaryProps) {
  const summary = summarizeAgendaTimes(items);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">
        {t.agendaSummaryTitle}
      </h3>
      <dl className="mt-3 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        <div>
          <dt className="text-xs text-gray-400">{t.agendaSessionCount}</dt>
          <dd className="font-medium text-gray-800">
            {summary.sessionCount.toLocaleString("th-TH")}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-400">{t.agendaTotalMinutes}</dt>
          <dd className="font-medium text-gray-800">
            {formatSeminarMinutes(summary.totalMinutes)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-400">{t.agendaEarliestStart}</dt>
          <dd className="font-medium text-gray-800">
            {summary.earliestStart ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-400">{t.agendaLatestEnd}</dt>
          <dd className="font-medium text-gray-800">
            {summary.latestEnd ?? "—"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
