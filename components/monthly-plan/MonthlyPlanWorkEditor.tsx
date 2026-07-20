"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLink, GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";
import { allSubtasksDone, calcWorkProgress } from "@/lib/monthly-plan-progress";
import { formatWorkProgress } from "@/lib/monthly-plan-format";
import { MONTHLY_PLAN_COPY as t } from "@/lib/monthly-plan-i18n";
import type {
  MktWorkAssigneeOption,
  MktWorkItemCard,
  MktWorkPriority,
  MktWorkStatus,
  MktWorkSubtaskInput,
} from "@/types/monthly-plan";
import { cn } from "@/lib/utils";

export interface MonthlyPlanWorkEditorValues {
  title: string;
  description: string;
  status: MktWorkStatus;
  priority: MktWorkPriority | "";
  owner_user_id: string;
  collaborator_user_ids: string[];
  start_date: string;
  deadline: string;
  subtasks: MktWorkSubtaskInput[];
}

interface MonthlyPlanWorkEditorProps {
  item: MktWorkItemCard;
  assignees: MktWorkAssigneeOption[];
  disabled?: boolean;
  showFullPageLink?: boolean;
  onChange: (values: MonthlyPlanWorkEditorValues) => void;
}

function SortableSubtaskRow({
  task,
  index,
  disabled,
  onToggle,
  onTitleChange,
  onRemove,
}: {
  task: MktWorkSubtaskInput;
  index: number;
  disabled?: boolean;
  onToggle: () => void;
  onTitleChange: (title: string) => void;
  onRemove: () => void;
}) {
  const id = task.id ?? `new-${index}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-2 py-2",
        isDragging && "opacity-70 ring-2 ring-primary/20",
      )}
    >
      {!disabled ? (
        <button
          type="button"
          className="cursor-grab rounded p-1 text-gray-400 active:cursor-grabbing"
          aria-label={t.dragHandle}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      ) : null}
      <input
        type="checkbox"
        checked={Boolean(task.is_done)}
        disabled={disabled}
        onChange={onToggle}
        className="rounded border-gray-300 text-primary focus:ring-primary"
      />
      <input
        value={task.title}
        disabled={disabled}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder={t.subtaskPlaceholder}
        className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm outline-none focus:border-gray-200"
      />
      {!disabled ? (
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-fti-red"
          aria-label="Remove subtask"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
    </li>
  );
}

export function itemToEditorValues(item: MktWorkItemCard): MonthlyPlanWorkEditorValues {
  return {
    title: item.title,
    description: item.description,
    status: item.status,
    priority: item.priority ?? "",
    owner_user_id: item.owner_user_id ?? "",
    collaborator_user_ids: [...item.collaborator_user_ids],
    start_date: item.start_date ?? "",
    deadline: item.deadline ?? "",
    subtasks: item.subtasks.map((task) => ({
      id: task.id,
      title: task.title,
      is_done: task.is_done,
      sort_order: task.sort_order,
    })),
  };
}

export function MonthlyPlanWorkEditor({
  item,
  assignees,
  disabled = false,
  showFullPageLink = true,
  onChange,
}: MonthlyPlanWorkEditorProps) {
  const [values, setValues] = useState<MonthlyPlanWorkEditorValues>(() =>
    itemToEditorValues(item),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const progress = useMemo(
    () => calcWorkProgress(values.subtasks),
    [values.subtasks],
  );

  function patch(partial: Partial<MonthlyPlanWorkEditorValues>) {
    setValues((current) => {
      const next = { ...current, ...partial };
      onChange(next);
      return next;
    });
  }

  function patchSubtasks(subtasks: MktWorkSubtaskInput[]) {
    patch({ subtasks });
  }

  function handleSubtaskDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = values.subtasks.findIndex(
      (task, index) => (task.id ?? `new-${index}`) === active.id,
    );
    const newIndex = values.subtasks.findIndex(
      (task, index) => (task.id ?? `new-${index}`) === over.id,
    );
    if (oldIndex < 0 || newIndex < 0) return;

    patchSubtasks(
      arrayMove(values.subtasks, oldIndex, newIndex).map((task, index) => ({
        ...task,
        sort_order: index,
      })),
    );
  }

  const subtaskIds = values.subtasks.map(
    (task, index) => task.id ?? `new-${index}`,
  );

  const canMarkDone =
    allSubtasksDone(
      values.subtasks.map((task) => ({ is_done: task.is_done })),
    ) && values.status !== "DONE";

  return (
    <div className="space-y-4">
      {showFullPageLink ? (
        <Link
          href={`/monthly-plan/${item.id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          {t.openFullPage}
        </Link>
      ) : null}

      <Input
        label={t.titleLabel}
        value={values.title}
        disabled={disabled}
        onChange={(event) => patch({ title: event.target.value })}
      />

      <Textarea
        label={t.descriptionLabel}
        value={values.description}
        disabled={disabled}
        rows={3}
        onChange={(event) => patch({ description: event.target.value })}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label={t.statusLabel}
          value={values.status}
          disabled={disabled}
          onChange={(event) =>
            patch({ status: event.target.value as MktWorkStatus })
          }
          options={[
            { value: "PLAN", label: t.statusPlan },
            { value: "WORK", label: t.statusWork },
            { value: "DONE", label: t.statusDone },
          ]}
        />
        <Select
          label={t.priorityLabel}
          value={values.priority || ""}
          disabled={disabled}
          onChange={(event) =>
            patch({
              priority: (event.target.value || "") as MktWorkPriority | "",
            })
          }
          options={[
            { value: "", label: "—" },
            { value: "LOW", label: t.priorityLow },
            { value: "MEDIUM", label: t.priorityMedium },
            { value: "HIGH", label: t.priorityHigh },
          ]}
        />
      </div>

      <Select
        label={t.ownerLabel}
        value={values.owner_user_id}
        disabled={disabled}
        onChange={(event) => patch({ owner_user_id: event.target.value })}
        options={[
          { value: "", label: t.noOwner },
          ...assignees.map((user) => ({
            value: user.id,
            label: user.displayName,
          })),
        ]}
      />

      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">{t.collaboratorsLabel}</p>
        <div className="max-h-36 space-y-2 overflow-y-auto rounded-xl border border-gray-100 p-3">
          {assignees.map((user) => {
            const checked = values.collaborator_user_ids.includes(user.id);
            return (
              <label
                key={user.id}
                className="flex items-center gap-2 text-sm text-gray-700"
              >
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={checked}
                  onChange={() => {
                    const next = checked
                      ? values.collaborator_user_ids.filter((id) => id !== user.id)
                      : [...values.collaborator_user_ids, user.id];
                    patch({ collaborator_user_ids: next });
                  }}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                {user.displayName}
              </label>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label={t.startDateLabel}
          type="date"
          value={values.start_date}
          disabled={disabled}
          onChange={(event) => patch({ start_date: event.target.value })}
        />
        <Input
          label={t.deadlineFieldLabel}
          type="date"
          value={values.deadline}
          disabled={disabled}
          onChange={(event) => patch({ deadline: event.target.value })}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-gray-700">{t.subtasksLabel}</p>
          <span className="text-xs text-gray-500">
            {formatWorkProgress(progress.done, progress.total)}
          </span>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleSubtaskDragEnd}
        >
          <SortableContext
            items={subtaskIds}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {values.subtasks.map((task, index) => (
                <SortableSubtaskRow
                  key={task.id ?? `new-${index}`}
                  task={task}
                  index={index}
                  disabled={disabled}
                  onToggle={() => {
                    const next = values.subtasks.map((row, rowIndex) =>
                      rowIndex === index
                        ? { ...row, is_done: !row.is_done }
                        : row,
                    );
                    patchSubtasks(next);
                  }}
                  onTitleChange={(title) => {
                    const next = values.subtasks.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, title } : row,
                    );
                    patchSubtasks(next);
                  }}
                  onRemove={() => {
                    patchSubtasks(
                      values.subtasks.filter((_, rowIndex) => rowIndex !== index),
                    );
                  }}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>

        {!disabled ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() =>
              patchSubtasks([
                ...values.subtasks,
                {
                  title: "",
                  is_done: false,
                  sort_order: values.subtasks.length,
                },
              ])
            }
          >
            <Plus className="h-4 w-4" />
            {t.addSubtask}
          </Button>
        ) : null}
      </div>

      {canMarkDone ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {t.markAllDoneHint}
          {!disabled ? (
            <button
              type="button"
              className="ml-2 font-semibold underline"
              onClick={() => patch({ status: "DONE" })}
            >
              {t.statusDone}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
