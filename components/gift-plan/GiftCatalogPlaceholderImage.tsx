"use client";

import { Gift } from "lucide-react";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import { cn } from "@/lib/utils";

interface GiftCatalogPlaceholderImageProps {
  className?: string;
  label?: string;
}

export function GiftCatalogPlaceholderImage({
  className,
  label = t.noImage,
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
