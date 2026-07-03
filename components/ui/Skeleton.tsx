import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-gray-200/70", className)}
      aria-hidden
    />
  );
}

export function ProductListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="page-shell space-y-4">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      </div>
      <div className="rounded-[20px] border border-gray-100 bg-card p-6">
        <Skeleton className="h-4 w-28" />
        <div className="mt-4 grid gap-4 lg:grid-cols-4">
          <Skeleton className="h-10 lg:col-span-2" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="rounded-[20px] border border-gray-100 bg-card p-5"
          >
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-2 h-3 w-24" />
            <div className="mt-4 flex gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
