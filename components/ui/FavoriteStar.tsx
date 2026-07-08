"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface FavoriteStarProps {
  active: boolean;
  onToggle: () => void;
  label: string;
  className?: string;
}

export function FavoriteStar({
  active,
  onToggle,
  label,
  className,
}: FavoriteStarProps) {
  return (
    <button
      type="button"
      title={active ? `Remove ${label} from favorites` : `Add ${label} to favorites`}
      aria-label={active ? `Unfavorite ${label}` : `Favorite ${label}`}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-white/95 shadow-sm transition-colors",
        active
          ? "border-amber-200 text-amber-500 hover:bg-amber-50"
          : "border-gray-200 text-gray-300 hover:border-amber-200 hover:text-amber-400",
        className,
      )}
    >
      <Star
        className={cn("h-4 w-4", active && "fill-amber-400 text-amber-500")}
      />
    </button>
  );
}
