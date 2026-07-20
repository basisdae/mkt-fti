"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  formatMonthlyPlanDeleteDialogMessage,
  MONTHLY_PLAN_COPY as t,
} from "@/lib/monthly-plan-i18n";
import type { MktWorkItemCard } from "@/types/monthly-plan";

interface MonthlyPlanDeleteWorkDialogProps {
  item: MktWorkItemCard | null;
  deleting?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function MonthlyPlanDeleteWorkDialog({
  item,
  deleting = false,
  error = null,
  onClose,
  onConfirm,
}: MonthlyPlanDeleteWorkDialogProps) {
  return (
    <Modal
      open={item != null}
      onClose={onClose}
      title={t.deleteDialogTitle}
      disableClose={deleting}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={deleting}
            autoFocus
          >
            {t.cancel}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? t.deleting : t.deleteWork}
          </Button>
        </div>
      }
    >
      {item ? (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-gray-600">
            {formatMonthlyPlanDeleteDialogMessage(item.title)}
          </p>
          {error ? <p className="text-sm text-fti-red">{error}</p> : null}
        </div>
      ) : null}
    </Modal>
  );
}
