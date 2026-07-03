import type { IdeaSourcePlatform, IdeaStatus } from "@/types/idea";

export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
  interested: "Interested",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  converted: "Converted to Product",
};

export const IDEA_SOURCE_PLATFORM_LABELS: Record<IdeaSourcePlatform, string> = {
  alibaba: "Alibaba",
  "1688": "1688",
  shopee: "Shopee",
  tiktok: "TikTok Shop",
  amazon: "Amazon",
  made_in_china: "Made-in-China",
  other: "Other",
};

export const IDEA_STATUS_STYLES: Record<
  IdeaStatus,
  { badge: string; dot: string }
> = {
  interested: {
    badge: "bg-sky-50 text-sky-700",
    dot: "bg-sky-400",
  },
  shortlisted: {
    badge: "bg-light-purple text-primary",
    dot: "bg-primary",
  },
  rejected: {
    badge: "bg-red-50 text-fti-red",
    dot: "bg-fti-red",
  },
  converted: {
    badge: "bg-green-50 text-success",
    dot: "bg-success",
  },
};
