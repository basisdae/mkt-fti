"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { warningsForAgendaItem } from "@/lib/seminar-planner-agenda-warnings";
import {
  calcDurationMinutes,
  normalizeTimeInput,
} from "@/lib/seminar-planner-time";
import { formatSeminarMinutes } from "@/lib/seminar-planner-format";
import { SEMINAR_PLANNER_COPY as t } from "@/lib/seminar-planner-i18n";
import type { SeminarAgendaItemInput } from "@/types/seminar-planner";
import { cn } from "@/lib/utils";

interface SeminarAgendaCompactRowProps {
  item: SeminarAgendaItemInput;
  index: number;
  total: number;
  allItems: SeminarAgendaItemInput[];
  statusOptions: { value: string; label: string }[];
  disabled?: boolean;
  onChange: (item: SeminarAgendaItemInput) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onViewSummary: () => void;
}

const inputClass =
  "w-full min-w-0 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary disabled:bg-gray-50";

export function SeminarAgendaCompactRow({
  item,
  index,
  total,
  allItems,
  statusOptions,
  disabled = false,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  onViewSummary,
}: SeminarAgendaCompactRowProps) {
  const [expanded, setExpanded] = useState(false);
  const warnings = warningsForAgendaItem(item, index, allItems);
  const hasErrors = warnings.some((w) => w.severity === "error");

  const duration = calcDurationMinutes(
    item.start_time,
    item.end_time,
    item.duration_minutes,
  );

  function patch(partial: Partial<SeminarAgendaItemInput>) {
    onChange({ ...item, ...partial });
  }

  function handleTimeChange(
    field: "start_time" | "end_time",
    value: string,
  ) {
    const next = { ...item, [field]: value || null };
    const mins = calcDurationMinutes(
      field === "start_time" ? value : next.start_time,
      field === "end_time" ? value : next.end_time,
      next.duration_minutes,
    );
    patch({
      [field]: value || null,
      duration_minutes: mins,
    });
  }

  const timeLabel =
    item.start_time && item.end_time
      ? `${normalizeTimeInput(item.start_time)}–${normalizeTimeInput(item.end_time)}`
      : "—";

  return (
    <article
      className={cn(
        "rounded-xl border bg-white shadow-sm transition-colors",
        hasErrors ? "border-red-200" : "border-gray-100",
        expanded && "ring-1 ring-primary/10",
      )}
    >
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
        {disabled ? (
          <span className="text-gray-300">
            <GripVertical className="h-4 w-4" />
          </span>
        ) : (
          <span
            className="cursor-grab text-gray-400 active:cursor-grabbing"
            aria-hidden
          >
            <GripVertical className="h-4 w-4" />
          </span>
        )}

        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[11px] font-semibold text-primary">
          {index + 1}
        </span>

        <span
          className="hidden shrink-0 text-xs text-gray-500 sm:inline"
          title={t.startTime}
        >
          {timeLabel}
        </span>

        <button
          type="button"
          onClick={onViewSummary}
          className="min-w-0 flex-1 truncate text-left text-sm font-medium text-primary hover:underline"
          title={item.title}
        >
          {item.title?.trim() || t.sessionTitle}
        </button>

        <span className="hidden max-w-[6rem] truncate text-xs text-gray-500 md:inline">
          {item.category_name || "—"}
        </span>

        <span className="shrink-0 text-xs font-medium text-gray-700">
          {formatSeminarMinutes(duration ?? item.duration_minutes ?? 0)}
        </span>

        <span className="hidden max-w-[5rem] truncate text-xs text-gray-600 lg:inline">
          {item.primary_speaker || "—"}
        </span>

        <span className="hidden max-w-[4rem] truncate text-xs text-gray-500 sm:inline">
          {item.status_name || "—"}
        </span>

        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={onViewSummary}
          >
            {t.viewSummary}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            disabled={disabled || index === 0}
            onClick={onMoveUp}
            aria-label={t.moveUp}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            disabled={disabled || index === total - 1}
            onClick={onMoveDown}
            aria-label={t.moveDown}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-fti-red hover:bg-red-50"
            disabled={disabled}
            onClick={onRemove}
            aria-label={t.removeSession}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={t.expandSessionFields}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </Button>
        </div>
      </div>

      {warnings.length > 0 ? (
        <ul className="space-y-1 border-t border-gray-50 px-3 py-2">
          {warnings.map((warning) => (
            <li
              key={warning.id}
              className={cn(
                "rounded-lg px-2 py-1 text-[11px]",
                warning.severity === "error"
                  ? "bg-red-50 text-fti-red"
                  : warning.severity === "warning"
                    ? "bg-amber-50 text-amber-800"
                    : "bg-blue-50 text-blue-700",
              )}
            >
              {warning.message}
            </li>
          ))}
        </ul>
      ) : null}

      {expanded ? (
        <div className="grid gap-2 border-t border-gray-100 bg-gray-50/50 px-3 py-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-[11px] text-gray-500">
            {t.sessionDate}
            <input
              type="date"
              value={item.session_date ?? ""}
              disabled={disabled}
              onChange={(e) => patch({ session_date: e.target.value || null })}
              className={cn(inputClass, "mt-1")}
            />
          </label>
          <label className="block text-[11px] text-gray-500">
            {t.startTime}
            <input
              type="time"
              value={normalizeTimeInput(item.start_time)}
              disabled={disabled}
              onChange={(e) => handleTimeChange("start_time", e.target.value)}
              className={cn(inputClass, "mt-1")}
            />
          </label>
          <label className="block text-[11px] text-gray-500">
            {t.endTime}
            <input
              type="time"
              value={normalizeTimeInput(item.end_time)}
              disabled={disabled}
              onChange={(e) => handleTimeChange("end_time", e.target.value)}
              className={cn(inputClass, "mt-1")}
            />
          </label>
          <label className="block text-[11px] text-gray-500">
            {t.primarySpeaker}
            <input
              type="text"
              value={item.primary_speaker ?? ""}
              disabled={disabled}
              onChange={(e) => patch({ primary_speaker: e.target.value })}
              className={cn(inputClass, "mt-1")}
            />
          </label>
          <label className="block text-[11px] text-gray-500">
            {t.sessionStatus}
            <select
              value={item.status_name ?? ""}
              disabled={disabled}
              onChange={(e) => patch({ status_name: e.target.value })}
              className={cn(inputClass, "mt-1")}
            >
              <option value="">—</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] text-gray-500">
            {t.sessionOwner}
            <input
              type="text"
              value={item.owner_name ?? ""}
              disabled={disabled}
              onChange={(e) => patch({ owner_name: e.target.value })}
              className={cn(inputClass, "mt-1")}
            />
          </label>
          <label className="flex items-end gap-2 pb-1.5 text-xs text-gray-700 sm:col-span-2">
            <input
              type="checkbox"
              checked={Boolean(item.is_parallel)}
              disabled={disabled}
              onChange={(e) => patch({ is_parallel: e.target.checked })}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            {t.parallelSession}
          </label>
          <label className="block text-[11px] text-gray-500 sm:col-span-2 lg:col-span-4">
            {t.teamNotes}
            <textarea
              value={item.team_notes ?? ""}
              disabled={disabled}
              rows={2}
              onChange={(e) => patch({ team_notes: e.target.value })}
              className={cn(inputClass, "mt-1 resize-y")}
            />
          </label>
        </div>
      ) : null}
    </article>
  );
}
