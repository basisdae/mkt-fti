"use client";

import { cn } from "@/lib/utils";

interface DataStatusBannerProps {
  error?: string | null;
  className?: string;
}

export function DataStatusBanner({ error, className }: DataStatusBannerProps) {
  if (!error) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-fti-red",
        className,
      )}
      role="alert"
    >
      {error}
    </div>
  );
}

interface DataLoadingStateProps {
  label?: string;
  className?: string;
}

export function DataLoadingState({
  label = "Loading…",
  className,
}: DataLoadingStateProps) {
  return (
    <p className={cn("py-12 text-center text-sm text-gray-500", className)}>
      {label}
    </p>
  );
}
