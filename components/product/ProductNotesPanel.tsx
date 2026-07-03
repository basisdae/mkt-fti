"use client";

import { useMemo, useState } from "react";
import { MessageSquarePlus, StickyNote } from "lucide-react";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";
import { ProductNoteCard } from "@/components/product/ProductNoteCard";
import { ProductNotesFileDrop } from "@/components/product/ProductNotesFileDrop";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useProductNotesStore } from "@/hooks/ProductNotesStore";
import {
  PRODUCT_NOTE_TYPE_LABELS,
  PRODUCT_NOTE_TYPE_OPTIONS,
  revokeNoteAttachmentUrl,
  type ProductNoteTypeFilter,
} from "@/lib/product-notes";
import { cn } from "@/lib/utils";
import type { ProductNoteAttachment, ProductNoteType } from "@/types/product";

const TYPE_FILTERS: { id: ProductNoteTypeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "rich", label: PRODUCT_NOTE_TYPE_LABELS.rich },
  { id: "factory_comment", label: PRODUCT_NOTE_TYPE_LABELS.factory_comment },
  { id: "negotiation", label: PRODUCT_NOTE_TYPE_LABELS.negotiation },
  { id: "meeting_summary", label: PRODUCT_NOTE_TYPE_LABELS.meeting_summary },
];

interface ProductNotesPanelProps {
  productId: string;
  className?: string;
}

export function ProductNotesPanel({ productId, className }: ProductNotesPanelProps) {
  const { getNotesForProduct, addNote } = useProductNotesStore();
  const [typeFilter, setTypeFilter] = useState<ProductNoteTypeFilter>("all");
  const [showComposer, setShowComposer] = useState(false);
  const [noteType, setNoteType] = useState<ProductNoteType>("rich");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pendingFiles, setPendingFiles] = useState<ProductNoteAttachment[]>([]);

  const notes = useMemo(
    () => getNotesForProduct(productId, typeFilter),
    [getNotesForProduct, productId, typeFilter],
  );

  function resetComposer() {
    pendingFiles.forEach((f) => revokeNoteAttachmentUrl(f.url));
    setTitle("");
    setBody("");
    setPendingFiles([]);
    setNoteType("rich");
    setShowComposer(false);
  }

  function handleSave() {
    if (!title.trim() || !body.trim()) return;

    addNote({
      productId,
      type: noteType,
      title,
      body,
      attachments: pendingFiles,
    });

    setPendingFiles([]);
    setTitle("");
    setBody("");
    setShowComposer(false);
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setTypeFilter(chip.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                typeFilter === chip.id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-light-purple hover:text-primary",
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => setShowComposer((v) => !v)}
        >
          <MessageSquarePlus className="h-4 w-4" />
          {showComposer ? "Cancel" : "New note"}
        </Button>
      </div>

      {showComposer && (
        <Card padding="lg" className="border-primary/15 bg-light-purple/20">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">
            Compose note
          </h3>
          <div className="space-y-4">
            <Select
              label="Note type"
              options={PRODUCT_NOTE_TYPE_OPTIONS}
              value={noteType}
              onChange={(e) => setNoteType(e.target.value as ProductNoteType)}
            />
            <Input
              label="Title"
              placeholder="Brief summary of this note"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              label="Content"
              rows={6}
              placeholder="Rich notes — use paragraphs, bullet lines (•), and **bold** for emphasis."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <ProductNotesFileDrop
              attachments={pendingFiles}
              onChange={setPendingFiles}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={resetComposer}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={!title.trim() || !body.trim()}
              >
                Save note
              </Button>
            </div>
          </div>
        </Card>
      )}

      {notes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description={
            typeFilter === "all"
              ? "Add factory comments, negotiation notes, meeting summaries, or rich notes for this product."
              : `No ${TYPE_FILTERS.find((f) => f.id === typeFilter)?.label?.toLowerCase()} notes yet.`
          }
          compact
          action={
            !showComposer ? (
              <Button type="button" size="sm" onClick={() => setShowComposer(true)}>
                <MessageSquarePlus className="h-4 w-4" />
                New note
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <ProductNoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}
