"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkspaceSectionProps {
  title: string;
  description?: string;
  href?: string;
  actionLabel?: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function WorkspaceSection({
  title,
  description,
  href,
  actionLabel = "View all",
  children,
  className,
  bodyClassName,
}: WorkspaceSectionProps) {
  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm shadow-gray-200/40",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-gray-400">{description}</p>
          ) : null}
        </div>
        {href ? (
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80"
          >
            {actionLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
      <div className={cn("flex-1 p-2 sm:p-3", bodyClassName)}>{children}</div>
    </section>
  );
}

interface WorkspaceEmptyProps {
  message: string;
}

export function WorkspaceEmpty({ message }: WorkspaceEmptyProps) {
  return (
    <p className="px-3 py-8 text-center text-sm text-gray-400">{message}</p>
  );
}
