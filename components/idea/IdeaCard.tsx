"use client";

import { useRouter } from "next/navigation";
import {
  ExternalLink,
  ImageIcon,
  PackagePlus,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  IDEA_SOURCE_PLATFORM_LABELS,
  IDEA_STATUS_LABELS,
  IDEA_STATUS_STYLES,
} from "@/lib/idea-constants";
import { cn, formatDate } from "@/lib/utils";
import type { IdeaStatus, ProductIdea } from "@/types/idea";

interface IdeaCardProps {
  idea: ProductIdea;
  onStatusChange: (ideaId: string, status: IdeaStatus) => void;
  onConvert: (ideaId: string) => void;
  converting?: boolean;
}

export function IdeaCard({
  idea,
  onStatusChange,
  onConvert,
  converting = false,
}: IdeaCardProps) {
  const router = useRouter();
  const styles = IDEA_STATUS_STYLES[idea.status];
  const isConverted = idea.status === "converted";

  function handleConvert() {
    onConvert(idea.id);
  }

  return (
    <Card padding="lg" className="flex h-full flex-col">
      <div className="flex gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gradient-to-br from-light-purple/30 to-white text-gray-300">
          {idea.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={idea.imageUrl}
              alt=""
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            <ImageIcon className="h-8 w-8" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-2">
            <h3 className="min-w-0 flex-1 text-base font-semibold text-gray-900">
              {idea.productName}
            </h3>
            <Badge className={cn(styles.badge)}>
              {IDEA_STATUS_LABELS[idea.status]}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {IDEA_SOURCE_PLATFORM_LABELS[idea.sourcePlatform]}
            {idea.sourceLink && (
              <>
                {" · "}
                <a
                  href={idea.sourceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-primary hover:underline"
                >
                  Source link
                  <ExternalLink className="h-3 w-3" />
                </a>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Why Interesting
          </p>
          <p className="mt-1 text-gray-600 line-clamp-3">{idea.whyInteresting}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Possible Brand
            </p>
            <p className="mt-1 font-medium text-gray-800">{idea.possibleBrand}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Est. Price Range
            </p>
            <p className="mt-1 font-medium text-gray-800">
              {idea.estimatedPriceRange}
            </p>
          </div>
        </div>

        {idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {idea.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor={`status-${idea.id}`} className="sr-only">
            Status
          </label>
          <select
            id={`status-${idea.id}`}
            value={idea.status}
            disabled={isConverted}
            onChange={(e) =>
              onStatusChange(idea.id, e.target.value as IdeaStatus)
            }
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          >
            {(
              Object.entries(IDEA_STATUS_LABELS) as [IdeaStatus, string][]
            ).map(([value, label]) => (
              <option key={value} value={value} disabled={value === "converted"}>
                {label}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-400">
            {formatDate(idea.updatedAt)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {isConverted && idea.convertedProductId ? (
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={() => router.push("/products")}
            >
              <Sparkles className="h-3.5 w-3.5" />
              View in Products
            </Button>
          ) : (
            <Button
              size="sm"
              className="gap-1.5"
              disabled={isConverted || converting || idea.status === "rejected"}
              onClick={handleConvert}
            >
              <PackagePlus className="h-3.5 w-3.5" />
              {converting ? "Converting…" : "Convert to Product"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
