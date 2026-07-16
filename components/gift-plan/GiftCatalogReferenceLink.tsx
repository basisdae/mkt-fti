"use client";

import { ExternalLink } from "lucide-react";
import { formatReferenceUrlDomain } from "@/lib/gift-catalog-url";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import { cn } from "@/lib/utils";

interface GiftCatalogReferenceLinkProps {
  url: string | null | undefined;
  variant?: "icon" | "button" | "text";
  className?: string;
}

export function GiftCatalogReferenceLink({
  url,
  variant = "button",
  className,
}: GiftCatalogReferenceLinkProps) {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  const domain = formatReferenceUrlDomain(trimmed);

  if (variant === "icon") {
    return (
      <a
        href={trimmed}
        target="_blank"
        rel="noopener noreferrer"
        title={t.openReferenceLink}
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-lg text-primary hover:bg-light-purple/60",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    );
  }

  if (variant === "text") {
    return (
      <a
        href={trimmed}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "block max-w-full truncate text-xs text-primary hover:underline",
          className,
        )}
        title={trimmed}
        onClick={(e) => e.stopPropagation()}
      >
        {domain}
      </a>
    );
  }

  return (
    <a
      href={trimmed}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-primary hover:bg-gray-50",
        className,
      )}
      title={trimmed}
      onClick={(e) => e.stopPropagation()}
    >
      <ExternalLink className="h-3 w-3 shrink-0" />
      <span className="truncate">{t.openReferenceLink}</span>
    </a>
  );
}
