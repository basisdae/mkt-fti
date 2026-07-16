"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";

interface RenameGiftPlanDialogProps {
  open: boolean;
  initialName: string;
  saving?: boolean;
  error?: string | null;
  onCancel: () => void;
  onSave: (name: string) => void;
}

export function RenameGiftPlanDialog({
  open,
  initialName,
  saving = false,
  error = null,
  onCancel,
  onSave,
}: RenameGiftPlanDialogProps) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (open) setName(initialName);
  }, [open, initialName]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <form
        className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onSave(name);
        }}
      >
        <h2 className="text-lg font-semibold text-gray-900">{t.renameGiftPlanTitle}</h2>
        <div className="mt-4">
          <Input
            label={t.planNameLabel.replace(" *", "")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />
          {error ? <p className="mt-2 text-xs text-fti-red">{error}</p> : null}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t.cancel}
          </Button>
          <Button type="submit" disabled={saving || !name.trim()}>
            {saving ? t.saving : t.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
