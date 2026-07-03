"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Clock3,
  Package,
  ShieldCheck,
} from "lucide-react";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { usePipelineStore } from "@/hooks/PipelineStore";
import { useProductNotesStore } from "@/hooks/ProductNotesStore";
import { PRODUCT_TIMELINE_LABELS } from "@/lib/product-timeline";
import { getLatestProducts } from "@/lib/dashboard-summary";
import { PRODUCT_STATUS_LABELS } from "@/lib/constants";
import { resolveProductImageAlt } from "@/lib/product-image";
import { cn, formatDate, getStatusColor, timeAgo } from "@/lib/utils";
import type { ProductNote, ProductTimelineMovement } from "@/types/product";

type ActivityTab = "timeline" | "factory" | "certification" | "latest";

const TABS: {
  id: ActivityTab;
  label: string;
  icon: typeof Clock3;
}[] = [
  { id: "timeline", label: "Timeline", icon: Clock3 },
  { id: "factory", label: "Factory Updates", icon: Building2 },
  { id: "certification", label: "Certification Updates", icon: ShieldCheck },
  { id: "latest", label: "Latest Products", icon: Package },
];

function FeedRow({
  title,
  subtitle,
  detail,
  time,
  href,
}: {
  title: string;
  subtitle: string;
  detail: string;
  time: string;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="mt-0.5 text-sm text-primary">{subtitle}</p>
      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-500">
        {detail}
      </p>
      <p className="mt-2 text-[11px] text-gray-400">{timeAgo(time)}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="dashboard-activity-row block px-5 py-4 transition-colors hover:bg-light-purple/25 sm:px-6"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="dashboard-activity-row px-5 py-4 sm:px-6">{content}</div>
  );
}

