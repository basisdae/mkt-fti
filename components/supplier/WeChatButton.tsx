"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface WeChatButtonProps {
  wechatId: string;
  className?: string;
  size?: "sm" | "md";
  /** "add" for general use, "copy" for supplier contact management */
  mode?: "add" | "copy";
}

export function WeChatButton({
  wechatId,
  className,
  size = "md",
  mode = "add",
}: WeChatButtonProps) {
  const [copied, setCopied] = useState(false);

  if (!wechatId.trim()) return null;

  const label = mode === "copy" ? "Copy WeChat" : "Add WeChat";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(wechatId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size={size}
      onClick={handleCopy}
      className={cn("gap-2", className)}
    >
      <MessageCircle className="h-4 w-4" />
      {copied ? "Copied!" : label}
    </Button>
  );
}

/** Standalone copy-only control for compact contact rows. */
export function CopyWeChatButton({
  wechatId,
  className,
  size = "sm",
}: {
  wechatId: string;
  className?: string;
  size?: "sm" | "md";
}) {
  return <WeChatButton wechatId={wechatId} mode="copy" size={size} className={className} />;
}
