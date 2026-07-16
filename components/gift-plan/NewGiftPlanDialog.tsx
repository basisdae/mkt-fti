"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";

interface NewGiftPlanDialogProps {
  open: boolean;
  creating?: boolean;
  error?: string | null;
  onCancel: () => void;
  onCreate: (input: { name: string; campaign_year: number }) => void;
}

export function NewGiftPlanDialog({
  open,
  creating = false,
  error = null,
  onCancel,
  onCreate,
}: NewGiftPlanDialogProps) {
  const [name, setName] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));

  useEffect(() => {
    if (!open) return;
    setName("");
    setYear(String(new Date().getFullYear()));
  }, [open]);

  if (!open) return null;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onCreate({ name, campaign_year: Number(year) || new Date().getFullYear() });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <form
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 className="text-lg font-semibold text-gray-900">{t.newGiftPlanTitle}</h2>
        <p className="mt-1 text-sm text-gray-500">{t.newPlanSubtitle}</p>
        <div className="mt-4 space-y-3">
          <Input
            label={t.planNameLabel}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.planNamePlaceholder}
            autoFocus
            required
          />
          <Input
            label={t.campaignYearLabel}
            type="number"
            min={2000}
            max={2100}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
          />
          {error ? <p className="text-xs text-fti-red">{error}</p> : null}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t.cancel}
          </Button>
          <Button type="submit" disabled={creating || !name.trim()}>
            {creating ? t.creating : t.createPlan}
          </Button>
        </div>
      </form>
    </div>
  );
}
