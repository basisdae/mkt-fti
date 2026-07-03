"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface WeChatButtonProps {
  wechatId: string;
  className?: string;
  size?: "sm" | "md";
}

export function WeChatButton({
  wechatId,
  className,
  size = "md",
}: WeChatButtonProps) {
  const [copied, setCopied] = useState(false);

  if (!wechatId.trim()) return null;

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
      {copied ? "Copied!" : "Add WeChat"}
    </Button>
  );
}
