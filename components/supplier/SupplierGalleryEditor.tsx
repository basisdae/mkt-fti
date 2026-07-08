"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Star,
  Trash2,
} from "lucide-react";
import type { SupplierGalleryDraftItem } from "@/lib/services/supplier-gallery";
import {
  SUPPLIER_GALLERY_ACCEPT,
  validateSupplierGalleryFile,
} from "@/lib/supplier-gallery-storage";
import { cn } from "@/lib/utils";
import type {
  SupplierGalleryCategory,
  SupplierGalleryImage,
} from "@/types/supplier";

const CATEGORY_OPTIONS: { value: SupplierGalleryCategory; label: string }[] = [
  { value: "factory_visit", label: "Factory Visit" },
  { value: "production_line", label: "Production Line" },
  { value: "warehouse", label: "Warehouse" },
  { value: "laboratory", label: "Laboratory" },
  { value: "showroom", label: "Showroom" },
  { value: "certificate", label: "Certificate" },
  { value: "office", label: "Office" },
  { value: "other", label: "Other" },
];

export function galleryImagesToDraft(
  images: SupplierGalleryImage[],
): SupplierGalleryDraftItem[] {
  return [...images]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((image) => ({
      id: image.id,
      previewUrl: image.imageUrl,
      imagePath: image.imagePath,
      category: image.category,
      altText: image.altText,
      isCover: image.isCover,
    }));
}

interface SupplierGalleryEditorProps {
  items: SupplierGalleryDraftItem[];
  onChange: (items: SupplierGalleryDraftItem[]) => void;
  className?: string;
}

export function SupplierGalleryEditor({
  items,
  onChange,
  className,
}: SupplierGalleryEditorProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = items.filter((item) => !item.removed);

  useEffect(() => {
    return () => {
      for (const item of items) {
        if (item.file && item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      }
    };
    // Only revoke on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const next = [...items];
    const messages: string[] = [];

    for (const file of Array.from(files)) {
      const validationError = validateSupplierGalleryFile(file);
      if (validationError) {
        messages.push(`${file.name}: ${validationError}`);
        continue;
      }
      next.push({
        id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        previewUrl: URL.createObjectURL(file),
        file,
        category: "factory_visit",
        altText: "",
        isCover: next.filter((item) => !item.removed).length === 0,
      });
    }

    setError(messages.length > 0 ? messages.join(" ") : null);
    onChange(next);
    if (inputRef.current) inputRef.current.value = "";
  }

  function updateItem(
    id: string,
    patch: Partial<SupplierGalleryDraftItem>,
  ) {
    onChange(
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function setCover(id: string) {
    onChange(
      items.map((item) => ({
        ...item,
        isCover: item.id === id,
      })),
    );
  }

  function removeItem(id: string) {
    onChange(
      items.flatMap((item) => {
        if (item.id !== id) return [item];
        if (item.file) {
          if (item.previewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(item.previewUrl);
          }
          return [];
        }
        return [{ ...item, removed: true }];
      }),
    );
  }

  function moveItem(id: string, direction: -1 | 1) {
    const visibleIds = visible.map((item) => item.id);
    const index = visibleIds.indexOf(id);
    const swapWith = index + direction;
    if (index < 0 || swapWith < 0 || swapWith >= visibleIds.length) return;

    const order = visibleIds.slice();
    const tmp = order[index]!;
    order[index] = order[swapWith]!;
    order[swapWith] = tmp;

    const byId = new Map(items.map((item) => [item.id, item]));
    const reorderedVisible = order.map((itemId) => byId.get(itemId)!);
    const removed = items.filter((item) => item.removed);
    onChange([...reorderedVisible, ...removed]);
  }

  return (
    <div className={cn("space-y-4", className)}>
      <label
        htmlFor={inputId}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center transition-colors hover:border-primary/30 hover:bg-light-purple/20"
      >
        <ImagePlus className="h-6 w-6 text-gray-300" />
        <p className="mt-2 text-sm font-medium text-gray-600">
          Upload factory photos
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Production line, warehouse, lab, showroom, certificates, office…
        </p>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={SUPPLIER_GALLERY_ACCEPT}
          multiple
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {error && (
        <p className="text-sm font-medium text-fti-red">{error}</p>
      )}

      {visible.length === 0 ? (
        <p className="text-center text-xs text-gray-400">
          No factory gallery images yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visible.map((item, index) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-xl border border-gray-100 bg-white"
            >
              <div className="relative aspect-[4/3] bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.previewUrl}
                  alt={item.altText || "Factory photo"}
                  className="h-full w-full object-cover"
                />
                {item.isCover && (
                  <span className="absolute left-2 top-2 rounded-full bg-[#7A1F2B] px-2 py-0.5 text-[10px] font-semibold text-white">
                    Cover
                  </span>
                )}
              </div>
              <div className="space-y-2 p-2">
                <select
                  value={item.category}
                  onChange={(e) =>
                    updateItem(item.id, {
                      category: e.target.value as SupplierGalleryCategory,
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-primary"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                      disabled={index === 0}
                      onClick={() => moveItem(item.id, -1)}
                      aria-label="Move earlier"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                      disabled={index === visible.length - 1}
                      onClick={() => moveItem(item.id, 1)}
                      aria-label="Move later"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      className={cn(
                        "rounded-md p-1 hover:bg-gray-100",
                        item.isCover ? "text-amber-500" : "text-gray-400",
                      )}
                      onClick={() => setCover(item.id)}
                      aria-label="Set as cover"
                      title="Cover for Company Profile"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-fti-red"
                      onClick={() => removeItem(item.id)}
                      aria-label="Delete image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {visible.length > 0 && (
        <p className="text-[11px] text-gray-400">
          First / starred image is used as cover in Company Profile export.
        </p>
      )}
    </div>
  );
}
