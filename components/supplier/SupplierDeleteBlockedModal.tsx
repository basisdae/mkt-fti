"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface SupplierDeleteBlockedModalProps {
  open: boolean;
  linkedProductCount: number;
  onClose: () => void;
  onViewProducts: () => void;
}

export function SupplierDeleteBlockedModal({
  open,
  linkedProductCount,
  onClose,
  onViewProducts,
}: SupplierDeleteBlockedModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="ไม่สามารถลบ Supplier นี้ได้">
      <p className="text-sm leading-relaxed text-gray-600">
        ไม่สามารถลบ Supplier นี้ได้ เพราะมีสินค้า {linkedProductCount} รายการที่ยังเชื่อมอยู่
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" onClick={onViewProducts}>
          View Products
        </Button>
      </div>
    </Modal>
  );
}
