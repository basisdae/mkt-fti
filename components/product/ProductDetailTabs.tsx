"use client";

import { cn } from "@/lib/utils";

export type ProductDetailTabId = "profile" | "spec" | "gallery" | "history";

export const PRODUCT_DETAIL_TABS: {
  id: ProductDetailTabId;
  label: string;
}[] = [
  { id: "profile", label: "Profile" },
  { id: "spec", label: "Spec" },
  { id: "gallery", label: "Gallery" },
  { id: "history", label: "History" },
];

interface ProductDetailTabsProps {
  active: ProductDetailTabId;
  onChange: (tab: ProductDetailTabId) => void;
  specBadge?: string;
}

export function ProductDetailTabs({
  active,
  onChange,
  specBadge,
}: ProductDetailTabsProps) {
  return (
    <div className="mb-6 border-b border-gray-100">
      <nav className="-mb-px flex flex-wrap gap-1" aria-label="Product sections">
        {PRODUCT_DETAIL_TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-medium",
                isActive
                  ? "border-b-2 border-primary bg-light-purple/40 text-primary"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800",
              )}
            >
              {tab.label}
              {tab.id === "spec" && specBadge && (
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    isActive
                      ? "border-primary/20 bg-white text-primary"
                      : "border-gray-200 bg-gray-50 text-gray-600",
                  )}
                >
                  {specBadge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
