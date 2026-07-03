import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "px-4 py-6" : "px-6 py-10 sm:py-12",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl bg-light-purple/60 text-primary",
          compact ? "mb-3 h-10 w-10" : "mb-4 h-14 w-14",
        )}
      >
        <Icon className={compact ? "h-5 w-5" : "h-7 w-7"} strokeWidth={1.75} />
      </div>
      <h3
        className={cn(
          "font-semibold text-gray-900",
          compact ? "text-sm" : "text-base",
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "mt-1.5 max-w-sm text-gray-500",
            compact ? "text-xs" : "text-sm",
          )}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
