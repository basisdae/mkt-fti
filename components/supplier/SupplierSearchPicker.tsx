"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchSuppliers, supplierDisplayName } from "@/lib/supplier";
import { getSuppliers } from "@/lib/mock-data";
import type { Supplier } from "@/types/supplier";

interface SupplierSearchPickerProps {
  value: string | null;
  onChange: (supplierId: string | null) => void;
  className?: string;
}

export function SupplierSearchPicker({
  value,
  onChange,
  className,
}: SupplierSearchPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const suppliers = useMemo(() => getSuppliers(), []);

  const selected = useMemo(
    () => suppliers.find((s) => s.id === value),
    [suppliers, value],
  );

  const results = useMemo(() => {
    if (!query.trim()) return suppliers.slice(0, 8);
    return searchSuppliers(suppliers, query, 8);
  }, [query, suppliers]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(supplier: Supplier) {
    onChange(supplier.id);
    setQuery("");
    setOpen(false);
  }

  function handleClear() {
    onChange(null);
    setQuery("");
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        Supplier / Factory
      </label>
      <p className="mb-2 text-xs text-gray-400">
        Optional — leave empty for Interested-stage ideas without factory contact
      </p>

      {selected ? (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-light-purple/30 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">
              {selected.factoryName}
            </p>
            <p className="truncate text-xs text-gray-500">
              {[selected.cityDistrict, selected.provinceRegion]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-gray-600"
            aria-label="Clear supplier"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Search factory name, region, category..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {open && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[20px] border border-gray-100 bg-card shadow-lg shadow-gray-200/60">
              {results.length === 0 ? (
                <p className="px-4 py-4 text-sm text-gray-500">
                  No suppliers found
                </p>
              ) : (
                <ul>
                  {results.map((supplier) => (
                    <li key={supplier.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(supplier)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-light-purple/40"
                      >
                        <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {supplier.factoryName}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {supplierDisplayName(supplier)} ·{" "}
                            {supplier.mainProductCategory || "—"}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
