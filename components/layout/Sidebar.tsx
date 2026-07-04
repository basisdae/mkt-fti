"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/AuthStore";
import { getNavItemsForUser } from "@/lib/auth/permissions";
import { APP_TAGLINE, APP_TITLE, type NavItem } from "@/lib/constants";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function SidebarNavLink({
  item,
  pathname,
  onMobileClose,
}: {
  item: NavItem;
  pathname: string;
  onMobileClose?: () => void;
}) {
  const isActive =
    pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onMobileClose}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-light-purple text-primary shadow-sm"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {item.label}
    </Link>
  );
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const navGroups = getNavItemsForUser(user);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r border-gray-200/80 bg-card transition-transform duration-200 lg:static lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
    >
      <div className="border-b border-gray-100 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo.png"
              alt="MKT Headquarter"
              className="h-10 w-10 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <p className="text-sm font-bold leading-snug tracking-tight text-gray-900">
                {APP_TITLE}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                {APP_TAGLINE}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onMobileClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group, groupIndex) => (
          <div
            key={group.label}
            className={cn(groupIndex > 0 && "mt-4 border-t border-gray-100 pt-4")}
          >
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <SidebarNavLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  onMobileClose={onMobileClose}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
        <div className="rounded-xl bg-light-purple/60 px-4 py-3">
          <p className="text-xs font-semibold text-primary">Internal Use Only</p>
          <p className="mt-0.5 text-[11px] text-gray-500">
            {user?.role === "pu"
              ? "FTI Purchasing · Factory Ops"
              : user?.role === "sale"
                ? "FTI Sales · Product Ops"
                : "FTI Marketing · Product Ops"}
          </p>
        </div>
      </div>
    </aside>
  );
}
