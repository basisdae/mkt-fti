"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

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
      title="รายการนี้อยู่ใน Tier แล้ว"
      className="max-w-md"
    >
      <p className="text-sm text-gray-600">
        &quot;{giftName}&quot; มีอยู่ใน Tier {tierName} แล้ว ต้องการทำอย่างไร?
      </p>
      <div className="mt-5 flex flex-col gap-2">
        <Button onClick={onIncreaseExisting}>เพิ่มจำนวนในรายการเดิม</Button>
        <Button variant="secondary" onClick={onAddSeparate}>
          เพิ่มเป็นรายการแยก
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          ยกเลิก
        </Button>
      </div>
    </Modal>
  );
}
