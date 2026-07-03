"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { Input } from "@/components/forms/Input";
import { Button } from "@/components/ui/Button";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import {
  ACCEPTED_PRODUCT_IMAGE_ACCEPT,
  createProductImagePreviewUrl,
  defaultProductImageAlt,
  revokeProductImagePreviewUrl,
  validateProductImageFile,
} from "@/lib/product-image";
import { isSupabaseStorageConnected } from "@/lib/storage";
import { cn } from "@/lib/utils";

export interface ProductImageValue {
  previewUrl: string | null;
  file: File | null;
  alt: string;
}

interface ProductImageUploadProps {
  value: ProductImageValue;
  onChange: (value: ProductImageValue) => void;
  productName?: string;
  className?: string;
}

export function ProductImageUpload({
  value,
  onChange,
  productName = "",
  className,
}: ProductImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const storageReady = isSupabaseStorageConnected();

  const revokeIfBlob = useCallback((url: string | null) => {
    revokeProductImagePreviewUrl(url);
  }, []);

  useEffect(() => {
    return () => revokeIfBlob(value.previewUrl);
  }, [revokeIfBlob, value.previewUrl]);

  function applyFile(file: File | null) {
    setError(null);

    if (!file) {
      revokeIfBlob(value.previewUrl);
      onChange({ previewUrl: null, file: null, alt: value.alt });
      return;
    }

    const validationError = validateProductImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    revokeIfBlob(value.previewUrl);
    const previewUrl = createProductImagePreviewUrl(file);
    const alt =
      value.alt.trim() ||
      (productName ? defaultProductImageAlt(productName) : "");

    onChange({ previewUrl, file, alt });
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0] ?? null;
    applyFile(file);
  }

  function handleRemove() {
    applyFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <ProductImageDisplay
          src={value.previewUrl}
          alt={value.alt || productName || "Product image preview"}
          size="xl"
          frameClassName="mx-auto sm:mx-0"
        />

        <div className="min-w-0 flex-1 space-y-3">
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
              "cursor-pointer rounded-[20px] border-2 border-dashed px-5 py-6 text-center transition-colors",
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
              className="sr-only"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-light-purple text-primary">
              <ImagePlus className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-gray-900">
              Drop image or click to browse
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Square 1:1 recommended · PNG with transparency preferred
            </p>
            <p className="mt-1 text-xs text-gray-400">
              PNG, JPG, WebP · max 5 MB
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
              >
                <Upload className="h-4 w-4" />
                Choose file
              </Button>
              {value.previewUrl && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>
          </div>

          {error && (
            <p className="text-xs font-medium text-fti-red">{error}</p>
          )}

          <div className="rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-xs text-gray-500">
            {storageReady ? (
              <span className="text-success">
                Supabase Storage connected — uploads will sync when saved.
              </span>
            ) : (
              <span>
                Preview only — Supabase Storage not connected. Image stays in
                local state until backend is wired.
              </span>
            )}
          </div>
        </div>
      </div>

      <Input
        label="Image alt text"
        placeholder={
          productName
            ? defaultProductImageAlt(productName)
            : "Describe the product for accessibility"
        }
        value={value.alt}
        onChange={(e) =>
          onChange({ ...value, alt: e.target.value })
        }
      />
    </div>
  );
}

export function createEmptyProductImageValue(
  alt = "",
): ProductImageValue {
  return { previewUrl: null, file: null, alt };
}

export function createProductImageValueFromProduct(
  imageUrl: string | null,
  imageAlt: string,
  productName: string,
): ProductImageValue {
  return {
    previewUrl: imageUrl,
    file: null,
    alt: imageAlt || defaultProductImageAlt(productName),
  };
}
