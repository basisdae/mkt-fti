"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, MapPin, Package, Pencil, Trash2, User } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DeleteSupplierModal } from "@/components/supplier/DeleteSupplierModal";
import { useSupplierStore } from "@/hooks/SupplierStore";
import { cn, formatDate } from "@/lib/utils";
import { getPrimaryContact } from "@/lib/supplier";
import type { Supplier } from "@/types/supplier";

interface SupplierListCardProps {
  supplier: Supplier;
  linkedProductCount: number;
  className?: string;
}

const LINKED_PRODUCT_WARNING =
  "Supplier นี้ถูกใช้งานกับสินค้าอยู่ ต้องเปลี่ยน Supplier ของสินค้าก่อนลบ";

const actionButtonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors";

export function SupplierListCard({
  supplier,
  linkedProductCount,
  className,
}: SupplierListCardProps) {
  const { deleteSupplier } = useSupplierStore();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const primary = getPrimaryContact(supplier);
  const hasLinkedProducts = linkedProductCount > 0;

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      await deleteSupplier(supplier.id);
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Card interactive padding="lg" className={cn("group relative h-full", className)}>
        <div className="absolute right-4 top-4 z-10 flex items-center gap-0.5">
          <Link
            href={`/suppliers/${supplier.id}`}
            title="แก้ไข"
            aria-label="แก้ไข Supplier"
            className={cn(
              actionButtonClass,
              "hover:bg-gray-100 hover:text-gray-700",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            type="button"
            title={hasLinkedProducts ? LINKED_PRODUCT_WARNING : "ลบ Supplier"}
            aria-label="ลบ Supplier"
            disabled={hasLinkedProducts}
            className={cn(
              actionButtonClass,
              "hover:bg-red-50 hover:text-fti-red disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400",
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!hasLinkedProducts) {
                setDeleteOpen(true);
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <Link href={`/suppliers/${supplier.id}`} className="block pr-16">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gradient-to-br from-light-purple/40 to-white text-primary group-hover:border-primary/20">
              {supplier.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={supplier.imageUrl}
                  alt=""
                  className="h-full w-full rounded-2xl object-cover"
                />
              ) : (
                <Building2 className="h-6 w-6" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold text-gray-900 group-hover:text-primary">
                {supplier.factoryName}
              </h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3 w-3 shrink-0" />
                {[supplier.cityDistrict, supplier.provinceRegion, supplier.country]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>

          {supplier.mainProductCategory && (
            <p className="mt-4 text-sm text-gray-600">
              {supplier.mainProductCategory}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="default" className="bg-light-purple text-primary">
              <Package className="mr-1 h-3 w-3" />
              {linkedProductCount} product{linkedProductCount !== 1 ? "s" : ""}
            </Badge>
          </div>

          {hasLinkedProducts && (
            <p className="mt-3 text-xs leading-relaxed text-amber-700">
              {LINKED_PRODUCT_WARNING}
            </p>
          )}

          {primary && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
              <User className="h-4 w-4 shrink-0 text-gray-400" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-800">
                  {primary.contactName}
                </p>
                {primary.position && (
                  <p className="truncate text-xs text-gray-500">
                    {primary.position}
                  </p>
                )}
              </div>
            </div>
          )}

          <p className="mt-4 text-xs text-gray-400">
            Updated {formatDate(supplier.updatedAt)}
          </p>
        </Link>
      </Card>

      <DeleteSupplierModal
        open={deleteOpen}
        supplierName={supplier.factoryName}
        deleting={deleting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
