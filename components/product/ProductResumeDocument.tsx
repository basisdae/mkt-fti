"use client";

import { buildProductResumeProfile } from "@/lib/product-resume";
import { getResumeSpecSections } from "@/lib/product-specification";
import type { ProductView } from "@/types/product";

interface ProductResumeDocumentProps {
  product: ProductView;
  className?: string;
}

function ProfileField({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
        {label}
      </p>
      <p
        className={
          emphasize
            ? "mt-0.5 text-base font-bold leading-snug text-gray-900"
            : "mt-0.5 text-sm font-medium leading-snug text-gray-800"
        }
      >
        {value}
      </p>
    </div>
  );
}

export function ProductResumeDocument({
  product,
  className,
}: ProductResumeDocumentProps) {
  const profile = buildProductResumeProfile(product);
  const specSections = getResumeSpecSections(product);

  return (
    <article
      id="product-resume-print"
      className={className}
      style={{
        width: "297mm",
        height: "210mm",
        boxSizing: "border-box",
      }}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-[4px] border border-gray-200 bg-white text-gray-900 shadow-sm">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-[#1f2937] to-[#374151] px-6 py-3 text-white">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
              MKT Headquarter
            </p>
            <h1 className="text-lg font-bold tracking-tight">Product Resume</h1>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-white/60">
              Product Code
            </p>
            <p className="text-sm font-semibold">{profile.productCode}</p>
          </div>
        </div>

        {/* Top: Profile */}
        <section className="grid min-h-0 flex-[1.15] grid-cols-[0.95fr_1.05fr] gap-0">
          <div className="flex items-center justify-center border-r border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5">
            <div className="flex h-full w-full max-h-[118mm] items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              {profile.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.coverUrl}
                  alt={profile.coverAlt}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="flex h-full min-h-[90mm] w-full items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-400">
                  No cover image
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-between px-6 py-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9F1239]">
                Product Profile
              </p>
              <h2 className="mt-1 text-2xl font-bold leading-tight tracking-tight text-gray-900">
                {profile.productName}
              </h2>
              <p className="mt-1 text-sm font-medium text-gray-500">
                {profile.brand} · {profile.category}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3">
              <ProfileField label="Brand" value={profile.brand} />
              <ProfileField label="Category" value={profile.category} />
              <ProfileField label="Supplier" value={profile.supplier} />
              <ProfileField label="Factory" value={profile.factory} />
              <ProfileField label="Country" value={profile.country} />
              <ProfileField label="Product System" value={profile.productSystem} />
              <ProfileField label="MOQ" value={profile.moq} emphasize />
              <ProfileField label="Lead Time" value={profile.leadTime} />
              <ProfileField label="Score" value={profile.score} emphasize />
              <ProfileField label="Status" value={profile.status} />
              <ProfileField label="ISO" value={profile.iso} />
              <ProfileField label="Certificate" value={profile.certificates} />
            </div>

            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                Remark
              </p>
              <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-gray-700">
                {profile.remark}
              </p>
            </div>
          </div>
        </section>

        {/* Clear center divider */}
        <div className="relative flex items-center px-6">
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          <span className="absolute left-1/2 -translate-x-1/2 rounded-full border border-gray-200 bg-white px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
            Specification
          </span>
        </div>

        {/* Bottom: Specification */}
        <section className="min-h-0 flex-1 overflow-hidden px-6 pb-4 pt-3">
          <div className="grid h-full grid-cols-4 content-start gap-x-4 gap-y-2">
            {specSections.map((section) => (
              <div
                key={section.title}
                className="rounded-lg border border-gray-100 bg-gray-50/70 px-2.5 py-2"
              >
                <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#9F1239]">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.rows.map((row) => (
                    <div
                      key={`${section.title}-${row.label}`}
                      className="flex items-baseline justify-between gap-2"
                    >
                      <span className="text-[9px] font-medium text-gray-400">
                        {row.label}
                      </span>
                      <span
                        className={
                          row.value === "-"
                            ? "text-[10px] text-gray-400"
                            : "text-[10px] font-semibold text-gray-800"
                        }
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}
