"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/AuthStore";
import { getSidebarSectionsForUser } from "@/lib/auth/permissions";
import { APP_TAGLINE, APP_TITLE, type NavItem } from "@/lib/constants";
import {
  isSidebarSectionCollapsed,
  readSidebarCollapseState,
  writeSidebarCollapseState,
  type SidebarCollapseState,
} from "@/lib/nav/sidebar-collapse";
import {
  navItemMatchesPath,
  sectionIsActive,
  sumSectionBadgeCounts,
  type SidebarSection,
} from "@/lib/nav/sidebar-config";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto inline-flex min-h-[1.125rem] min-w-[1.125rem] shrink-0 items-center justify-center rounded-full bg-fti-red/10 px-1.5 text-[10px] font-semibold leading-none text-fti-red">
      {count > 99 ? "99+" : count}
    </span>
  );
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
  const isActive = navItemMatchesPath(item, pathname);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onMobileClose}
      className={cn(
        "relative flex items-center gap-2.5 rounded-lg py-2 pl-3 pr-2 text-[13px] font-normal transition-colors",
        isActive
          ? "bg-primary/10 font-medium text-primary before:absolute before:-left-px before:bottom-1 before:top-1 before:w-0.5 before:rounded-full before:bg-primary"
          : "text-gray-600 hover:bg-gray-50/90 hover:text-gray-900",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          isActive ? "text-primary" : "text-gray-400",
        )}
      />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      <NavBadge count={item.badgeCount ?? 0} />
    </Link>
  );
}

function SidebarSectionBlock({
  section,
  pathname,
  collapsed,
  onToggle,
  onMobileClose,
}: {
  section: SidebarSection;
  pathname: string;
  collapsed: boolean;
  onToggle: () => void;
  onMobileClose?: () => void;
}) {
  const active = sectionIsActive(section, pathname);
  const sectionBadge = sumSectionBadgeCounts(section);

  return (
    <section className="py-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors",
          active
            ? "bg-gray-100/80 text-gray-900"
            : "text-gray-800 hover:bg-gray-50",
        )}
      >
        <span className="min-w-0 flex-1 truncate text-xs font-bold tracking-tight">
          {section.label}
        </span>
        <NavBadge count={sectionBadge} />
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-gray-400 transition-transform",
            collapsed && "-rotate-90",
          )}
        />
      </button>

      {!collapsed ? (
        <div className="relative mt-0.5 ml-2 border-l border-gray-200/90 pl-2">
          <div className="space-y-0.5">
            {section.items.map((item) => (
              <SidebarNavLink
                key={item.href}
                item={item}
                pathname={pathname}
                onMobileClose={onMobileClose}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const sections = useMemo(() => getSidebarSectionsForUser(user), [user]);
  const [collapseState, setCollapseState] = useState<SidebarCollapseState>({});

  useEffect(() => {
    setCollapseState(readSidebarCollapseState());
  }, []);

  useEffect(() => {
    const activeSection = sections.find((section) =>
      sectionIsActive(section, pathname),
    );
    if (!activeSection) return;

    setCollapseState((prev) => {
      if (prev[activeSection.id] === false || prev[activeSection.id] === undefined) {
        return prev;
      }
      const next = { ...prev, [activeSection.id]: false };
      writeSidebarCollapseState(next);
      return next;
    });
  }, [pathname, sections]);

  const toggleSection = useCallback((sectionId: string) => {
    setCollapseState((prev) => {
      const next = {
        ...prev,
        [sectionId]: !isSidebarSectionCollapsed(prev, sectionId),
      };
      writeSidebarCollapseState(next);
      return next;
    });
  }, []);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r border-gray-200/80 bg-card transition-transform duration-200 lg:static lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
    >
      <div className="shrink-0 border-b border-gray-100 px-5 py-5 sm:px-6 sm:py-6">
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

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        <div className="space-y-1">
          {sections.map((section) => (
            <SidebarSectionBlock
              key={section.id}
              section={section}
              pathname={pathname}
              collapsed={isSidebarSectionCollapsed(collapseState, section.id)}
              onToggle={() => toggleSection(section.id)}
              onMobileClose={onMobileClose}
            />
          ))}
        </div>
      </nav>

      <div className="shrink-0 border-t border-gray-100 px-5 py-4 sm:px-6">
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
