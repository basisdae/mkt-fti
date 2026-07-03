"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchProducts } from "@/lib/product-filters";
import { getProducts } from "@/lib/mock-data";
import { PRODUCT_STATUS_LABELS } from "@/lib/constants";

export function GlobalSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchProducts(getProducts(), query, 6);
  }, [query]);

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

  function handleSelect(productId: string) {
    setQuery("");
    setOpen(false);
    router.push(`/products/${productId}`);
  }

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="search"
        placeholder="Search products, suppliers..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="w-full rounded-xl border border-gray-200 bg-background py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
      />

      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[20px] border border-gray-100 bg-card shadow-lg shadow-gray-200/60">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500">No matching products</p>
          ) : (
            <ul>
              {results.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(product.id)}
                    className="flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-light-purple/40"
                  >
                    <span className="text-sm font-semibold text-gray-900">
                      {product.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {product.supplier} · {product.brand}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {PRODUCT_STATUS_LABELS[product.status]} ·{" "}
                      {product.factoryLocation}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {results.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2">
              <Link
                href={`/products?q=${encodeURIComponent(query.trim())}`}
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                }}
                className="text-xs font-medium text-primary hover:underline"
              >
                View all results on Products page
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface QuickFilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function QuickFilterChip({
  label,
  active,
  onClick,
}: QuickFilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "bg-primary text-white shadow-sm"
          : "bg-gray-100 text-gray-600 hover:bg-light-purple/60 hover:text-primary",
      )}
    >
      {label}
    </button>
  );
}
