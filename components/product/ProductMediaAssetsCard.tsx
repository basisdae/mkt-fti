"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Link2, Plus, Trash2, Video } from "lucide-react";
// Link2 used in PlatformBadge
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAssetPlatforms } from "@/hooks/AssetPlatformStore";
import { usePipelineStore } from "@/hooks/PipelineStore";
import {
  findAssetPlatform,
  getAssetPlatformColorClass,
  getAssetPlatformIcon,
  getSelectablePlatforms,
} from "@/lib/asset-platforms";
import { generateId } from "@/lib/generate-id";
import {
  createEmptyMediaLink,
  getActiveMediaLinks,
  getMediaLinkIcon,
  getMediaOpenUrl,
  isHiddenVideoRef,
  PRODUCT_MEDIA_TYPE_LABELS,
  PRODUCT_MEDIA_TYPE_OPTIONS,
  resolveMediaEmbedSrc,
} from "@/lib/product-media";
import type { ProductMediaLink, ProductMediaType, ProductView } from "@/types/product";

interface ProductMediaAssetsCardProps {
  product: ProductView;
  canEdit?: boolean;
}

function OpenSourcePageButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm font-medium text-primary hover:bg-light-purple/40"
    >
      <ExternalLink className="h-4 w-4" />
      Open Source Page
    </a>
  );
}

function PlatformBadge({
  platformValue,
}: {
  platformValue: string;
}) {
  const { platforms } = useAssetPlatforms();
  const platform = findAssetPlatform(platforms, platformValue);
  const Icon = platform
    ? getAssetPlatformIcon(platform.iconKey)
    : Link2;
  const colorClass = platform
    ? getAssetPlatformColorClass(platform.colorToken)
    : "text-gray-400";
  const label = platform?.name || platformValue || "Other";

  return (
    <span className={`inline-flex items-center gap-1 text-xs ${colorClass}`}>
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      {label}
    </span>
  );
}

