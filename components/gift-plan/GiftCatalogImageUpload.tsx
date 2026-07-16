"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
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
      onChange({ previewUrl: null, file: null, removeRequested: true });
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
    });
  }

  function handleFiles(files: FileList | null) {
    applyFile(files?.[0] ?? null);
  }

  function handleRemove() {
    if (!window.confirm(t.removeImageConfirm)) return;
    applyFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const showPreview = value.previewUrl && !value.removeRequested;

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
              "cursor-pointer rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors",
              dragOver
                ? "border-primary bg-light-purple/50"
                : "border-gray-200 bg-gray-50/50 hover:border-primary/40",
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
            <p className="text-sm font-medium text-gray-900">
              {uploading ? t.uploadingImage : t.imageDropHint}
            </p>
            <p className="mt-1 text-xs text-gray-500">{t.imageFormatHint}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={uploading}
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
              >
                <Upload className="h-4 w-4" />
                {showPreview ? t.replaceImage : t.chooseImage}
              </Button>
              {showPreview ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={uploading}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  {t.removeImage}
                </Button>
              ) : null}
            </div>
          </div>
          {error ? (
            <p className="text-xs font-medium text-fti-red">{error}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function createEmptyGiftCatalogImageValue(): GiftCatalogImageValue {
  return { previewUrl: null, file: null, removeRequested: false };
}

export function createGiftCatalogImageValueFromRow(
  imageUrl: string | null,
): GiftCatalogImageValue {
  return {
    previewUrl: imageUrl,
    file: null,
    removeRequested: false,
  };
}