function TimelineTab({
  items,
  productIds,
}: {
  items: (ProductTimelineMovement & { productName: string })[];
  productIds?: Set<string>;
}) {
  const filtered = productIds
    ? items.filter((item) => productIds.has(item.productId))
    : items;

  if (filtered.length === 0) {
    return (
      <p className="px-6 py-8 text-center text-sm text-gray-400">
        No timeline movements yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-50/80">
      {filtered.map((item) => (
        <li key={item.id}>
          <FeedRow
            title={PRODUCT_TIMELINE_LABELS[item.stage]}
            subtitle={item.productName}
            detail={item.note}
            time={item.occurredAt}
            href={`/timeline?product=${item.productId}`}
          />
        </li>
      ))}
    </ul>
  );
}

function FactoryTab({
  notes,
  productIds,
}: {
  notes: ProductNote[];
  productIds?: Set<string>;
}) {
  const { products } = usePipelineStore();
  const nameById = useMemo(
    () => new Map(products.map((p) => [p.id, p.name])),
    [products],
  );

  const filtered = productIds
    ? notes.filter((n) => productIds.has(n.productId))
    : notes;

  if (filtered.length === 0) {
    return (
      <p className="px-6 py-8 text-center text-sm text-gray-400">
        No factory updates recorded.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-50/80">
      {filtered.map((note) => (
        <li key={note.id}>
          <FeedRow
            title={note.title}
            subtitle={nameById.get(note.productId) ?? "Product"}
            detail={note.body.split("\n")[0] ?? note.body}
            time={note.updatedAt}
            href={`/notes?product=${note.productId}`}
          />
        </li>
      ))}
    </ul>
  );
}

function CertificationTab({
  timelineItems,
  products,
  productIds,
}: {
  timelineItems: (ProductTimelineMovement & { productName: string })[];
  products: ReturnType<typeof usePipelineStore>["products"];
  productIds?: Set<string>;
}) {
  const scopedProducts = productIds
    ? products.filter((p) => productIds.has(p.id))
    : products;

  const certProducts = scopedProducts.filter(
    (p) => p.pipelineStage === "certification",
  );
  const certTimeline = timelineItems.filter(
    (m) =>
      m.stage === "certification" &&
      (!productIds || productIds.has(m.productId)),
  );

  const rows = [
    ...certTimeline.map((m) => ({
      id: m.id,
      title: "Certification milestone",
      subtitle: m.productName,
      detail: m.note,
      time: m.occurredAt,
      href: `/timeline?product=${m.productId}`,
    })),
    ...certProducts
      .filter((p) => !certTimeline.some((m) => m.productId === p.id))
      .map((p) => ({
        id: `cert-${p.id}`,
        title: "In certification review",
        subtitle: p.name,
        detail: p.latestNote || "TISI / compliance documentation in progress.",
        time: p.updatedAt,
        href: `/products/${p.id}`,
      })),
  ].sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
  );

  if (rows.length === 0) {
    return (
      <p className="px-6 py-8 text-center text-sm text-gray-400">
        No certification activity right now.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-50/80">
      {rows.slice(0, 8).map((row) => (
        <li key={row.id}>
          <FeedRow
            title={row.title}
            subtitle={row.subtitle}
            detail={row.detail}
            time={row.time}
            href={row.href}
          />
        </li>
      ))}
    </ul>
  );
}

function LatestProductsTab({
  products,
  productIds,
}: {
  products: ReturnType<typeof usePipelineStore>["products"];
  productIds?: Set<string>;
}) {
  const scoped = productIds
    ? products.filter((p) => productIds.has(p.id))
    : products;
  const latest = getLatestProducts(scoped, 6);

  return (
    <ul className="divide-y divide-gray-50/80">
      {latest.map((product) => {
        const statusStyle = getStatusColor(product.status);
        return (
          <li key={product.id}>
            <Link
              href={`/products/${product.id}`}
              className="dashboard-activity-row flex items-center gap-4 px-5 py-4 transition-colors hover:bg-light-purple/25 sm:px-6"
            >
              <ProductImageDisplay
                src={product.imageUrl}
                alt={resolveProductImageAlt(product)}
                size="sm"
                className="p-1"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {product.name}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {product.supplier}
                </p>
                <p className="mt-1 text-[11px] text-gray-400">
                  Updated {formatDate(product.updatedAt)}
                </p>
              </div>
              <Badge variant={statusStyle.badge} className="shrink-0">
                {PRODUCT_STATUS_LABELS[product.status]}
              </Badge>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function RecentActivitiesPanel({
  productIds,
}: {
  productIds?: Set<string>;
} = {}) {
  const [tab, setTab] = useState<ActivityTab>("timeline");
  const { products, recentTimelineFeed } = usePipelineStore();
  const { notes } = useProductNotesStore();

  const factoryNotes = useMemo(
    () =>
      [...notes]
        .filter((n) => n.type === "factory_comment")
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .slice(0, 8),
    [notes],
  );

  return (
    <section className="dashboard-activities">
      <Card
        padding="none"
        className="overflow-hidden border-gray-100/80 shadow-[0_8px_32px_-12px_rgb(17_24_39_0.08)]"
      >
        <div className="border-b border-gray-100/80 bg-gradient-to-r from-light-purple/20 via-white to-light-purple/10 px-5 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-gray-900">
            Recent Activities
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Timeline, factory, certification, and product updates
          </p>
        </div>

        <div
          className="flex gap-1 overflow-x-auto border-b border-gray-100/80 px-3 py-2 sm:px-4"
          role="tablist"
        >
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 sm:text-sm",
                  active
                    ? "bg-primary text-white shadow-md shadow-primary/25"
                    : "text-gray-600 hover:bg-light-purple/50 hover:text-primary",
                )}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div role="tabpanel">
          {tab === "timeline" && (
            <TimelineTab items={recentTimelineFeed} productIds={productIds} />
          )}
          {tab === "factory" && (
            <FactoryTab notes={factoryNotes} productIds={productIds} />
          )}
          {tab === "certification" && (
            <CertificationTab
              timelineItems={recentTimelineFeed}
              products={products}
              productIds={productIds}
            />
          )}
          {tab === "latest" && (
            <LatestProductsTab products={products} productIds={productIds} />
          )}
        </div>
      </Card>
    </section>
  );
}
