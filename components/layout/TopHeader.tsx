"use client";

import { usePathname } from "next/navigation";
import { Menu, Plus } from "lucide-react";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { Button } from "@/components/ui/Button";

interface TopHeaderProps {
  onMenuClick?: () => void;
}

export function TopHeader({ onMenuClick }: TopHeaderProps) {
  const pathname = usePathname();
  const hideOnLogin = pathname === "/login";

  if (hideOnLogin) return null;

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-gray-100 bg-card/95 px-4 backdrop-blur-sm sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
      <button
        type="button"
        aria-label="Open navigation menu"
        onClick={onMenuClick}
        className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <GlobalSearch />

      <Button href="/products/new" size="sm" className="shrink-0">
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Add Product</span>
        <span className="sm:hidden">Add</span>
      </Button>
    </header>
  );
}
