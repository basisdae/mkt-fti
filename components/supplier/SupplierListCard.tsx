"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, MapPin, Pencil, Trash2, User } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { DeleteSupplierModal } from "@/components/supplier/DeleteSupplierModal";
import { LinkedProductsModal } from "@/components/supplier/LinkedProductsModal";
import { SupplierDeleteBlockedModal } from "@/components/supplier/SupplierDeleteBlockedModal";
import { useLiveProducts } from "@/hooks/PipelineStore";
import { useSupplierStore } from "@/hooks/SupplierStore";
import { cn, formatDate } from "@/lib/utils";
import { getLinkedProducts, getPrimaryContact } from "@/lib/supplier";
import type { Supplier } from "@/types/supplier";

interface SupplierListCardProps {
  supplier: Supplier;
  linkedProductCount: number;
  className?: string;
}

const actionButtonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors";

function linkedBadgeLabel(count: number): string {
  if (count === 1) return "🔗 1 Product Linked";
  return `🔗 ${count} Products Linked`;
}

export function SupplierListCard({
  supplier,
  linkedProductCount,
  className,
}: SupplierListCardProps) {
  const { deleteSupplier } = useSupplierStore();
  const products = useLiveProducts();
  const linkedProducts = getLinkedProducts(supplier.id, products);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [linkedOpen, setLinkedOpen] = useState(false);
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

  function handleDeleteClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (hasLinkedProducts) {
      setBlockedOpen(true);
    } else {
      setDeleteOpen(true);
    }
  }

  function handleLinkedBadgeClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLinkedOpen(true);
  }

  function handleViewProductsFromBlocked() {
    setBlockedOpen(false);
    setLinkedOpen(true);
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
            title="ลบ Supplier"
            aria-label="ลบ Supplier"
            className={cn(
              actionButtonClass,
              "hover:bg-red-50 hover:text-fti-red",
            )}
            onClick={handleDeleteClick}
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

          {hasLinkedProducts && (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleLinkedBadgeClick}
                className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100"
                title="ดูสินค้าที่เชื่อมอยู่"
              >
                {linkedBadgeLabel(linkedProductCount)}
              </button>
            </div>
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

      <SupplierDeleteBlockedModal
        open={blockedOpen}
        linkedProductCount={linkedProductCount}
        onClose={() => setBlockedOpen(false)}
        onViewProducts={handleViewProductsFromBlocked}
      />

      <LinkedProductsModal
        open={linkedOpen}
        supplierName={supplier.factoryName}
        products={linkedProducts}
        onClose={() => setLinkedOpen(false)}
      />
    </>
  );
}
