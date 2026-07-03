"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface DeleteSupplierModalProps {
  open: boolean;
  supplierName: string;
  deleting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteSupplierModal({
  open,
  supplierName,
  deleting = false,
  onClose,
  onConfirm,
}: DeleteSupplierModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="ลบ Supplier นี้?">
      <p className="text-sm leading-relaxed text-gray-600">
        หากลบ{" "}
        <span className="font-medium text-gray-900">{supplierName}</span>{" "}
        แล้ว ข้อมูลผู้ติดต่อของ Supplier นี้จะถูกลบไปด้วย
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onClose} disabled={deleting}>
          ยกเลิก
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={onConfirm}
          disabled={deleting}
        >
          {deleting ? "กำลังลบ…" : "ลบ Supplier"}
        </Button>
      </div>
    </Modal>
  );
}
