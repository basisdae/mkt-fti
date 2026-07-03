"use client";

import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { Button } from "@/components/ui/Button";

export function TopHeader() {
  const pathname = usePathname();
  const hideOnLogin = pathname === "/login";

  if (hideOnLogin) return null;

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b border-gray-100 bg-card/95 px-6 backdrop-blur-sm lg:px-8">
      <GlobalSearch />

      <Button href="/products/new" size="sm">
        <Plus className="h-4 w-4" />
        Add Product
      </Button>
    </header>
  );
}
