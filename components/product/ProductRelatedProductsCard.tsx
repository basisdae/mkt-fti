"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Link2, Pencil, Plus, Trash2 } from "lucide-react";
import { Select } from "@/components/forms/Select";
import { ProductCardTitle } from "@/components/product/ProductCardTitle";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLiveProducts } from "@/hooks/PipelineStore";
import { generateId } from "@/lib/generate-id";
import {
  flattenOutgoingRelatedLinks,
  groupOutgoingRelatedLinks,
  PRODUCT_COMPATIBLE_WITH_LABEL,
  PRODUCT_RELATION_TYPE_HINTS,
  PRODUCT_RELATION_TYPE_LABELS,
  PRODUCT_RELATION_TYPES,
} from "@/lib/product-related";
import { resolveProductImageAlt } from "@/lib/product-image";
import {
  saveProductRelatedLinks,
  listProductRelatedLinkSet,
  type ProductRelatedLinkSet,
} from "@/lib/services/product-related";
import type {
  ProductRelatedLink,
  ProductRelationType,
  ProductView,
} from "@/types/product";

function emptyRelationPickerState(): Record<ProductRelationType, string> {
  return Object.fromEntries(
    PRODUCT_RELATION_TYPES.map((type) => [type, ""]),
  ) as Record<ProductRelationType, string>;
}

interface ProductRelatedProductsCardProps {
  productId: string;
  outgoing: ProductRelatedLink[];
  incoming: ProductRelatedLink[];
  onLinksChange: (set: ProductRelatedLinkSet) => void;
  canEdit?: boolean;
}

