import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SimulatorKpiVariant =
  | "neutral"
  | "profit"
  | "profit-warn"
  | "goal"
  | "warn";

export interface SimulatorKpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: SimulatorKpiVariant;
  className?: string;
}

const variantStyles: Record<
  SimulatorKpiVariant,
  { card: string; icon: string; value: string }
> = {
  neutral: {
    card: "border-gray-100/90 bg-gradient-to-br from-gray-50/90 via-card to-light-purple/20",
    icon: "bg-gray-100 text-gray-500",
    value: "text-gray-900",
  },
  profit: {
    card: "border-green-100/80 bg-gradient-to-br from-green-50/90 via-card to-emerald-50/30",
    icon: "bg-green-100 text-green-700",
    value: "text-green-800",
  },
  "profit-warn": {
    card: "border-red-100/80 bg-gradient-to-br from-red-50/70 via-card to-red-50/20",
    icon: "bg-red-100 text-fti-red",
    value: "text-fti-red",
  },
  goal: {
    card: "border-primary/15 bg-gradient-to-br from-light-purple/80 via-card to-primary/5",
    icon: "bg-light-purple text-primary",
    value: "text-primary",
  },
  warn: {
    card: "border-red-100/80 bg-gradient-to-br from-red-50/60 via-card to-orange-50/20",
    icon: "bg-red-100 text-fti-red",
    value: "text-fti-red",
  },
};

export function SimulatorKpiCard({
  label,
  value,
  subtitle,
  icon: Icon,
  variant = "neutral",
  className,
}: SimulatorKpiCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "rounded-[20px] border p-5 shadow-sm shadow-gray-200/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]",
        styles.card,
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            styles.icon,
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <p className="text-xs font-medium text-[#8A94A6]">{label}</p>
      </div>
      <p
        className={cn(
          "text-2xl font-bold tracking-tight sm:text-3xl",
          styles.value,
        )}
      >
        {value}
      </p>
      {subtitle && (
        <p className="mt-2 text-xs leading-relaxed text-[#8A94A6]">{subtitle}</p>
      )}
    </div>
  );
}

interface SimulatorKpiGridProps {
  children: React.ReactNode;
  className?: string;
}

export function SimulatorKpiGrid({ children, className }: SimulatorKpiGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
