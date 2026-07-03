import { cn } from "@/lib/utils";
import type { DashboardMetric } from "@/types/product";

interface StatCardProps {
  metric: DashboardMetric;
  className?: string;
  accent?: "purple" | "amber" | "sky" | "green";
}

const accentStyles = {
  purple: "from-light-purple/80 to-card",
  amber: "from-amber-50/80 to-card",
  sky: "from-sky-50/80 to-card",
  green: "from-green-50/80 to-card",
};

export function StatCard({
  metric,
  className,
  accent = "purple",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-gray-100 bg-gradient-to-br p-5 shadow-sm shadow-gray-200/50 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/10 hover:shadow-[var(--shadow-card-hover)] sm:p-6",
        accentStyles[accent],
        className,
      )}
    >
      <p className="text-sm font-medium text-gray-500">{metric.label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {metric.value}
      </p>
      {metric.change && (
        <p className="mt-3 text-sm text-gray-400">{metric.change}</p>
      )}
    </div>
  );
}
