"use client";

import {
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  formatNoteFileSize,
  PRODUCT_NOTE_TYPE_LABELS,
  renderNoteBody,
} from "@/lib/product-notes";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import type { ProductNote } from "@/types/product";

interface ProductNoteCardProps {
  note: ProductNote;
  className?: string;
}

function AttachmentChip({
  attachment,
}: {
  attachment: ProductNote["attachments"][number];
}) {
  const isImage =
    attachment.fileType === "image" &&
    !attachment.url.startsWith("#");

  return (
    <a
      href={attachment.url}
      target={attachment.url.startsWith("#") ? undefined : "_blank"}
      rel="noopener noreferrer"
      onClick={(e) => {
        if (attachment.url.startsWith("#")) e.preventDefault();
      }}
      className="group flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2 transition-colors hover:border-primary/25 hover:bg-light-purple/40"
    >
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={attachment.url}
          alt=""
          className="h-8 w-8 rounded-lg object-cover"
        />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
          {attachment.fileType === "pdf" && (
            <FileText className="h-4 w-4 text-fti-red" />
          )}
          {attachment.fileType === "excel" && (
            <FileSpreadsheet className="h-4 w-4 text-success" />
          )}
          {attachment.fileType === "image" && (
            <ImageIcon className="h-4 w-4 text-primary" />
          )}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium text-gray-800 group-hover:text-primary">
          {attachment.name}
        </span>
        <span className="text-[10px] text-gray-400">
          {formatNoteFileSize(attachment.sizeBytes)}
        </span>
      </span>
    </a>
  );
}

function NoteBody({ body }: { body: string }) {
  const paragraphs = renderNoteBody(body);

  return (
    <div className="space-y-3 text-sm leading-relaxed text-gray-600">
      {paragraphs.map((paragraph, i) => (
        <p key={i}>
          {paragraph.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={j} className="font-semibold text-gray-800">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith("• ")) {
              return (
                <span key={j} className="block pl-1">
                  {part}
                </span>
              );
            }
            return part;
          })}
        </p>
      ))}
    </div>
  );
}

const TYPE_BADGE: Record<
  ProductNote["type"],
  "default" | "success" | "warning" | "muted"
> = {
  rich: "default",
  factory_comment: "warning",
  negotiation: "success",
  meeting_summary: "muted",
};

export function ProductNoteCard({ note, className }: ProductNoteCardProps) {
  return (
    <article
      className={cn(
        "note-card rounded-[20px] border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-[var(--shadow-card-hover)]",
        className,
      )}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant={TYPE_BADGE[note.type]}>
              {PRODUCT_NOTE_TYPE_LABELS[note.type]}
            </Badge>
          </div>
          <h3 className="text-base font-semibold text-gray-900">{note.title}</h3>
        </div>
        <time
          dateTime={note.updatedAt}
          className="shrink-0 text-xs text-gray-400"
          title={formatDate(note.updatedAt)}
        >
          {timeAgo(note.updatedAt)}
        </time>
      </div>

      <NoteBody body={note.body} />

      <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-500">
        <User className="h-3.5 w-3.5 text-gray-400" />
        {note.author}
      </div>

      {note.attachments.length > 0 && (
        <div className="mt-4 border-t border-gray-50 pt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Files ({note.attachments.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {note.attachments.map((attachment) => (
              <AttachmentChip key={attachment.id} attachment={attachment} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
