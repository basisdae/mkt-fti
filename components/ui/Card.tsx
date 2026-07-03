import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({ children, className, padding = "md" }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-gray-100 bg-card shadow-sm",
        paddingMap[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}
