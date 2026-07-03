"use client";

import Link from "next/link";
import { Building2, User } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { WeChatButton } from "@/components/supplier/WeChatButton";
import { getPrimaryContact } from "@/lib/supplier";
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
      <div className="mb-3 flex items-center gap-2">
        <Building2 className="h-4 w-4 text-primary" />
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Supplier Preview
        </p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 text-sm">
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium text-gray-400">Factory Name</dt>
          <dd className="mt-0.5">
            <Link
              href={`/suppliers/${supplier.id}`}
              className="font-semibold text-primary hover:underline"
            >
              {supplier.factoryName}
            </Link>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-400">Province / Region</dt>
          <dd className="mt-0.5 font-medium text-gray-800">
            {supplier.provinceRegion || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-gray-400">City / District</dt>
          <dd className="mt-0.5 font-medium text-gray-800">
            {supplier.cityDistrict || "—"}
          </dd>
        </div>
        {primary && (
          <>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-gray-400">Primary Contact</dt>
              <dd className="mt-0.5 flex items-center gap-2 font-medium text-gray-800">
                <User className="h-4 w-4 shrink-0 text-gray-400" />
                {primary.contactName}
                {primary.position ? (
                  <span className="font-normal text-gray-500">
                    · {primary.position}
                  </span>
                ) : null}
              </dd>
            </div>
            {primary.wechatId && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-gray-400">WeChat ID</dt>
                <dd className="mt-1.5 flex flex-wrap items-center gap-3">
                  <span className="font-mono text-sm text-gray-700">
                    {primary.wechatId}
                  </span>
                  <WeChatButton wechatId={primary.wechatId} size="sm" />
                </dd>
              </div>
            )}
          </>
        )}
      </dl>
    </Card>
  );
}
