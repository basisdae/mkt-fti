"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ProductGalleryImage } from "@/types/product";
import { cn } from "@/lib/utils";

interface ImagePreviewModalProps {
  images: ProductGalleryImage[];
  initialIndex: number;
  onClose: () => void;
}

export function ImagePreviewModal({
  images,
  initialIndex,
  onClose,
}: ImagePreviewModalProps) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState(false);

  const current = images[index];
  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) {
      setIndex((i) => i - 1);
      setZoom(1);
    }
  }, [hasPrev]);

  const goNext = useCallback(() => {
    if (hasNext) {
      setIndex((i) => i + 1);
      setZoom(1);
    }
  }, [hasNext]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goPrev, goNext]);

  async function handleCopyUrl() {
    if (!current?.url) return;
    try {
      await navigator.clipboard.writeText(current.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API not available
    }
  }

  function handleDownload() {
    if (!current?.url) return;
    const a = document.createElement("a");
    a.href = current.url;
    a.download = current.alt || "product-image";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex h-full w-full max-w-6xl flex-col items-center justify-center px-4 py-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={() => setZoom((z) => Math.min(z + 0.5, 4))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={() => setZoom((z) => Math.max(z - 0.5, 0.5))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={handleCopyUrl}
          >
            <Copy className="h-4 w-4" />
            {copied && <span className="ml-1 text-xs">Copied</span>}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {hasPrev && (
          <button
            className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/40"
            onClick={goPrev}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {hasNext && (
          <button
            className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/40"
            onClick={goNext}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        <div className="flex max-h-[80vh] w-full flex-1 items-center justify-center overflow-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.url}
            alt={current.alt || "Product image"}
            className="max-h-full max-w-full object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
            draggable={false}
          />
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm font-medium text-white">
            {current.alt || "Image"}{" "}
            <span className="text-white/60">
              ({index + 1} / {images.length})
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
