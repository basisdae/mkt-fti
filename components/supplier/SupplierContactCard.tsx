"use client";

import { useState } from "react";
import { Mail, Pencil, Phone, Star, User } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CopyWeChatButton } from "@/components/supplier/WeChatButton";
import { EditContactModal } from "@/components/supplier/EditContactModal";
import { cn } from "@/lib/utils";
import type { SupplierContact, SupplierContactInput } from "@/types/supplier";

interface SupplierContactCardProps {
  contact: SupplierContact;
  onEdit: (contactId: string, input: SupplierContactInput) => void;
  onSetPrimary: (contactId: string) => void;
  className?: string;
}

export function SupplierContactCard({
  contact,
  onEdit,
  onSetPrimary,
  className,
}: SupplierContactCardProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <Card
        padding="md"
        className={cn(
          contact.isPrimary && "border-primary/25 ring-1 ring-primary/15",
          !contact.isActive && "opacity-70",
          className,
        )}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-gray-300">
            {contact.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={contact.imageUrl}
                alt=""
                className="h-full w-full rounded-xl object-cover"
              />
            ) : (
              <User className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">
                {contact.contactName || "Unnamed contact"}
              </h3>
              {contact.isPrimary && (
                <Badge variant="default" className="gap-1 bg-primary text-white">
                  <Star className="h-3 w-3 fill-current" />
                  Primary
                </Badge>
              )}
              <Badge
                variant={contact.isActive ? "success" : "muted"}
                className={contact.isActive ? "" : "bg-gray-100 text-gray-500"}
              >
                {contact.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            {contact.position && (
              <p className="mt-0.5 text-xs text-gray-500">{contact.position}</p>
            )}
            {contact.salesRepCode && (
              <p className="mt-1 font-mono text-xs text-gray-400">
                Employee code: {contact.salesRepCode}
              </p>
            )}
          </div>
        </div>

        <dl className="mt-4 space-y-2 text-sm">
          {contact.wechatId && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-light-purple/30 px-3 py-2">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  WeChat ID
                </dt>
                <dd className="font-mono text-sm text-gray-800">
                  {contact.wechatId}
                </dd>
              </div>
              <CopyWeChatButton wechatId={contact.wechatId} />
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="h-4 w-4 shrink-0 text-gray-400" />
              <span>{contact.phone}</span>
            </div>
          )}
          {contact.email && (
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="h-4 w-4 shrink-0 text-gray-400" />
              <span>{contact.email}</span>
            </div>
          )}
        </dl>

        {contact.notes && (
          <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
            {contact.notes}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-1.5"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          {!contact.isPrimary && contact.isActive && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-primary"
              onClick={() => onSetPrimary(contact.id)}
            >
              <Star className="h-3.5 w-3.5" />
              Set as Primary
            </Button>
          )}
        </div>
      </Card>

      <EditContactModal
        open={editOpen}
        contact={contact}
        onClose={() => setEditOpen(false)}
        onSave={(input) => onEdit(contact.id, input)}
      />
    </>
  );
}