function AssetDisplayCard({ link }: { link: ProductMediaLink }) {
  const openUrl = getMediaOpenUrl(link);
  const embedSrc = resolveMediaEmbedSrc(link);
  const title = link.title || PRODUCT_MEDIA_TYPE_LABELS[link.mediaType];
  const TypeIcon = getMediaLinkIcon(link.mediaType);

  if (isHiddenVideoRef(link)) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
        <div className="flex flex-col gap-4 p-4 sm:flex-row">
          <div className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 sm:w-40">
            {link.coverImageUrl.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={link.coverImageUrl.trim()}
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : (
              <Video className="h-8 w-8 text-gray-300" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <TypeIcon className="h-4 w-4 text-gray-400" strokeWidth={1.75} />
                <p className="text-sm font-semibold text-gray-900">{title}</p>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                <span>Hidden Video Reference</span>
                {link.platform ? <PlatformBadge platformValue={link.platform} /> : null}
              </div>
            </div>
            <dl className="grid gap-1 text-xs text-gray-600 sm:grid-cols-2">
              {link.videoId.trim() && (
                <div>
                  <dt className="font-medium text-gray-400">Video ID</dt>
                  <dd className="font-mono text-gray-800">{link.videoId}</dd>
                </div>
              )}
              {link.videoFileName.trim() && (
                <div>
                  <dt className="font-medium text-gray-400">File name</dt>
                  <dd className="font-mono text-gray-800">
                    {link.videoFileName}
                  </dd>
                </div>
              )}
              {link.duration.trim() && (
                <div>
                  <dt className="font-medium text-gray-400">Duration</dt>
                  <dd className="text-gray-800">{link.duration}</dd>
                </div>
              )}
            </dl>
            {link.remark.trim() && (
              <p className="text-xs text-gray-500">{link.remark}</p>
            )}
            {openUrl && <OpenSourcePageButton href={openUrl} />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <TypeIcon className="h-4 w-4 text-gray-400" strokeWidth={1.75} />
            <p className="text-sm font-semibold text-gray-900">{title}</p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
            <span>{PRODUCT_MEDIA_TYPE_LABELS[link.mediaType]}</span>
            {link.platform ? (
              <PlatformBadge platformValue={link.platform} />
            ) : null}
          </div>
          {openUrl && (
            <p className="mt-1 truncate text-xs text-gray-500">{openUrl}</p>
          )}
          {link.remark.trim() && (
            <p className="mt-1 text-xs text-gray-500">{link.remark}</p>
          )}
        </div>
        {openUrl && <OpenSourcePageButton href={openUrl} />}
      </div>
      {embedSrc && (
        <div className="mt-3 overflow-hidden rounded-xl border border-gray-100 bg-black/5">
          <div className="aspect-video w-full">
            <iframe
              src={embedSrc}
              title={title}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function AssetEditorFields({
  row,
  index,
  onChange,
  onRemove,
  platformOptions,
}: {
  row: ProductMediaLink;
  index: number;
  onChange: (patch: Partial<ProductMediaLink>) => void;
  onRemove: () => void;
  platformOptions: { value: string; label: string }[];
}) {
  const isHidden = row.mediaType === "hidden_video_ref";
  const platformValue = platformOptions.some(
    (option) => option.value === row.platform,
  )
    ? row.platform
    : platformOptions.find(
        (option) =>
          option.label.toLowerCase() === row.platform.toLowerCase(),
      )?.value || "other";

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Asset {index + 1}
        </p>
        <button
          type="button"
          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-fti-red"
          onClick={onRemove}
          aria-label="Remove asset"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Title"
          value={row.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. Ulager Product Video"
        />
        <Select
          label="Type"
          options={PRODUCT_MEDIA_TYPE_OPTIONS}
          value={row.mediaType}
          onChange={(e) =>
            onChange({ mediaType: e.target.value as ProductMediaType })
          }
        />
        <Input
          label={isHidden ? "Source Page URL" : "URL"}
          value={row.url}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder="Paste page URL copied from browser"
        />
        <Select
          label="Platform"
          options={platformOptions}
          value={platformValue}
          onChange={(e) => onChange({ platform: e.target.value })}
        />

        {isHidden && (
          <>
            <Input
              label="Video ID / Reference ID"
              value={row.videoId}
              onChange={(e) => onChange({ videoId: e.target.value })}
              placeholder="e.g. 6000318926159"
            />
            <Input
              label="Video File Name (optional)"
              value={row.videoFileName}
              onChange={(e) => onChange({ videoFileName: e.target.value })}
              placeholder="e.g. 12.12f.mp4"
            />
            <Input
              label="Cover Image URL (optional)"
              value={row.coverImageUrl}
              onChange={(e) => onChange({ coverImageUrl: e.target.value })}
              placeholder="Paste thumbnail URL if available"
            />
            <Input
              label="Duration (optional)"
              value={row.duration}
              onChange={(e) => onChange({ duration: e.target.value })}
              placeholder="e.g. 38 sec"
            />
          </>
        )}

        {!isHidden && row.mediaType !== "source_page" && (
          <Input
            label="Embed URL (optional)"
            value={row.embedUrl}
            onChange={(e) => onChange({ embedUrl: e.target.value })}
            placeholder="Only if you have a direct embed URL"
          />
        )}

        <label className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
          <span className="text-sm font-medium text-gray-700">Active</span>
          <input
            type="checkbox"
            className="h-4 w-4 rounded accent-primary"
            checked={row.isActive}
            onChange={(e) => onChange({ isActive: e.target.checked })}
          />
        </label>
      </div>

      <div className="mt-3">
        <Textarea
          label="Remark"
          value={row.remark}
          onChange={(e) => onChange({ remark: e.target.value })}
          rows={2}
          placeholder={
            isHidden
              ? "e.g. Alibaba embedded video, direct MP4 is hidden."
              : "Internal note"
          }
        />
      </div>
    </div>
  );
}

export function ProductMediaAssetsCard({
  product,
  canEdit = false,
}: ProductMediaAssetsCardProps) {
  const { updateProductMediaLinks } = usePipelineStore();
  const { platforms } = useAssetPlatforms();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProductMediaLink[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const links = product.mediaLinks ?? [];
  const activeLinks = useMemo(() => getActiveMediaLinks(links), [links]);

  const platformOptions = useMemo(() => {
    const selectable = getSelectablePlatforms(platforms);
    const options = selectable.map((platform) => ({
      value: platform.id,
      label: platform.name,
    }));
    // Keep disabled platforms that are already used on this product.
    for (const link of links) {
      const existing = findAssetPlatform(platforms, link.platform);
      if (
        existing &&
        !options.some((option) => option.value === existing.id)
      ) {
        options.push({
          value: existing.id,
          label: `${existing.name} (disabled)`,
        });
      }
    }
    return options;
  }, [platforms, links]);

  function startEdit() {
    setDraft(
      links.length > 0
        ? links.map((link) => ({
            ...createEmptyMediaLink(product.id),
            ...link,
          }))
        : [
            {
              id: generateId(),
              ...createEmptyMediaLink(product.id, 0, "source_page"),
              platform: "alibaba",
            },
          ],
    );
    setError(null);
    setEditing(true);
  }

  function addRow(type: ProductMediaType = "source_page") {
    setDraft((prev) => [
      ...prev,
      {
        id: generateId(),
        ...createEmptyMediaLink(product.id, prev.length, type),
        platform: platformOptions[0]?.value ?? "other",
      },
    ]);
  }

  function updateRow(id: string, patch: Partial<ProductMediaLink>) {
    setDraft((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function removeRow(id: string) {
    setDraft((prev) => prev.filter((row) => row.id !== id));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const cleaned = draft
        .map((row, index) => ({
          ...row,
          productId: product.id,
          title: row.title.trim() || PRODUCT_MEDIA_TYPE_LABELS[row.mediaType],
          url: row.url.trim(),
          embedUrl: row.embedUrl.trim(),
          platform: row.platform.trim(),
          videoId: row.videoId.trim(),
          videoFileName: row.videoFileName.trim(),
          coverImageUrl: row.coverImageUrl.trim(),
          duration: row.duration.trim(),
          remark: row.remark.trim(),
          sortOrder: index,
        }))
        .filter((row) => {
          if (row.mediaType === "hidden_video_ref") {
            return Boolean(row.url || row.videoId);
          }
          return Boolean(row.url || row.embedUrl);
        });

      await updateProductMediaLinks(product.id, cleaned);
      setEditing(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save assets. Ensure product_media_links exists in Supabase.",
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
              Product Assets
            </h2>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Store source page URLs and hidden video references you paste
            manually. No search, crawl, or download.
          </p>
        </div>
        {canEdit && !editing && (
          <Button type="button" size="sm" variant="secondary" onClick={startEdit}>
            {links.length > 0 ? "Manage Assets" : "Add Asset"}
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          {draft.map((row, index) => (
            <AssetEditorFields
              key={row.id}
              row={row}
              index={index}
              platformOptions={platformOptions}
              onChange={(patch) => updateRow(row.id, patch)}
              onRemove={() => removeRow(row.id)}
            />
          ))}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => addRow("source_page")}
            >
              <Plus className="h-4 w-4" />
              Source Page
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => addRow("hidden_video_ref")}
            >
              <Plus className="h-4 w-4" />
              Hidden Video Reference
            </Button>
            <div className="ml-auto flex gap-2">
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
                {saving ? "Saving…" : "Save Assets"}
              </Button>
            </div>
          </div>
          {error && (
            <p className="text-sm font-medium text-fti-red">{error}</p>
          )}
        </div>
      ) : activeLinks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center">
          <Video className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-600">
            No product assets yet
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Add a Source Page link or Hidden Video Reference from page source.
          </p>
          {canEdit && (
            <Button
              type="button"
              size="sm"
              className="mt-4"
              onClick={startEdit}
            >
              <Plus className="h-4 w-4" />
              Add Asset
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {activeLinks.map((link) => (
            <AssetDisplayCard key={link.id} link={link} />
          ))}
        </div>
      )}
    </Card>
  );
}
