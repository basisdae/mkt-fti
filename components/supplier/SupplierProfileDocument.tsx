"use client";

import type { ReactNode } from "react";
import { SupplierLogo } from "@/components/supplier/SupplierLogo";
import { buildSupplierProfileData } from "@/lib/supplier-profile";
import type { ProductView } from "@/types/product";
import type { Supplier } from "@/types/supplier";

interface SupplierProfileDocumentProps {
  supplier: Supplier;
  linkedProducts: ProductView[];
  className?: string;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A1F2B]">
      {children}
    </h2>
  );
}

function SoftValue({ value }: { value: string }) {
  return (
    <span
      className={
        value === "-"
          ? "text-[11px] text-gray-400"
          : "text-[11px] font-medium text-gray-800"
      }
    >
      {value}
    </span>
  );
}

function PageShell({
  children,
  page,
  totalPages,
  generatedOn,
}: {
  children: ReactNode;
  page: number;
  totalPages: number;
  generatedOn: string;
}) {
  return (
    <div
      className="company-profile-page flex flex-col overflow-hidden rounded-[4px] border border-gray-200 bg-white text-gray-900 shadow-sm"
      style={{
        width: "210mm",
        height: "297mm",
        boxSizing: "border-box",
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      <footer className="mt-auto flex items-center justify-between border-t border-gray-100 px-8 py-3">
        <div>
          <p className="text-[10px] font-semibold tracking-wide text-[#7A1F2B]">
            MKT Headquarter
          </p>
          <p className="text-[9px] text-gray-400">
            FTI · Product Information Management Platform
          </p>
        </div>
        <div className="text-right text-[9px] text-gray-400">
          <p>Generated on {generatedOn}</p>
          <p>
            Page {page}/{totalPages}
          </p>
        </div>
      </footer>
    </div>
  );
}

export function SupplierProfileDocument({
  supplier,
  linkedProducts,
  className,
}: SupplierProfileDocumentProps) {
  const profile = buildSupplierProfileData(supplier, linkedProducts);
  const contacts = profile.contacts.slice(0, 4);
  const products = profile.linkedProducts.slice(0, 6);
  const noteLines =
    profile.notes === "-"
      ? []
      : profile.notes
          .split(/\n|•/)
          .map((line) => line.trim())
          .filter(Boolean);

  return (
    <article
      id="supplier-profile-print"
      className={`flex flex-col gap-6 ${className ?? ""}`}
    >
      {/* Page 1 — Overview */}
      <PageShell page={1} totalPages={2} generatedOn={profile.generatedOn}>
        {/* Header */}
        <header className="relative bg-[#7A1F2B] px-8 pb-10 pt-7 text-white">
          <div className="flex items-start justify-between gap-8">
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">
                Company Profile
              </p>
              <h1 className="mt-3 max-w-[118mm] text-[26px] font-bold leading-tight tracking-tight">
                {profile.factoryName}
              </h1>
              <p className="mt-2 text-sm font-medium text-white/85">
                {profile.businessType}
                {profile.category !== "-" ? ` · ${profile.category}` : ""}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/90">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold">
                  Score {profile.supplierScore}
                </span>
                <span className="text-[12px]">{profile.locationLine}</span>
              </div>
            </div>

            {/* Logo card — primary visual */}
            <div className="relative -mb-16 shrink-0">
              <SupplierLogo
                logoUrl={profile.logoUrl}
                name={profile.factoryName}
                size="xl"
                className="shadow-[0_12px_30px_rgba(0,0,0,0.18)]"
              />
              {/* QR reserved */}
              <div className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-md border border-gray-100 bg-white shadow-sm">
                <div className="grid h-5 w-5 grid-cols-3 gap-[1px] opacity-25">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <span key={i} className="bg-gray-800" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-7 px-8 pb-2 pt-12">
          {/* About */}
          <section>
            <SectionTitle>About Company</SectionTitle>
            <p className="max-w-[160mm] text-[12px] leading-relaxed text-gray-600">
              {profile.aboutText}
            </p>
            <div className="mt-5 grid grid-cols-3 gap-x-6 gap-y-4">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Website
                </p>
                <p className="mt-1 truncate">
                  <SoftValue value={profile.website} />
                </p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Alibaba / B2B
                </p>
                <p className="mt-1 truncate">
                  <SoftValue value={profile.alibabaLink} />
                </p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Main Category
                </p>
                <p className="mt-1">
                  <SoftValue value={profile.category} />
                </p>
              </div>
            </div>
          </section>

          {/* Contacts — card grid, not a dense table */}
          <section>
            <SectionTitle>Contact List</SectionTitle>
            {contacts.length === 0 ? (
              <p className="text-[11px] text-gray-400">—</p>
            ) : (
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                {contacts.map((contact, index) => (
                  <div key={`${contact.name}-${index}`} className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                      {contact.position === "-" ? "Contact" : contact.position}
                      {contact.isPrimary ? " · Primary" : ""}
                    </p>
                    <p className="mt-1 text-[13px] font-semibold text-gray-900">
                      {contact.name}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-600">
                      {contact.phone}
                    </p>
                    <p className="truncate text-[11px] text-gray-500">
                      {contact.email}
                    </p>
                    {contact.wechat !== "-" && (
                      <p className="mt-0.5 text-[10px] text-gray-400">
                        WeChat {contact.wechat}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Certifications */}
          <section>
            <SectionTitle>Certifications</SectionTitle>
            {profile.certifications.length === 0 ? (
              <p className="text-[11px] text-gray-400">—</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.certifications.map((cert) => (
                  <span
                    key={cert}
                    className="rounded-full bg-gray-50 px-3 py-1.5 text-[11px] font-semibold text-gray-700"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Linked products */}
          <section className="min-h-0">
            <SectionTitle>
              Linked Products
              {profile.linkedProducts.length > 0
                ? ` · ${profile.linkedProducts.length}`
                : ""}
            </SectionTitle>
            {products.length === 0 ? (
              <p className="text-[11px] text-gray-400">—</p>
            ) : (
              <div className="grid grid-cols-6 gap-3">
                {products.map((product) => (
                  <div key={product.id} className="min-w-0 text-center">
                    <div className="mx-auto flex aspect-square w-full items-center justify-center rounded-xl bg-gray-50 p-2">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[8px] text-gray-300">—</span>
                      )}
                    </div>
                    <p className="mt-1.5 truncate text-[9px] font-semibold text-gray-800">
                      {product.name}
                    </p>
                    <p className="truncate text-[8px] text-gray-400">
                      {product.code || "—"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </PageShell>

      {/* Page 2 — Factory details */}
      <PageShell page={2} totalPages={2} generatedOn={profile.generatedOn}>
        <div className="flex min-h-0 flex-1 flex-col gap-8 px-8 py-8">
          {/* Future gallery — reserved, light */}
          <section>
            <SectionTitle>Factory Gallery</SectionTitle>
            <div className="grid grid-cols-3 gap-3">
              {[
                "Production Line",
                "Workshop",
                "Warehouse",
                "Laboratory",
                "Office",
                "Map / Audit",
              ].map((label) => (
                <div
                  key={label}
                  className="flex aspect-[4/3] items-end rounded-xl bg-gray-50 px-3 py-2"
                >
                  <p className="text-[9px] font-medium uppercase tracking-wide text-gray-300">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Factory information — open rows, no heavy table chrome */}
          <section>
            <SectionTitle>Factory Information</SectionTitle>
            <div className="overflow-hidden rounded-xl">
              {profile.factoryInfoRows.map((row, index) => (
                <div
                  key={row.label}
                  className={
                    index % 2 === 0
                      ? "grid grid-cols-[0.9fr_1.4fr] gap-4 bg-gray-50/80 px-4 py-2.5"
                      : "grid grid-cols-[0.9fr_1.4fr] gap-4 px-4 py-2.5"
                  }
                >
                  <p className="text-[11px] font-medium text-gray-400">
                    {row.label}
                  </p>
                  <p
                    className={
                      row.value === "-"
                        ? "text-[11px] text-gray-400"
                        : "text-[11px] font-semibold text-gray-800"
                    }
                  >
                    {row.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Factory notes */}
          <section>
            <SectionTitle>Factory Notes</SectionTitle>
            {noteLines.length === 0 ? (
              <p className="text-[11px] text-gray-400">—</p>
            ) : (
              <ul className="space-y-2">
                {noteLines.map((line) => (
                  <li
                    key={line}
                    className="flex gap-2 text-[12px] leading-relaxed text-gray-700"
                  >
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#7A1F2B]" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="mt-auto text-[9px] text-gray-300">
            Reserved for factory media, maps, and audit documents.
          </p>
        </div>
      </PageShell>
    </article>
  );
}
