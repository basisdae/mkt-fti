"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";

interface DuplicateGiftInTierDialogProps {
  open: boolean;
  giftName: string;
  tierName: string;
  onCancel: () => void;
  onIncreaseExisting: () => void;
  onAddSeparate: () => void;
}

export function DuplicateGiftInTierDialog({
  open,
  giftName,
  tierName,
  onCancel,
  onIncreaseExisting,
  onAddSeparate,
}: DuplicateGiftInTierDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={t.duplicateGiftTitle}
      className="max-w-md"
    >
      <p className="text-sm text-gray-600">
        {t.duplicateGiftBodyNamed(giftName, tierName)}
      </p>
      <div className="mt-5 flex flex-col gap-2">
        <Button onClick={onIncreaseExisting}>{t.increaseExistingQty}</Button>
        <Button variant="secondary" onClick={onAddSeparate}>
          {t.addAsSeparate}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          {t.cancel}
        </Button>
      </div>
    </Modal>
  );
}
