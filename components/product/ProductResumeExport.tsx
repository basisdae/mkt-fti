"use client";

import { useCallback, useEffect, useState } from "react";
import { FileDown, Printer, X } from "lucide-react";
import { ProductResumeDocument } from "@/components/product/ProductResumeDocument";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/AuthStore";
import { canExportProductResume } from "@/lib/auth/permissions";
import type { ProductView } from "@/types/product";

interface ProductResumeExportProps {
  product: ProductView;
}

export function ProductResumeExportButton({ product }: ProductResumeExportProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!canExportProductResume(user)) return null;

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousTitle = document.title;
    document.title = "MKT Headquarter | Product Resume";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.title = previousTitle;
    };
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <FileDown className="h-4 w-4" />
        Export Resume
      </Button>

      {open && (
        <div className="product-resume-export-overlay fixed inset-0 z-[120] flex flex-col bg-gray-900/60 backdrop-blur-sm">
          <div className="product-resume-export-toolbar flex items-center justify-between border-b border-white/10 bg-gray-950/90 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">Product Resume Export</p>
              <p className="text-xs text-white/60">
                A4 landscape · Print or Save as PDF
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
                Print / PDF
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>
          </div>

          <div className="product-resume-export-stage flex flex-1 items-start justify-center overflow-auto p-6">
            <div className="product-resume-export-sheet origin-top scale-[0.72] shadow-2xl sm:scale-[0.82] lg:scale-90 xl:scale-100">
              <ProductResumeDocument product={product} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm;
          }

          html,
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden !important;
          }

          #product-resume-print,
          #product-resume-print * {
            visibility: visible !important;
          }

          .product-resume-export-overlay {
            position: static !important;
            inset: auto !important;
            background: transparent !important;
            display: block !important;
          }

          .product-resume-export-toolbar,
          .product-resume-export-stage {
            display: contents !important;
          }

          .product-resume-export-sheet {
            transform: none !important;
            box-shadow: none !important;
          }

          #product-resume-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 297mm !important;
            height: 210mm !important;
            margin: 0 !important;
            overflow: hidden !important;
          }
        }
      `}</style>
    </>
  );
}
