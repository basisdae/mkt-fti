"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import { Textarea } from "@/components/forms/Textarea";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import type { GiftCatalogRow } from "@/types/gift-catalog";

interface AddGiftToTierDialogProps {
  open: boolean;
  catalog: GiftCatalogRow | null;
  tierName: string;
  qty: number;
  unitActualCost: number;
  estimatedValue: number;
  notes: string;
  onChange: (patch: {
    qty?: number;
    unitActualCost?: number;
    estimatedValue?: number;
    notes?: string;
  }) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function AddGiftToTierDialog({
  open,
  catalog,
  tierName,
  qty,
  unitActualCost,
  estimatedValue,
  notes,
  onChange,
  onCancel,
  onConfirm,
}: AddGiftToTierDialogProps) {
  if (!catalog) return null;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={t.addGiftToTierTitle}
      className="max-w-lg"
    >
      <p className="mb-4 text-sm text-gray-600">
        {catalog.gift_name} · {t.addToTier(tierName)}
      </p>
      <div className="space-y-3">
        <Input
          label={t.quantityPerCustomer}
          type="number"
          value={String(qty)}
          onChange={(e) => onChange({ qty: Number(e.target.value) || 0 })}
        />
        <Input
          label={t.unitActualCost}
          type="number"
          value={String(unitActualCost)}
          onChange={(e) =>
            onChange({ unitActualCost: Number(e.target.value) || 0 })
          }
        />
        <Input
          label={t.estGiftValue}
          type="number"
          value={String(estimatedValue)}
          onChange={(e) =>
            onChange({ estimatedValue: Number(e.target.value) || 0 })
          }
        />
        <Textarea
          label={t.notes}
          rows={2}
          value={notes}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          {t.cancel}
        </Button>
        <Button onClick={onConfirm}>{t.addToTierButton}</Button>
      </div>
    </Modal>
  );
}
