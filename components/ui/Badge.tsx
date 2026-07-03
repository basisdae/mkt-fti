import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "muted";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-light-purple text-primary",
  success: "bg-green-50 text-success",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-fti-red",
  muted: "bg-gray-100 text-gray-600",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
