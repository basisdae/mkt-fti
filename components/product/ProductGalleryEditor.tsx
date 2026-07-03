"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  GripVertical,
  ImagePlus,
  RefreshCw,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import { ImagePreviewModal } from "@/components/product/ImagePreviewModal";
import { ACCEPTED_PRODUCT_IMAGE_ACCEPT } from "@/lib/product-image";
import { generateId } from "@/lib/generate-id";
import {
  PRODUCT_IMAGE_TYPE_LABELS,
  PRODUCT_IMAGE_USAGE_LABELS,
  type ProductGalleryImage,
  type ProductImageType,
  type ProductImageUsageTag,
} from "@/types/product";
import {
  appendGalleryFiles,
  galleryItemStatusLabel,
  galleryItemStatusTone,
  normalizeGalleryItems,
  removeGalleryItem,
  setGalleryCover,
  sortGalleryImages,
  updateGalleryItemAlt,
  type ProductGalleryItem,
} from "@/lib/product-gallery";
import { cn } from "@/lib/utils";

const IMAGE_TYPE_OPTIONS = Object.entries(PRODUCT_IMAGE_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

interface ProductGalleryEditorProps {
  items: ProductGalleryItem[];
  onChange: (items: ProductGalleryItem[]) => void;
  productName?: string;
  persistHint?: "created" | "saved";
  onAppendImages?: (files: File[]) => Promise<void>;
  appending?: boolean;
  appendError?: string | null;
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AddImagesButton({
  inputRef,
  loading,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  loading?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={loading}
      aria-busy={loading}
      onClick={() => inputRef.current?.click()}
    >
      <Upload className="h-4 w-4" />
      {loading ? "Uploading…" : "Add Images"}
    </Button>
  );
}

export function ProductGalleryEditor({
  items,
  onChange,
  productName = "",
  persistHint = "created",
  onAppendImages,
  appending = false,
  appendError = null,
  className,
}: ProductGalleryEditorProps) {
  const inputId = useId();
  const replaceInputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const sortedItems = sortGalleryImages(items);
  const hasImages = sortedItems.length > 0;

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const files = e.clipboardData?.files;
      if (files && files.length > 0) {
        e.preventDefault();
        void handleFiles(files);
      }
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  });

  const handleFiles = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files || (files instanceof FileList && files.length === 0)) return;
      const fileArray = files instanceof FileList ? Array.from(files) : files;
      if (fileArray.length === 0) return;

      setFileErrors([]);

      if (onAppendImages) {
        try {
          await onAppendImages(fileArray);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Upload failed";
          setFileErrors([message]);
        }
        return;
      }

      const { items: next, errors } = appendGalleryFiles(
        items,
        fileArray,
        productName,
      );
      onChange(next);
      setFileErrors(errors);
    },
    [items, onAppendImages, onChange, productName],
  );

  function handleReplace(targetId: string) {
    setReplacingId(targetId);
    replaceInputRef.current?.click();
  }

  function handleReplaceFile(files: FileList | null) {
    if (!files || files.length === 0 || !replacingId) return;
    const file = files[0];

    const updated = items.map((item) => {
      if (item.id !== replacingId) return item;
      const url = URL.createObjectURL(file);
      return {
        ...item,
        url,
        file,
        saveStatus: "unsaved" as const,
      };
    });
    onChange(normalizeGalleryItems(updated));
    setReplacingId(null);
  }

  function handleTypeChange(imageId: string, type: ProductImageType) {
    const updated = items.map((item) =>
      item.id === imageId
        ? { ...item, imageType: type, saveStatus: "unsaved" as const }
        : item,
    );
    onChange(updated);
  }

  function handleUsageTagToggle(imageId: string, tag: ProductImageUsageTag) {
    const updated = items.map((item) => {
      if (item.id !== imageId) return item;
      const current = item.usageTags ?? [];
      const next = current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag];
      return { ...item, usageTags: next, saveStatus: "unsaved" as const };
    });
    onChange(updated);
  }

  function handleDragStart(id: string) {
    setDragItemId(id);
  }

  function handleDragOverItem(e: React.DragEvent, id: string) {
    e.preventDefault();
    if (dragItemId && dragItemId !== id) {
      setDragOverId(id);
    }
  }

  function handleDropOnItem(targetId: string) {
    if (!dragItemId || dragItemId === targetId) {
      setDragItemId(null);
      setDragOverId(null);
      return;
    }

    const dragIndex = items.findIndex((i) => i.id === dragItemId);
    const targetIndex = items.findIndex((i) => i.id === targetId);
    if (dragIndex === -1 || targetIndex === -1) return;

    const reordered = [...items];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    const renumbered = reordered.map((item, idx) => ({
      ...item,
      sortOrder: idx,
      saveStatus:
        item.sortOrder !== idx ? ("unsaved" as const) : item.saveStatus,
    }));

    onChange(renumbered);
    setDragItemId(null);
    setDragOverId(null);
  }

  return (
    <div className={cn("space-y-4", className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED_PRODUCT_IMAGE_ACCEPT}
        multiple
        className="sr-only"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={replaceInputRef}
        id={replaceInputId}
        type="file"
        accept={ACCEPTED_PRODUCT_IMAGE_ACCEPT}
        className="sr-only"
        onChange={(e) => {
          handleReplaceFile(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Drop zone — always visible */}
      <div
        role="button"
        tabIndex={0}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "cursor-pointer rounded-[20px] border-2 border-dashed px-5 text-center transition-colors",
          hasImages ? "py-3" : "py-5",
          dragOver
            ? "border-primary bg-light-purple/50"
            : "border-gray-200 bg-gray-50/50 hover:border-primary/40 hover:bg-light-purple/30",
        )}
      >
        {!hasImages && (
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-light-purple text-primary">
            <ImagePlus className="h-5 w-5" />
          </div>
        )}
        <p className="text-sm font-semibold text-gray-900">
          {hasImages
            ? "Drop more images here or click to browse"
            : "Drop images or click to browse"}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          PNG, JPG, WebP · max 10 MB · multiple files · Ctrl+V to paste
        </p>
      </div>

      {/* Errors */}
      {(fileErrors.length > 0 || appendError) && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-fti-red">
          {[...(appendError ? [appendError] : []), ...fileErrors].map(
            (error, i) => (
              <p key={`${i}-${error}`}>{error}</p>
            ),
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <AddImagesButton inputRef={inputRef} loading={appending} />
        <span className="text-xs text-gray-500">
          {sortedItems.length} image{sortedItems.length !== 1 ? "s" : ""}{" "}
          {hasImages && "· drag to reorder"}
        </span>
      </div>

      {/* Gallery grid — responsive 2/3/4 columns */}
      {hasImages ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {sortedItems.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              draggable
              onDragStart={() => handleDragStart(item.id)}
              onDragOver={(e) => handleDragOverItem(e, item.id)}
              onDragEnd={() => {
                setDragItemId(null);
                setDragOverId(null);
              }}
              onDrop={() => handleDropOnItem(item.id)}
              className={cn(
                "group relative flex flex-col rounded-2xl border bg-white p-2.5 shadow-sm transition-all",
                dragOverId === item.id
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-gray-100",
                dragItemId === item.id && "opacity-50",
              )}
            >
              {/* Drag handle */}
              <div className="absolute left-1.5 top-1.5 z-10 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>

              {/* Order badge */}
              <div className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900/60 text-[10px] font-bold text-white">
                {idx + 1}
              </div>

              {/* Image preview */}
              <button
                type="button"
                className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-50"
                onClick={() => setPreviewIndex(idx)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.alt || productName || "Gallery image"}
                  className="h-full w-full object-contain p-1"
                  loading="lazy"
                />
                {item.isCover && (
                  <Badge
                    variant="success"
                    className="absolute left-1.5 top-1.5 gap-0.5 shadow-sm"
                  >
                    <Star className="h-3 w-3 fill-current" />
                    Cover
                  </Badge>
                )}
                <Badge
                  variant={
                    galleryItemStatusTone(item) === "success"
                      ? "success"
                      : galleryItemStatusTone(item) === "danger"
                        ? "danger"
                        : galleryItemStatusTone(item) === "info"
                          ? "default"
                          : "muted"
                  }
                  className="absolute bottom-1.5 left-1.5 shadow-sm"
                >
                  {galleryItemStatusLabel(item)}
                </Badge>
              </button>

              {/* Metadata */}
              <div className="mt-2 space-y-1.5">
                <Input
                  label="Alt"
                  value={item.alt}
                  onChange={(e) =>
                    onChange(
                      updateGalleryItemAlt(items, item.id, e.target.value),
                    )
                  }
                  placeholder="Describe image"
                />
                <Select
                  label="Type"
                  options={IMAGE_TYPE_OPTIONS}
                  value={item.imageType ?? ""}
                  onChange={(e) =>
                    handleTypeChange(
                      item.id,
                      e.target.value as ProductImageType,
                    )
                  }
                />
                {/* Usage tags */}
                <div>
                  <p className="mb-1 text-[11px] font-medium text-gray-600">
                    Usage
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(
                      Object.entries(PRODUCT_IMAGE_USAGE_LABELS) as [
                        ProductImageUsageTag,
                        string,
                      ][]
                    ).map(([tag, label]) => {
                      const active = (item.usageTags ?? []).includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleUsageTagToggle(item.id, tag)}
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
                            active
                              ? "bg-primary text-white"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {item.file && (
                  <p className="text-[10px] text-gray-400">
                    {formatFileSize(item.file.size)}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-2 flex flex-wrap gap-1">
                {!item.isCover && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="text-[11px]"
                    onClick={() => onChange(setGalleryCover(items, item.id))}
                  >
                    <Star className="h-3 w-3" />
                    Cover
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-[11px]"
                  onClick={() => handleReplace(item.id)}
                >
                  <RefreshCw className="h-3 w-3" />
                  Replace
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-[11px] text-fti-red hover:bg-red-50"
                  onClick={() => onChange(removeGalleryItem(items, item.id))}
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[20px] border border-dashed border-gray-200 bg-white/60 px-6 py-10 text-center">
          <p className="text-sm text-gray-500">No gallery images yet</p>
        </div>
      )}

      {/* Bottom toolbar — always visible so user can always add more */}
      <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3">
        <AddImagesButton inputRef={inputRef} loading={appending} />
        <p className="text-xs text-gray-500">
          {onAppendImages
            ? "Additional images upload immediately."
            : `Upload happens when Product is ${persistHint}.`}
        </p>
      </div>

      {/* Preview modal */}
      {previewIndex !== null && (
        <ImagePreviewModal
          images={sortedItems}
          initialIndex={previewIndex}
          onClose={() => setPreviewIndex(null)}
        />
      )}
    </div>
  );
}

export function createEmptyGalleryItems(): ProductGalleryItem[] {
  return [];
}

export function createGalleryItemsFromProduct(
  images: ProductGalleryImage[] | undefined,
  imageUrl: string | null,
  imageAlt: string,
  productName: string,
): ProductGalleryItem[] {
  if (images && images.length > 0) {
    return normalizeGalleryItems(
      images.map((image) => ({
        ...image,
        file: null,
        saveStatus: "saved" as const,
      })),
    );
  }

  if (!imageUrl) return [];

  return [
    {
      id: generateId(),
      url: imageUrl,
      alt: imageAlt || productName,
      sortOrder: 0,
      isCover: true,
      file: null,
      saveStatus: "saved",
    },
  ];
}
