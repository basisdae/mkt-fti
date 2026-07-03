"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Globe,
  MapPin,
  Package,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SupplierContactsSection } from "@/components/supplier/SupplierContactsSection";
import { formatSupplierLocation } from "@/lib/supplier";
import { formatDate } from "@/lib/utils";
import { getProducts } from "@/lib/mock-data";
import type { Supplier } from "@/types/supplier";

interface SupplierDetailViewProps {
  supplier: Supplier;
  linkedProductCount: number;
}

export function SupplierDetailView({
  supplier,
  linkedProductCount,
}: SupplierDetailViewProps) {
  const linkedProducts = getProducts().filter(
    (p) => p.supplierId === supplier.id,
  );

  return (
    <div className="page-shell">
      <Link
        href="/suppliers"
        className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to suppliers
      </Link>

      <div className="rounded-[20px] bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e3a5f] p-6 shadow-lg shadow-indigo-900/20 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-indigo-200">
            {supplier.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={supplier.imageUrl}
                alt=""
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              <Building2 className="h-10 w-10" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-200/80">
              Factory Master
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
              {supplier.factoryName}
            </h1>
            {supplier.displayName !== supplier.factoryName && (
              <p className="mt-1 text-sm text-indigo-100/80">
                {supplier.displayName}
              </p>
            )}
            <p className="mt-3 flex items-center gap-2 text-sm text-indigo-100">
              <MapPin className="h-4 w-4 shrink-0" />
              {formatSupplierLocation(supplier)}
            </p>
            {supplier.mainProductCategory && (
              <p className="mt-2 text-sm text-indigo-200/90">
                {supplier.mainProductCategory}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card padding="lg">
            <h2 className="mb-4 text-base font-semibold text-gray-900">
              Factory Information
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-xs font-medium text-gray-400">Full Address</dt>
                <dd className="mt-1 text-gray-800">
                  {supplier.fullAddress || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-400">Location Note</dt>
                <dd className="mt-1 text-gray-800">
                  {supplier.locationNote || "—"}
                </dd>
              </div>
              {supplier.website && (
                <div>
                  <dt className="text-xs font-medium text-gray-400">Website</dt>
                  <dd className="mt-1">
                    <a
                      href={supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      {supplier.website}
                    </a>
                  </dd>
                </div>
              )}
              {supplier.alibabaLink && (
                <div>
                  <dt className="text-xs font-medium text-gray-400">
                    Alibaba / B2B
                  </dt>
                  <dd className="mt-1">
                    <a
                      href={supplier.alibabaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View storefront
                    </a>
                  </dd>
                </div>
              )}
            </dl>
            {supplier.notes && (
              <p className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                {supplier.notes}
              </p>
            )}
          </Card>

          <SupplierContactsSection
            supplierId={supplier.id}
            initialContacts={supplier.contacts}
          />
        </div>

        <div className="space-y-6">
          <Card padding="lg">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-gray-900">
                Linked Products
              </h2>
            </div>
            <Badge
              variant="default"
              className="mt-3 bg-light-purple text-primary"
            >
              {linkedProductCount} product{linkedProductCount !== 1 ? "s" : ""}
            </Badge>
            <ul className="mt-4 space-y-2">
              {linkedProducts.length === 0 ? (
                <li className="text-sm text-gray-500">No linked products yet</li>
              ) : (
                linkedProducts.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/products/${product.id}`}
                      className="block rounded-lg px-2 py-1.5 text-sm font-medium text-gray-800 hover:bg-light-purple/40 hover:text-primary"
                    >
                      {product.name}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </Card>

          <Card padding="md">
            <p className="text-xs text-gray-400">Last updated</p>
            <p className="mt-1 text-sm font-medium text-gray-800">
              {formatDate(supplier.updatedAt)}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
