"use client";

import {
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
} from "lucide-react";
import { SeminarBulletListEditor } from "@/components/seminar-planner/SeminarBulletListEditor";
import { SeminarTimeInput } from "@/components/seminar-planner/SeminarTimeInput";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";
import { warningsForAgendaItem } from "@/lib/seminar-planner-agenda-warnings";
import { formatSeminarSessionStatusLabel } from "@/lib/seminar-planner-format";
import {
  calcDurationMinutes,
} from "@/lib/seminar-planner-time";
import { SEMINAR_PLANNER_COPY as t } from "@/lib/seminar-planner-i18n";
import type { SeminarAgendaItemInput } from "@/types/seminar-planner";
import { cn } from "@/lib/utils";

interface SeminarAgendaSessionCardProps {
  item: SeminarAgendaItemInput;
  index: number;
  total: number;
  allItems: SeminarAgendaItemInput[];
  formatOptions: { value: string; label: string }[];
  statusOptions: { value: string; label: string }[];
  disabled?: boolean;
  onChange: (item: SeminarAgendaItemInput) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

export function SeminarAgendaSessionCard({
  item,
  index,
  total,
  allItems,
  formatOptions,
  statusOptions,
  disabled = false,
  onChange,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
}: SeminarAgendaSessionCardProps) {
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

  return (
    <article
      className={cn(
        "rounded-2xl border bg-white p-4 shadow-sm",
        hasErrors ? "border-red-200" : "border-gray-100",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
            {index + 1}
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {item.title?.trim() || t.sessionTitle}
            </p>
            {item.category_name ? (
              <p className="text-xs text-gray-500">{item.category_name}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
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
            className="h-8 w-8 p-0"
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
            disabled={disabled}
            onClick={onDuplicate}
          >
            <Copy className="h-3.5 w-3.5" />
            {t.duplicateSession}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-fti-red hover:bg-red-50"
            disabled={disabled}
            onClick={onRemove}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t.removeSession}
          </Button>
        </div>
      </div>

      {warnings.length > 0 ? (
        <ul className="mt-3 space-y-1">
          {warnings.map((warning) => (
            <li
              key={warning.id}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs",
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

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Input
          label={t.sessionTitle}
          value={item.title}
          onChange={(e) => patch({ title: e.target.value })}
          disabled={disabled}
          required
        />
        <Input
          label={t.category}
          value={item.category_name ?? ""}
          onChange={(e) => patch({ category_name: e.target.value })}
          disabled={disabled}
        />
        <Select
          label={t.format}
          value={item.format_name ?? ""}
          onChange={(e) => patch({ format_name: e.target.value })}
          disabled={disabled}
          options={[{ value: "", label: "—" }, ...formatOptions]}
        />
        <SeminarTimeInput
          label={t.startTime}
          value={item.start_time}
          onChange={(value) => handleTimeChange("start_time", value ?? "")}
          disabled={disabled}
        />
        <SeminarTimeInput
          label={t.endTime}
          value={item.end_time}
          onChange={(value) => handleTimeChange("end_time", value ?? "")}
          disabled={disabled}
        />
        <Input
          label={t.duration}
          type="number"
          min={0}
          value={duration ?? item.duration_minutes ?? ""}
          onChange={(e) =>
            patch({
              duration_minutes: e.target.value
                ? Number(e.target.value)
                : null,
            })
          }
          disabled={disabled}
        />
        <Input
          label={t.primarySpeaker}
          value={item.primary_speaker ?? ""}
          onChange={(e) => patch({ primary_speaker: e.target.value })}
          disabled={disabled}
        />
        <Input
          label={t.coSpeakers}
          value={item.co_speakers ?? ""}
          onChange={(e) => patch({ co_speakers: e.target.value })}
          disabled={disabled}
        />
        <Select
          label={t.sessionStatus}
          value={item.status_name ?? ""}
          onChange={(e) => patch({ status_name: e.target.value })}
          disabled={disabled}
          options={[
            { value: "", label: formatSeminarSessionStatusLabel("") },
            ...statusOptions,
          ]}
        />
        <Input
          label={t.sessionOwner}
          value={item.owner_name ?? ""}
          onChange={(e) => patch({ owner_name: e.target.value })}
          disabled={disabled}
        />
        <label className="flex items-center gap-2 text-sm text-gray-700 md:col-span-2">
          <input
            type="checkbox"
            checked={Boolean(item.is_parallel)}
            onChange={(e) => patch({ is_parallel: e.target.checked })}
            disabled={disabled}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          {t.parallelSession}
        </label>
        <div className="md:col-span-2">
          <Textarea
            label={t.teamNotes}
            value={item.team_notes ?? ""}
            onChange={(e) => patch({ team_notes: e.target.value })}
            disabled={disabled}
            rows={2}
          />
        </div>
      </div>

      <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
        <SeminarBulletListEditor
          label={t.detailBullets}
          bullets={item.detail_bullets ?? []}
          disabled={disabled}
          onChange={(bullets) => patch({ detail_bullets: bullets })}
        />
        <SeminarBulletListEditor
          label={t.objectivesBullets}
          bullets={item.objectives_bullets ?? []}
          disabled={disabled}
          onChange={(bullets) => patch({ objectives_bullets: bullets })}
        />
        <SeminarBulletListEditor
          label={t.outcomesBullets}
          bullets={item.outcomes_bullets ?? []}
          disabled={disabled}
          onChange={(bullets) => patch({ outcomes_bullets: bullets })}
        />
      </div>
    </article>
  );
}
