"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Star, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import { ACCEPTED_PRODUCT_IMAGE_ACCEPT } from "@/lib/product-image";
import { generateId } from "@/lib/generate-id";
import type { ProductGalleryImage } from "@/types/product";
import {
  appendGalleryFiles,
  galleryStatusLabel,
  galleryStatusTone,
  galleryStorageConnected,
  normalizeGalleryItems,
  removeGalleryItem,
  setGalleryCover,
  sortGalleryImages,
  updateGalleryItemAlt,
  type ProductGalleryItem,
} from "@/lib/product-gallery";
import { cn } from "@/lib/utils";

interface ProductGalleryEditorProps {
  items: ProductGalleryItem[];
  onChange: (items: ProductGalleryItem[]) => void;
  productName?: string;
  mode?: "create" | "edit";
  onSave?: () => void | Promise<void>;
  saving?: boolean;
  saveError?: string | null;
  className?: string;
}

const statusToneClasses = {
  neutral: "border-gray-100 bg-gray-50 text-gray-500",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  success: "border-green-200 bg-green-50 text-green-800",
  error: "border-red-200 bg-red-50 text-fti-red",
} as const;

export function ProductGalleryEditor({
  items,
  onChange,
  productName = "",
  mode = "create",
  onSave,
  saving = false,
  saveError = null,
  className,
}: ProductGalleryEditorProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileErrors, setFileErrors] = useState<string[]>([]);

  const sortedItems = sortGalleryImages(items);
  const storageReady = galleryStorageConnected();
  const statusTone = galleryStatusTone(items);
  const statusLabel = galleryStatusLabel(items);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const { items: next, errors } = appendGalleryFiles(
        items,
        Array.from(files),
        productName,
      );
      onChange(next);
      setFileErrors(errors);
    },
    [items, onChange, productName],
  );

  return (
    <div className={cn("space-y-4", className)}>
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
          handleFiles(e.dataTransfer.files);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "cursor-pointer rounded-[20px] border-2 border-dashed px-5 py-5 text-center transition-colors",
          dragOver
            ? "border-primary bg-light-purple/50"
            : "border-gray-200 bg-gray-50/50 hover:border-primary/40 hover:bg-light-purple/30",
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPTED_PRODUCT_IMAGE_ACCEPT}
          multiple
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-light-purple text-primary">
          <ImagePlus className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-gray-900">
          Drop images or click to browse
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Square 1:1 recommended · first image becomes cover
        </p>
        <p className="mt-1 text-xs text-gray-400">
          PNG, JPG, WebP · max 5 MB per file · multiple files supported
        </p>
      </div>

      {fileErrors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-fti-red">
          {fileErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      {saveError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-fti-red">
          {saveError}
        </div>
      )}

      <div
        className={cn(
          "rounded-xl border px-3 py-2.5 text-xs font-medium",
          statusToneClasses[statusTone],
        )}
      >
        <span className="font-semibold">Status: </span>
        {statusLabel}
        {!storageReady && items.length > 0 && (
          <span className="mt-1 block font-normal text-gray-600">
            Images are stored locally in your browser until Supabase Storage is
            connected. They persist after refresh on this device.
          </span>
        )}
        {storageReady && (
          <span className="mt-1 block font-normal text-gray-600">
            Supabase Storage is configured but upload is not wired yet — images
            save locally for now.
          </span>
        )}
      </div>

      {sortedItems.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sortedItems.map((item) => (
            <div
              key={item.id}
              className="rounded-[20px] border border-gray-100 bg-white p-3 shadow-sm"
            >
              <div className="relative mb-3 flex justify-center">
                <ProductImageDisplay
                  src={item.url}
                  alt={item.alt || productName || "Product gallery image"}
                  size="lg"
                  className="p-2"
                />
                {item.isCover && (
                  <Badge
                    variant="success"
                    className="absolute left-2 top-2 gap-1 shadow-sm"
                  >
                    <Star className="h-3 w-3 fill-current" />
                    Cover
                  </Badge>
                )}
                {item.saveStatus === "unsaved" && (
                  <Badge className="absolute right-2 top-2 bg-amber-100 text-amber-800">
                    Unsaved
                  </Badge>
                )}
                {item.saveStatus === "failed" && (
                  <Badge variant="danger" className="absolute right-2 top-2">
                    Failed
                  </Badge>
                )}
              </div>

              <Input
                label="Alt text"
                value={item.alt}
                onChange={(e) =>
                  onChange(updateGalleryItemAlt(items, item.id, e.target.value))
                }
                placeholder="Describe this image"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                {!item.isCover && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => onChange(setGalleryCover(items, item.id))}
                  >
                    <Star className="h-3.5 w-3.5" />
                    Set as cover
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-fti-red hover:bg-red-50 hover:text-fti-red"
                  onClick={() => onChange(removeGalleryItem(items, item.id))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          Add more images
        </Button>

        {mode === "edit" && onSave && (
          <Button
            type="button"
            size="sm"
            onClick={() => void onSave()}
            disabled={saving || !items.some((item) => item.saveStatus === "unsaved")}
          >
            {saving ? "Saving…" : "Save gallery"}
          </Button>
        )}
      </div>

      {mode === "create" && (
        <p className="text-xs text-gray-500">
          Gallery images are saved when you click{" "}
          <span className="font-medium text-gray-700">Create Product</span> below.
        </p>
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
