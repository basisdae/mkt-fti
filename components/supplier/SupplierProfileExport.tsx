"use client";

import { useCallback, useEffect, useState } from "react";
import { FileDown, Printer, X } from "lucide-react";
import { SupplierProfileDocument } from "@/components/supplier/SupplierProfileDocument";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/AuthStore";
import { canExportCompanyProfile } from "@/lib/auth/permissions";
import type { ProductView } from "@/types/product";
import type { Supplier } from "@/types/supplier";

interface SupplierProfileExportProps {
  supplier: Supplier;
  linkedProducts: ProductView[];
}

export function SupplierProfileExportButton({
  supplier,
  linkedProducts,
}: SupplierProfileExportProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!canExportCompanyProfile(user)) return null;

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousTitle = document.title;
    document.title = "MKT Headquarter | Company Profile";
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
        Generate Company Profile
      </Button>

      {open && (
        <div className="supplier-profile-export-overlay fixed inset-0 z-[120] flex flex-col bg-gray-900/60 backdrop-blur-sm">
          <div className="supplier-profile-export-toolbar flex items-center justify-between border-b border-white/10 bg-gray-950/90 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">Company Profile</p>
              <p className="text-xs text-white/60">
                A4 portrait · 2 pages · Print or Save as PDF
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

          <div className="supplier-profile-export-stage flex flex-1 flex-col items-center gap-6 overflow-auto p-6">
            <div className="supplier-profile-export-sheet origin-top scale-[0.72] space-y-6 shadow-2xl sm:scale-[0.82] lg:scale-90 xl:scale-100">
              <SupplierProfileDocument
                supplier={supplier}
                linkedProducts={linkedProducts}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
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

          #supplier-profile-print,
          #supplier-profile-print * {
            visibility: visible !important;
          }

          .supplier-profile-export-overlay {
            position: static !important;
            inset: auto !important;
            background: transparent !important;
            display: block !important;
          }

          .supplier-profile-export-toolbar,
          .supplier-profile-export-stage {
            display: contents !important;
          }

          .supplier-profile-export-sheet {
            transform: none !important;
            box-shadow: none !important;
          }

          #supplier-profile-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            gap: 0 !important;
          }

          #supplier-profile-print .company-profile-page {
            page-break-after: always;
            break-after: page;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          #supplier-profile-print .company-profile-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `}</style>
    </>
  );
}
