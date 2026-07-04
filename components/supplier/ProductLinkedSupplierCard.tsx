"use client";

import Link from "next/link";
import { Building2, ExternalLink, MapPin, User } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SupplierLogo } from "@/components/supplier/SupplierLogo";
import { WeChatButton } from "@/components/supplier/WeChatButton";
import { cn, formatDate } from "@/lib/utils";
import {
  formatSupplierLocation,
  formatSupplierShortLocation,
  getPrimaryContact,
} from "@/lib/supplier";
import type { Supplier } from "@/types/supplier";

interface ProductLinkedSupplierCardProps {
  supplier: Supplier;
  className?: string;
}

export function ProductLinkedSupplierCard({
  supplier,
  className,
}: ProductLinkedSupplierCardProps) {
  const primary = getPrimaryContact(supplier);

  return (
    <Card
      padding="lg"
      className={cn(
        "border-primary/10 bg-gradient-to-br from-light-purple/20 via-card to-white",
        className,
      )}
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Linked Supplier / Factory
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Factory master record — shared across products
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5 sm:flex-row">
        <SupplierLogo
          logoUrl={supplier.logoUrl}
          name={supplier.factoryName}
          size="lg"
        />

        <div className="min-w-0 flex-1 space-y-4">
          <div className="min-w-0">
            <Link
              href={`/suppliers/${supplier.id}`}
              className="text-lg font-bold text-gray-900 hover:text-primary"
            >
              {supplier.factoryName}
            </Link>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
              <MapPin className="h-4 w-4 shrink-0 text-primary/70" />
              {formatSupplierShortLocation(supplier)}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              {formatSupplierLocation(supplier)}
            </p>
          </div>

          {primary && (
            <div className="rounded-xl border border-gray-100 bg-white/80 px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Primary Contact
              </p>
              <div className="mt-2 flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-gray-800">
                  {primary.contactName}
                </p>
                {primary.position && (
                  <span className="text-xs text-gray-500">
                    · {primary.position}
                  </span>
                )}
              </div>
              {primary.wechatId && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="text-xs text-gray-500">
                    WeChat: <span className="font-mono text-gray-700">{primary.wechatId}</span>
                  </span>
                  <WeChatButton wechatId={primary.wechatId} size="sm" />
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            {supplier.mainProductCategory && (
              <span className="rounded-full bg-light-purple px-3 py-1 font-medium text-primary">
                {supplier.mainProductCategory}
              </span>
            )}
            <span>Updated {formatDate(supplier.updatedAt)}</span>
            <Link
              href={`/suppliers/${supplier.id}`}
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              View supplier
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
