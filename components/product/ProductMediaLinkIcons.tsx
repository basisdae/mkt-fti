"use client";

import { useAssetPlatforms } from "@/hooks/AssetPlatformStore";
import {
  findAssetPlatform,
  getAssetPlatformColorClass,
  getAssetPlatformIcon,
} from "@/lib/asset-platforms";
import {
  getActiveMediaLinks,
  getMediaLinkIcon,
  getMediaOpenUrl,
  PRODUCT_MEDIA_TYPE_LABELS,
} from "@/lib/product-media";
import { cn } from "@/lib/utils";
import type { ProductMediaLink } from "@/types/product";

interface ProductMediaLinkIconsProps {
  links?: ProductMediaLink[] | null;
  className?: string;
  /** Stop click from bubbling (e.g. inside a parent Link). */
  stopPropagation?: boolean;
}

export function ProductMediaLinkIcons({
  links,
  className,
  stopPropagation = true,
}: ProductMediaLinkIconsProps) {
  const { platforms } = useAssetPlatforms();
  const active = getActiveMediaLinks(links);
  if (active.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {active.map((link) => {
        const platform = findAssetPlatform(platforms, link.platform);
        const Icon = platform
          ? getAssetPlatformIcon(platform.iconKey)
          : getMediaLinkIcon(link.mediaType);
        const colorClass = platform
          ? getAssetPlatformColorClass(platform.colorToken)
          : "text-gray-400";
        const href = getMediaOpenUrl(link);
        if (!href) return null;
        const label =
          link.title ||
          platform?.name ||
          PRODUCT_MEDIA_TYPE_LABELS[link.mediaType];
        return (
          <a
            key={link.id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={label}
            aria-label={label}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-gray-100",
              colorClass,
            )}
            onClick={(e) => {
              if (stopPropagation) e.stopPropagation();
            }}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
          </a>
        );
      })}
    </div>
  );
}
