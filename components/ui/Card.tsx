import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
}

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  children,
  className,
  padding = "md",
  interactive = false,
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-gray-100 bg-card shadow-sm",
        interactive &&
          "transition-all duration-200 hover:border-primary/15 hover:shadow-[var(--shadow-card-hover)]",
        paddingMap[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}
