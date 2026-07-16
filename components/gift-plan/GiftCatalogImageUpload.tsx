"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GiftCatalogPlaceholderImage } from "@/components/gift-plan/GiftCatalogPlaceholderImage";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import {
  GIFT_CATALOG_IMAGE_ACCEPT,
  validateGiftCatalogImageFile,
} from "@/lib/gift-catalog-storage";
import { cn } from "@/lib/utils";

export interface GiftCatalogImageValue {
  previewUrl: string | null;
  file: File | null;
  removeRequested: boolean;
  /** True when preview is from an existing saved image. */
  hasPersistedImage?: boolean;
}

interface GiftCatalogImageUploadProps {
  value: GiftCatalogImageValue;
  onChange: (value: GiftCatalogImageValue) => void;
  uploading?: boolean;
  className?: string;
}

export function GiftCatalogImageUpload({
  value,
  onChange,
  uploading = false,
  className,
}: GiftCatalogImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revokeIfBlob = useCallback((url: string | null) => {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    return () => revokeIfBlob(value.previewUrl);
  }, [revokeIfBlob, value.previewUrl]);

  function applyFile(file: File | null) {
    setError(null);
    if (!file) {
      revokeIfBlob(value.previewUrl);
      onChange({
        previewUrl: null,
        file: null,
        removeRequested: true,
        hasPersistedImage: false,
      });
      return;
    }

    const validationError = validateGiftCatalogImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    revokeIfBlob(value.previewUrl);
    onChange({
      previewUrl: URL.createObjectURL(file),
      file,
      removeRequested: false,
      hasPersistedImage: false,
    });
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    if (files.length > 1) {
      setError(t.imageSingleFileOnly);
      return;
    }
    applyFile(files[0] ?? null);
  }

  function handleRemove() {
    const needsConfirm = value.hasPersistedImage && !value.file;
    if (needsConfirm && !window.confirm(t.removeImageConfirm)) return;
    applyFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleCancelPending() {
    revokeIfBlob(value.previewUrl);
    onChange({
      previewUrl: value.hasPersistedImage ? value.previewUrl : null,
      file: null,
      removeRequested: false,
      hasPersistedImage: value.hasPersistedImage,
    });
    if (inputRef.current) inputRef.current.value = "";
    setError(null);
  }

  const showPreview = value.previewUrl && !value.removeRequested;
  const hasPendingFile = Boolean(value.file);

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm font-medium text-gray-700">{t.image}</p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {showPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value.previewUrl!}
            alt=""
            className="aspect-[4/3] w-full max-w-[200px] rounded-xl border border-gray-100 object-contain bg-gray-50"
          />
        ) : (
          <GiftCatalogPlaceholderImage className="max-w-[200px]" />
        )}

        <div className="min-w-0 flex-1 space-y-3">
          <div
            role="button"
            tabIndex={0}
            aria-label={t.imageUploadAreaLabel}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
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
            className={cn(
              "rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors",
              dragOver
                ? "border-primary bg-light-purple/50"
                : "border-gray-200 bg-gray-50/50",
              uploading && "pointer-events-none opacity-60",
            )}
          >
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept={GIFT_CATALOG_IMAGE_ACCEPT}
              className="sr-only"
              disabled={uploading}
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-light-purple text-primary">
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ImagePlus className="h-5 w-5" />
              )}
            </div>
            {uploading ? (
              <p className="text-sm font-medium text-gray-900">
                {t.uploadingImage}
              </p>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-900">
                  {t.imageDropHere}
                </p>
                <p className="mt-1 text-xs text-gray-500">{t.imageOr}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="mt-3"
                  disabled={uploading}
                  onClick={(e) => {
                    e.stopPropagation();
                    inputRef.current?.click();
                  }}
                >
                  {t.chooseImage}
                </Button>
              </>
            )}
            <p className="mt-2 text-xs text-gray-400">{t.imageFormatHint}</p>
          </div>

          {showPreview ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                {t.replaceImage}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={uploading}
                onClick={handleRemove}
              >
                <Trash2 className="h-4 w-4" />
                {t.removeImage}
              </Button>
              {hasPendingFile ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={uploading}
                  onClick={handleCancelPending}
                >
                  {t.cancelImageSelection}
                </Button>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p className="text-xs font-medium text-fti-red">{error}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function createEmptyGiftCatalogImageValue(): GiftCatalogImageValue {
  return {
    previewUrl: null,
    file: null,
    removeRequested: false,
    hasPersistedImage: false,
  };
}

export function createGiftCatalogImageValueFromRow(
  imageUrl: string | null,
): GiftCatalogImageValue {
  return {
    previewUrl: imageUrl,
    file: null,
    removeRequested: false,
    hasPersistedImage: Boolean(imageUrl),
  };
}
