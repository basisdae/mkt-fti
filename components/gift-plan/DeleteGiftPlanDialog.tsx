"use client";

import { Button } from "@/components/ui/Button";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";

interface DeleteGiftPlanDialogProps {
  open: boolean;
  planName: string;
  deleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteGiftPlanDialog({
  open,
  planName,
  deleting = false,
  onCancel,
  onConfirm,
}: DeleteGiftPlanDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900">{t.deleteGiftPlanTitle}</h2>
        <p className="mt-2 text-sm text-gray-600">{t.deleteGiftPlanBody(planName)}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t.cancel}
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={deleting}
            onClick={onConfirm}
          >
            {deleting ? t.deleting : t.delete}
          </Button>
        </div>
      </div>
    </div>
  );
}
