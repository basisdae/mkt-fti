"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";
import { GIFT_PLAN_STATUS_LABELS } from "@/lib/gift-plan-format";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import {
  GIFT_PLAN_STATUSES,
  type GiftPlanBasicsForm,
} from "@/types/gift-plan";

type GiftPlanBasicsInput = Omit<GiftPlanBasicsForm, "id">;

interface EditGiftPlanBasicsDialogProps {
  open: boolean;
  planId: string | null;
  initialValues: GiftPlanBasicsForm | null;
  loading?: boolean;
  saving?: boolean;
  error?: string | null;
  onCancel: () => void;
  onSave: (values: GiftPlanBasicsForm) => void;
}

const EMPTY: GiftPlanBasicsInput = {
  name: "",
  campaign_year: new Date().getFullYear(),
  campaign_headline: "",
  description: "",
  owner: "",
  status: "draft",
  campaign_conditions: "",
};

export function EditGiftPlanBasicsDialog({
  open,
  planId,
  initialValues,
  loading = false,
  saving = false,
  error = null,
  onCancel,
  onSave,
}: EditGiftPlanBasicsDialogProps) {
  const [form, setForm] = useState<GiftPlanBasicsInput>(EMPTY);

  useEffect(() => {
    if (!open || !initialValues) return;
    setForm({
      name: initialValues.name,
      campaign_year: initialValues.campaign_year,
      campaign_headline: initialValues.campaign_headline,
      description: initialValues.description,
      owner: initialValues.owner,
      status: initialValues.status,
      campaign_conditions: initialValues.campaign_conditions,
    });
  }, [open, initialValues]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <form
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-100 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          if (!planId || loading) return;
          onSave({
            id: planId,
            ...form,
            campaign_year:
              Number(form.campaign_year) || initialValues?.campaign_year || EMPTY.campaign_year,
          });
        }}
      >
        <h2 className="text-lg font-semibold text-gray-900">
          {t.editPlanBasicsTitle}
        </h2>
        <p className="mt-1 text-sm text-gray-500">{t.editPlanBasicsSubtitle}</p>

        {loading ? (
          <p className="mt-6 text-sm text-gray-500">{t.loadingPlanBasics}</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label={t.planNameLabel}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
                required
              />
            </div>
            <Input
              label={t.campaignYearLabel}
              type="number"
              min={2000}
              max={2100}
              value={String(form.campaign_year)}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  campaign_year: Number(e.target.value) || f.campaign_year,
                }))
              }
              required
            />
            <Select
              label={t.status}
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.target.value as GiftPlanBasicsForm["status"],
                }))
              }
              options={GIFT_PLAN_STATUSES.map((status) => ({
                value: status,
                label: GIFT_PLAN_STATUS_LABELS[status],
              }))}
            />
            <div className="sm:col-span-2">
              <Input
                label={t.campaignHeadline}
                value={form.campaign_headline}
                onChange={(e) =>
                  setForm((f) => ({ ...f, campaign_headline: e.target.value }))
                }
                placeholder={t.campaignHeadlinePlaceholder}
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label={t.owner}
                value={form.owner}
                onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <Textarea
                label={t.description}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="sm:col-span-2">
              <Textarea
                label={t.campaignConditions}
                value={form.campaign_conditions}
                onChange={(e) =>
                  setForm((f) => ({ ...f, campaign_conditions: e.target.value }))
                }
                rows={3}
              />
            </div>
            {error ? (
              <p className="text-xs text-fti-red sm:col-span-2">{error}</p>
            ) : null}
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t.cancel}
          </Button>
          <Button
            type="submit"
            disabled={saving || loading || !form.name.trim() || !planId}
          >
            {saving ? t.saving : t.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
