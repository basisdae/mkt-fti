"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { APP_NAME, APP_TAGLINE, NAV_ITEMS } from "@/lib/constants";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200/80 bg-card">
      <div className="border-b border-gray-100 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
            FTI
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-gray-900">
              {APP_NAME}
            </p>
            <p className="text-[11px] leading-tight text-gray-400">
              {APP_TAGLINE}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-light-purple text-primary"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 px-6 py-4">
        <div className="rounded-xl bg-light-purple/60 px-4 py-3">
          <p className="text-xs font-semibold text-primary">Internal Use Only</p>
          <p className="mt-0.5 text-[11px] text-gray-500">
            FTI Marketing · Product Ops
          </p>
        </div>
      </div>
    </aside>
  );
}
