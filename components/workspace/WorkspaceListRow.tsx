"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkspaceListRowProps {
  href: string;
  title: string;
  subtitle?: string;
  meta?: string;
  leading?: React.ReactNode;
  unread?: boolean;
  toneClassName?: string;
}

export function WorkspaceListRow({
  href,
  title,
  subtitle,
  meta,
  leading,
  unread,
  toneClassName,
}: WorkspaceListRowProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50",
        unread && "bg-primary/[0.03]",
      )}
    >
      {leading ? (
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50 text-gray-500",
            toneClassName,
          )}
        >
          {leading}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="truncate text-sm font-medium text-gray-900">
            {title}
          </span>
          {meta ? (
            <span className="shrink-0 text-[10px] font-medium text-gray-400">
              {meta}
            </span>
          ) : null}
        </span>
        {subtitle ? (
          <span className="mt-0.5 block truncate text-xs text-gray-500">
            {subtitle}
          </span>
        ) : null}
      </span>
      {unread ? (
        <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
      ) : (
        <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
      )}
    </Link>
  );
}
