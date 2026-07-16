"use client";

import { Gift } from "lucide-react";
import { cn } from "@/lib/utils";

interface GiftCatalogPlaceholderImageProps {
  className?: string;
  label?: string;
}

export function GiftCatalogPlaceholderImage({
  className,
  label = "No image",
}: GiftCatalogPlaceholderImageProps) {
  return (
    <div
      className={cn(
        "flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-gray-100 text-gray-400",
        className,
      )}
    >
      <div className="text-center">
        <Gift className="mx-auto h-8 w-8 opacity-60" />
        <p className="mt-1 text-[10px] font-medium">{label}</p>
      </div>
    </div>
  );
}
