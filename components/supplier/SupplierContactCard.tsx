"use client";

import { Mail, MessageCircle, Phone, User } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { WeChatButton } from "@/components/supplier/WeChatButton";
import { cn } from "@/lib/utils";
import type { SupplierContact } from "@/types/supplier";

interface SupplierContactCardProps {
  contact: SupplierContact;
  className?: string;
}

export function SupplierContactCard({
  contact,
  className,
}: SupplierContactCardProps) {
  return (
    <Card
      padding="md"
      className={cn(
        contact.isPrimary && "border-primary/20 ring-1 ring-primary/10",
        !contact.isActive && "opacity-60",
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
              {contact.contactName}
            </h3>
            {contact.isPrimary && (
              <Badge variant="default" className="bg-primary/10 text-primary">
                Primary
              </Badge>
            )}
            {!contact.isActive && (
              <Badge variant="muted">Inactive</Badge>
            )}
          </div>
          {contact.position && (
            <p className="mt-0.5 text-xs text-gray-500">{contact.position}</p>
          )}
          {contact.salesRepCode && (
            <p className="mt-1 font-mono text-xs text-gray-400">
              Code: {contact.salesRepCode}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-gray-600">
        {contact.phone && (
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-gray-400" />
            {contact.phone}
          </p>
        )}
        {contact.email && (
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0 text-gray-400" />
            {contact.email}
          </p>
        )}
        {contact.whatsapp && (
          <p className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 shrink-0 text-gray-400" />
            WhatsApp: {contact.whatsapp}
          </p>
        )}
        {contact.line && (
          <p className="text-xs text-gray-500">LINE: {contact.line}</p>
        )}
        {contact.wechatId && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="text-xs text-gray-500">
              WeChat: <span className="font-mono">{contact.wechatId}</span>
            </span>
            <WeChatButton wechatId={contact.wechatId} size="sm" />
          </div>
        )}
      </div>

      {contact.notes && (
        <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
          {contact.notes}
        </p>
      )}
    </Card>
  );
}
