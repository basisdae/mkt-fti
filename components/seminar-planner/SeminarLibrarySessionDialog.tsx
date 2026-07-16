"use client";

import { useEffect, useState } from "react";
import { SeminarBulletListEditor } from "@/components/seminar-planner/SeminarBulletListEditor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import { Textarea } from "@/components/forms/Textarea";
import { normalizeBullets } from "@/lib/seminar-planner-bullets";
import { SEMINAR_PLANNER_COPY as t } from "@/lib/seminar-planner-i18n";
import type {
  SeminarLibSessionInput,
  SeminarLibSessionRow,
} from "@/types/seminar-planner";

interface SeminarLibrarySessionDialogProps {
  open: boolean;
  initial?: SeminarLibSessionRow | null;
  saving?: boolean;
  error?: string | null;
  onCancel: () => void;
  onSave: (values: SeminarLibSessionInput) => void;
}

const emptyValues: SeminarLibSessionInput = {
  title: "",
  category_name: "",
  recommended_format: "",
  recommended_minutes: null,
  recommended_speaker: "",
  detail_bullets: [],
  objectives_bullets: [],
  outcomes_bullets: [],
  target_group_names: [],
  is_active: true,
};

export function SeminarLibrarySessionDialog({
  open,
  initial,
  saving = false,
  error = null,
  onCancel,
  onSave,
}: SeminarLibrarySessionDialogProps) {
  const [values, setValues] = useState<SeminarLibSessionInput>(emptyValues);
  const [targetGroupsText, setTargetGroupsText] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setValues({
        title: initial.title,
        category_name: initial.category_name,
        recommended_format: initial.recommended_format,
        recommended_minutes: initial.recommended_minutes,
        recommended_speaker: initial.recommended_speaker,
        detail_bullets: normalizeBullets(initial.detail_bullets),
        objectives_bullets: normalizeBullets(initial.objectives_bullets),
        outcomes_bullets: normalizeBullets(initial.outcomes_bullets),
        target_group_names: initial.target_group_names,
        is_active: initial.is_active,
      });
      setTargetGroupsText(initial.target_group_names.join(", "));
    } else {
      setValues(emptyValues);
      setTargetGroupsText("");
    }
  }, [open, initial]);

  if (!open) return null;

  function patch(partial: Partial<SeminarLibSessionInput>) {
    setValues((prev) => ({ ...prev, ...partial }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const names = targetGroupsText
      .split(/[,，\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    onSave({
      ...values,
      title: values.title.trim(),
      target_group_names: names,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <form
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-100 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 className="text-lg font-semibold text-gray-900">
          {initial ? t.editLibrarySession : t.newLibrarySession}
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input
              label={t.sessionTitle}
              value={values.title}
              onChange={(e) => patch({ title: e.target.value })}
              required
            />
          </div>
          <Input
            label={t.category}
            value={values.category_name ?? ""}
            onChange={(e) => patch({ category_name: e.target.value })}
          />
          <Input
            label={t.recommendedFormat}
            value={values.recommended_format ?? ""}
            onChange={(e) => patch({ recommended_format: e.target.value })}
          />
          <Input
            label={t.recommendedMinutes}
            type="number"
            min={0}
            value={values.recommended_minutes ?? ""}
            onChange={(e) =>
              patch({
                recommended_minutes: e.target.value
                  ? Number(e.target.value)
                  : null,
              })
            }
          />
          <Input
            label={t.recommendedSpeaker}
            value={values.recommended_speaker ?? ""}
            onChange={(e) => patch({ recommended_speaker: e.target.value })}
          />
          <div className="md:col-span-2">
            <Textarea
              label={t.targetGroupNames}
              value={targetGroupsText}
              onChange={(e) => setTargetGroupsText(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <SeminarBulletListEditor
            label={t.detailBullets}
            bullets={values.detail_bullets ?? []}
            onChange={(bullets) => patch({ detail_bullets: bullets })}
          />
          <SeminarBulletListEditor
            label={t.objectivesBullets}
            bullets={values.objectives_bullets ?? []}
            onChange={(bullets) => patch({ objectives_bullets: bullets })}
          />
          <SeminarBulletListEditor
            label={t.outcomesBullets}
            bullets={values.outcomes_bullets ?? []}
            onChange={(bullets) => patch({ outcomes_bullets: bullets })}
          />
        </div>

        {error ? <p className="mt-3 text-xs text-fti-red">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t.cancel}
          </Button>
          <Button type="submit" disabled={saving || !values.title.trim()}>
            {saving ? t.saving : t.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
