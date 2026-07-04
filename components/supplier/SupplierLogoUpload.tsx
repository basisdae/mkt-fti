"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  SUPPLIER_LOGO_ACCEPT,
  validateSupplierLogoFile,
} from "@/lib/supplier-logo-storage";
import { cn } from "@/lib/utils";

interface SupplierLogoUploadProps {
  previewUrl: string | null;
  onFileChange: (file: File | null) => void;
  onRemoveExisting: () => void;
  className?: string;
}

export function SupplierLogoUpload({
  previewUrl,
  onFileChange,
  onRemoveExisting,
  className,
}: SupplierLogoUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const displayUrl = localPreview ?? previewUrl;

  function handleSelect(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    const validationError = validateSupplierLogoFile(file);
    if (validationError) {
      setError(validationError);
      onFileChange(null);
      return;
    }

    setError(null);
    if (localPreview) URL.revokeObjectURL(localPreview);
    const url = URL.createObjectURL(file);
    setLocalPreview(url);
    onFileChange(file);
  }

  function handleClear() {
    setError(null);
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    onFileChange(null);
    onRemoveExisting();
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50">
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayUrl}
              alt="Supplier logo preview"
              className="h-12 w-12 object-contain"
            />
          ) : (
            <ImagePlus className="h-5 w-5 text-gray-300" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-gray-700">Supplier Logo</p>
          <p className="text-xs text-gray-400">
            Optional company logo · PNG, JPG, SVG, WebP · max 5 MB
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept={SUPPLIER_LOGO_ACCEPT}
              className="sr-only"
              onChange={(e) => {
                handleSelect(e.target.files);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
            >
              {displayUrl ? "Replace logo" : "Upload logo"}
            </Button>
            {displayUrl && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-fti-red hover:bg-red-50"
                onClick={handleClear}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
      {error && <p className="text-xs font-medium text-fti-red">{error}</p>}
    </div>
  );
}
