"use client";

import Link from "next/link";
import { Building2, MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { WeChatButton } from "@/components/supplier/WeChatButton";
import {
  formatSupplierShortLocation,
  getPrimaryContact,
} from "@/lib/supplier";
import type { Supplier } from "@/types/supplier";

interface LinkedSupplierSummaryCardProps {
  supplier: Supplier;
  className?: string;
}

export function LinkedSupplierSummaryCard({
  supplier,
  className,
}: LinkedSupplierSummaryCardProps) {
  const primary = getPrimaryContact(supplier);

  return (
    <Card
      padding="md"
      className={className}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-400">Linked Supplier</p>
          <Link
            href={`/suppliers/${supplier.id}`}
            className="mt-0.5 block truncate text-sm font-semibold text-primary hover:underline"
          >
            {supplier.factoryName}
          </Link>
          <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="h-3 w-3 shrink-0" />
            {formatSupplierShortLocation(supplier)}
          </p>
          {primary && (
            <p className="mt-1 text-xs text-gray-500">
              {primary.contactName}
              {primary.position ? ` · ${primary.position}` : ""}
            </p>
          )}
          {primary?.wechatId && (
            <div className="mt-3">
              <WeChatButton wechatId={primary.wechatId} size="sm" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