function RelatedProductRow({
  product,
  subtitle,
  onRemove,
}: {
  product: ProductView;
  subtitle?: string;
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5">
      <Link
        href={`/products/${product.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-80"
      >
        <ProductImageDisplay
          src={product.imageUrl}
          alt={resolveProductImageAlt(product)}
          size="sm"
        />
        <div className="min-w-0">
          <ProductCardTitle as="span" className="min-h-0 text-sm">
            {product.name}
          </ProductCardTitle>
          <p className="mt-0.5 truncate text-xs text-gray-400">{product.code}</p>
          {subtitle ? (
            <p className="mt-0.5 text-[11px] text-gray-400">{subtitle}</p>
          ) : null}
        </div>
      </Link>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-fti-red"
          aria-label={`Remove ${product.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

function RelationSection({
  title,
  hint,
  links,
  resolveProduct,
  emptyLabel,
  editing,
  onRemove,
  addControl,
}: {
  title: string;
  hint?: string;
  links: ProductRelatedLink[];
  resolveProduct: (id: string) => ProductView | undefined;
  emptyLabel: string;
  editing?: boolean;
  onRemove?: (linkId: string) => void;
  addControl?: React.ReactNode;
}) {
  const rows = links
    .map((link) => {
      const related = resolveProduct(link.relatedProductId);
      if (!related) return null;
      return { link, related };
    })
    .filter((row): row is { link: ProductRelatedLink; related: ProductView } =>
      Boolean(row),
    );

  if (rows.length === 0 && !editing) return null;

  return (
    <div>
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {hint ? <p className="mt-0.5 text-xs text-gray-400">{hint}</p> : null}
      </div>
      {rows.length > 0 ? (
        <ul className="space-y-2">
          {rows.map(({ link, related }) => (
            <li key={link.id}>
              <RelatedProductRow
                product={related}
                onRemove={
                  editing && onRemove ? () => onRemove(link.id) : undefined
                }
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-6 text-center text-xs text-gray-400">
          {emptyLabel}
        </p>
      )}
      {editing && addControl ? <div className="mt-3">{addControl}</div> : null}
    </div>
  );
}

function IncomingSection({
  links,
  resolveProduct,
}: {
  links: ProductRelatedLink[];
  resolveProduct: (id: string) => ProductView | undefined;
}) {
  const rows = links
    .map((link) => {
      const source = resolveProduct(link.productId);
      if (!source) return null;
      const relationLabel =
        PRODUCT_RELATION_TYPE_LABELS[link.relationType] ?? link.relationType;
      return { link, source, relationLabel };
    })
    .filter(
      (
        row,
      ): row is {
        link: ProductRelatedLink;
        source: ProductView;
        relationLabel: string;
      } => Boolean(row),
    );

  if (rows.length === 0) return null;

  return (
    <div>
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-gray-900">
          {PRODUCT_COMPATIBLE_WITH_LABEL}
        </h3>
        <p className="mt-0.5 text-xs text-gray-400">
          Products that reference this item (auto-linked)
        </p>
      </div>
      <ul className="space-y-2">
        {rows.map(({ link, source, relationLabel }) => (
          <li key={link.id}>
            <RelatedProductRow
              product={source}
              subtitle={`Linked as ${relationLabel.toLowerCase()}`}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProductRelatedProductsCard({
  productId,
  outgoing,
  incoming,
  onLinksChange,
  canEdit = false,
}: ProductRelatedProductsCardProps) {
  const catalog = useLiveProducts();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<ProductRelationType, ProductRelatedLink[]>>(
    () => groupOutgoingRelatedLinks(outgoing),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerByType, setPickerByType] = useState(emptyRelationPickerState);

  const resolveProduct = useMemo(() => {
    const byId = new Map(catalog.map((product) => [product.id, product]));
    return (id: string) => byId.get(id);
  }, [catalog]);

  const groupedOutgoing = useMemo(
    () => groupOutgoingRelatedLinks(outgoing),
    [outgoing],
  );

  const hasAnyLinks =
    outgoing.length > 0 || incoming.length > 0;

  function startEdit() {
    setDraft(groupOutgoingRelatedLinks(outgoing));
    setPickerByType(emptyRelationPickerState());
    setError(null);
    setEditing(true);
  }

  function addLink(relationType: ProductRelationType, relatedProductId: string) {
    if (!relatedProductId || relatedProductId === productId) return;

    setDraft((prev) => {
      const existing = prev[relationType];
      if (existing.some((link) => link.relatedProductId === relatedProductId)) {
        return prev;
      }
      return {
        ...prev,
        [relationType]: [
          ...existing,
          {
            id: generateId(),
            productId,
            relatedProductId,
            relationType,
            sortOrder: existing.length,
          },
        ],
      };
    });
    setPickerByType((prev) => ({ ...prev, [relationType]: "" }));
  }

  function removeLink(relationType: ProductRelationType, linkId: string) {
    setDraft((prev) => ({
      ...prev,
      [relationType]: prev[relationType].filter((link) => link.id !== linkId),
    }));
  }

  function buildPickerOptions(
    relationType: ProductRelationType,
    currentLinks: ProductRelatedLink[],
  ) {
    const blocked = new Set([
      productId,
      ...currentLinks.map((link) => link.relatedProductId),
    ]);
    return [
      { value: "", label: "Select a product…" },
      ...catalog
        .filter((product) => !blocked.has(product.id))
        .sort((a, b) => a.code.localeCompare(b.code))
        .map((product) => ({
          value: product.id,
          label: `${product.code} — ${product.name}`,
        })),
    ];
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const flat = flattenOutgoingRelatedLinks(draft);
      const saved = await saveProductRelatedLinks(productId, flat);
      const refreshed = await listProductRelatedLinkSet(productId);
      onLinksChange({
        outgoing: saved,
        incoming: refreshed.incoming,
      });
      setEditing(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save related products.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card padding="lg" className="mb-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-gray-900">
              Related Products
            </h2>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Link products by ID without duplicating data. Relationships are
            bi-directional — linked items appear on both products.
          </p>
        </div>
        {canEdit && !editing && (
          <Button type="button" size="sm" variant="secondary" onClick={startEdit}>
            <Pencil className="h-3.5 w-3.5" />
            {hasAnyLinks ? "Manage Links" : "Add Links"}
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-6">
          {PRODUCT_RELATION_TYPES.map((relationType) => (
            <RelationSection
              key={relationType}
              title={PRODUCT_RELATION_TYPE_LABELS[relationType]}
              hint={PRODUCT_RELATION_TYPE_HINTS[relationType]}
              links={draft[relationType]}
              resolveProduct={resolveProduct}
              emptyLabel="No products linked yet"
              editing
              onRemove={(linkId) => removeLink(relationType, linkId)}
              addControl={
                <Select
                  label="Add product"
                  options={buildPickerOptions(relationType, draft[relationType])}
                  value={pickerByType[relationType]}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value) addLink(relationType, value);
                    else
                      setPickerByType((prev) => ({
                        ...prev,
                        [relationType]: "",
                      }));
                  }}
                />
              }
            />
          ))}

          <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={saving}
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving}
              aria-busy={saving}
              onClick={handleSave}
            >
              {saving ? "Saving…" : "Save Links"}
            </Button>
          </div>
          {error ? (
            <p className="text-sm font-medium text-fti-red">{error}</p>
          ) : null}
        </div>
      ) : hasAnyLinks ? (
        <div className="space-y-6">
          {PRODUCT_RELATION_TYPES.map((relationType) => (
            <RelationSection
              key={relationType}
              title={PRODUCT_RELATION_TYPE_LABELS[relationType]}
              hint={PRODUCT_RELATION_TYPE_HINTS[relationType]}
              links={groupedOutgoing[relationType]}
              resolveProduct={resolveProduct}
              emptyLabel="No products linked"
            />
          ))}
          <IncomingSection links={incoming} resolveProduct={resolveProduct} />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center">
          <Link2 className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-600">
            No related products yet
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Link consumables, accessories, or compatible products by product ID.
          </p>
          {canEdit ? (
            <Button
              type="button"
              size="sm"
              className="mt-4"
              onClick={startEdit}
            >
              <Plus className="h-4 w-4" />
              Add Links
            </Button>
          ) : null}
        </div>
      )}
    </Card>
  );
}
