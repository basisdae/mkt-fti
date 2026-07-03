"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface LinkedProductItem {
  id: string;
  name: string;
}

interface LinkedProductsModalProps {
  open: boolean;
  supplierName: string;
  products: LinkedProductItem[];
  onClose: () => void;
}

export function LinkedProductsModal({
  open,
  supplierName,
  products,
  onClose,
}: LinkedProductsModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="สินค้าที่เชื่อมอยู่">
      <p className="text-sm text-gray-600">
        Supplier{" "}
        <span className="font-medium text-gray-900">{supplierName}</span>{" "}
        ถูกใช้งานกับสินค้า {products.length} รายการ
      </p>
      <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
        {products.map((product) => (
          <li key={product.id}>
            <Link
              href={`/products/${product.id}`}
              onClick={onClose}
              className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5 text-sm font-medium text-gray-800 transition-colors hover:border-primary/20 hover:bg-light-purple/30 hover:text-primary"
            >
              <Package className="h-4 w-4 shrink-0 text-primary/70" />
              <span className="truncate">{product.name}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex justify-end">
        <Button type="button" variant="ghost" onClick={onClose}>
          ปิด
        </Button>
      </div>
    </Modal>
  );
}
