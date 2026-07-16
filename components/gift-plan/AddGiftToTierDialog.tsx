"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import { Textarea } from "@/components/forms/Textarea";
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
      title={`เพิ่มเข้า ${tierName}`}
      className="max-w-lg"
    >
      <p className="mb-4 text-sm text-gray-600">{catalog.gift_name}</p>
      <div className="space-y-3">
        <Input
          label="Quantity per Customer"
          type="number"
          value={String(qty)}
          onChange={(e) => onChange({ qty: Number(e.target.value) || 0 })}
        />
        <Input
          label="Unit Actual Cost"
          type="number"
          value={String(unitActualCost)}
          onChange={(e) =>
            onChange({ unitActualCost: Number(e.target.value) || 0 })
          }
        />
        <Input
          label="Estimated Gift Value per Unit"
          type="number"
          value={String(estimatedValue)}
          onChange={(e) =>
            onChange({ estimatedValue: Number(e.target.value) || 0 })
          }
        />
        <Textarea
          label="Notes"
          rows={2}
          value={notes}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onConfirm}>เพิ่มเข้า Tier</Button>
      </div>
    </Modal>
  );
}
