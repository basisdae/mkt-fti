"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Plus } from "lucide-react";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/AuthStore";
import { canCreateProducts } from "@/lib/auth/permissions";

interface TopHeaderProps {
  onMenuClick?: () => void;
}

export function TopHeader({ onMenuClick }: TopHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, roleLabel, logout } = useAuth();
  const hideOnLogin = pathname === "/login";

  if (hideOnLogin) return null;

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

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

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        {user && (
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-gray-900">
              {user.displayName}
            </p>
            <p className="text-[11px] font-medium text-gray-400">
              {roleLabel} · {user.email}
            </p>
          </div>
        )}

        {canCreateProducts(user) && (
          <Button href="/products/new" size="sm" className="shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </Button>
        )}

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleLogout}
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
