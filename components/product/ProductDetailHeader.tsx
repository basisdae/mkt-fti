"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock3, MessageSquarePlus, X } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/forms/Textarea";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import { timeAgo } from "@/lib/utils";
import type { ProductView } from "@/types/product";

interface ProductDetailHeaderProps {
  product: ProductView;
  imagePreviewUrl?: string | null;
  imageAlt?: string;
}

interface LocalNote {
  id: string;
  text: string;
  createdAt: string;
}

export function ProductDetailHeader({
  product,
  imagePreviewUrl,
  imageAlt,
}: ProductDetailHeaderProps) {
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<LocalNote[]>([]);
  const [updatedLabel, setUpdatedLabel] = useState<string | null>(null);

  function handleAddNote() {
    if (!noteText.trim()) return;

    setNotes((prev) => [
      {
        id: `note-${Date.now()}`,
        text: noteText.trim(),
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setNoteText("");
    setShowNoteForm(false);
    setUpdatedLabel("Just now");
  }

  return (
    <div className="mb-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <ProductImageDisplay
            src={imagePreviewUrl ?? product.imageUrl}
            alt={imageAlt || product.imageAlt || product.name}
            size="lg"
            className="p-2"
          />

          <div className="flex-1">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={product.status} />
              <span className="text-xs text-gray-400">{product.code}</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-gray-900 lg:text-3xl">
              {product.name}
            </h1>
            <p className="mt-2 text-sm font-medium text-gray-600">
              {product.supplier}
            </p>
            <p className="mt-3 max-w-2xl text-sm text-gray-400">
              {product.description}
            </p>

            <p className="mt-3 text-xs text-gray-400">
              Updated {updatedLabel ?? timeAgo(product.updatedAt)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowNoteForm((v) => !v)}
          >
            <MessageSquarePlus className="h-4 w-4" />
            Add Note
          </Button>
          <Button href={`/timeline?product=${product.id}`} variant="secondary" size="sm">
            <Clock3 className="h-4 w-4" />
            Timeline
          </Button>
          <Button href="/products" variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      {showNoteForm && (
        <div className="mt-4 rounded-[20px] border border-primary/20 bg-light-purple/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Add a note</p>
            <button
              type="button"
              onClick={() => setShowNoteForm(false)}
              className="rounded-lg p-1 text-gray-400 hover:bg-white/60"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Textarea
            rows={3}
            placeholder="Sourcing update, factory feedback..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
          <div className="mt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowNoteForm(false)}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleAddNote}>
              Save Note
            </Button>
          </div>
        </div>
      )}

      {(notes.length > 0 || product.latestNote) && (
        <div className="mt-4 space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-xl border border-gray-100 bg-card px-4 py-3 shadow-sm"
            >
              <p className="text-sm text-gray-700">{note.text}</p>
              <p className="mt-1 text-[11px] text-gray-400">Just now</p>
            </div>
          ))}
          {product.latestNote && (
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
              <p className="text-xs font-medium text-gray-400">Latest note</p>
              <p className="mt-1 text-sm text-gray-700">{product.latestNote}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
