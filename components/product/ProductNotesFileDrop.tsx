"use client";

import { useCallback, useId, useRef, useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  ImagePlus,
  Paperclip,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  ACCEPTED_NOTE_FILE_ACCEPT,
  createNoteAttachmentFromFile,
  formatNoteFileSize,
  revokeNoteAttachmentUrl,
  validateNoteFile,
} from "@/lib/product-notes";
import { cn } from "@/lib/utils";
import type { ProductNoteAttachment } from "@/types/product";

interface ProductNotesFileDropProps {
  attachments: ProductNoteAttachment[];
  onChange: (attachments: ProductNoteAttachment[]) => void;
  className?: string;
}

function FileTypeIcon({
  fileType,
  className,
}: {
  fileType: ProductNoteAttachment["fileType"];
  className?: string;
}) {
  if (fileType === "pdf") {
    return <FileText className={cn("h-4 w-4 text-fti-red", className)} />;
  }
  if (fileType === "excel") {
    return (
      <FileSpreadsheet className={cn("h-4 w-4 text-success", className)} />
    );
  }
  return <ImagePlus className={cn("h-4 w-4 text-primary", className)} />;
}

export function ProductNotesFileDrop({
  attachments,
  onChange,
  className,
}: ProductNotesFileDropProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      setError(null);

      const next = [...attachments];
      for (const file of Array.from(files)) {
        const validationError = validateNoteFile(file);
        if (validationError) {
          setError(validationError);
          continue;
        }
        next.push(createNoteAttachmentFromFile(file));
      }
      onChange(next);
    },
    [attachments, onChange],
  );

  function removeAttachment(id: string) {
    const target = attachments.find((a) => a.id === id);
    if (target) revokeNoteAttachmentUrl(target.url);
    onChange(attachments.filter((a) => a.id !== id));
  }

  return (
    <div className={cn("space-y-3", className)}>
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
          addFiles(e.dataTransfer.files);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "notes-file-drop cursor-pointer rounded-[20px] border-2 border-dashed px-5 py-6 text-center transition-all duration-300",
          dragOver
            ? "notes-file-drop--active border-primary bg-light-purple/60 shadow-[0_0_24px_rgb(105_92_255_0.15)]"
            : "border-gray-200 bg-gray-50/50 hover:border-primary/40 hover:bg-light-purple/30",
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept={ACCEPTED_NOTE_FILE_ACCEPT}
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-light-purple text-primary">
          <Upload className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-gray-900">
          Drop files or click to browse
        </p>
        <p className="mt-1 text-xs text-gray-500">
          PDF · Excel (.xls, .xlsx, .csv) · Images (PNG, JPG, WebP)
        </p>
        <p className="mt-1 text-xs text-gray-400">Max 10 MB per file · mock preview only</p>
      </div>

      {error && (
        <p className="text-xs font-medium text-fti-red">{error}</p>
      )}

      {attachments.length > 0 && (
        <ul className="space-y-2">
          {attachments.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm"
            >
              {file.fileType === "image" && file.url.startsWith("blob:") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.url}
                  alt=""
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
                  <FileTypeIcon fileType={file.fileType} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {file.name}
                </p>
                <p className="text-[11px] text-gray-400">
                  {formatNoteFileSize(file.sizeBytes)}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeAttachment(file.id);
                }}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-fti-red"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {attachments.length === 0 && (
        <p className="flex items-center gap-1.5 text-xs text-gray-400">
          <Paperclip className="h-3.5 w-3.5" />
          No files attached yet
        </p>
      )}
    </div>
  );
}
