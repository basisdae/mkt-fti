import type { LucideIcon } from "lucide-react";
import {
  Building2,
  FileText,
  Globe,
  HardDrive,
  Image,
  Link2,
  Play,
  Share2,
  ShoppingBag,
  Video,
} from "lucide-react";

export type AssetPlatformIconKey =
  | "link"
  | "video"
  | "play"
  | "globe"
  | "building"
  | "file"
  | "shopping"
  | "share"
  | "image"
  | "drive";

export type AssetPlatformColorToken =
  | "gray"
  | "primary"
  | "rose"
  | "blue"
  | "green"
  | "amber";

export interface AssetPlatform {
  id: string;
  name: string;
  iconKey: AssetPlatformIconKey;
  colorToken: AssetPlatformColorToken;
  isActive: boolean;
  sortOrder: number;
}

export const ASSET_PLATFORM_ICON_OPTIONS: {
  value: AssetPlatformIconKey;
  label: string;
}[] = [
  { value: "link", label: "Link" },
  { value: "video", label: "Video" },
  { value: "play", label: "Play" },
  { value: "globe", label: "Globe" },
  { value: "building", label: "Building" },
  { value: "file", label: "Document" },
  { value: "shopping", label: "Shopping" },
  { value: "share", label: "Share" },
  { value: "image", label: "Image" },
  { value: "drive", label: "Drive" },
];

export const ASSET_PLATFORM_COLOR_OPTIONS: {
  value: AssetPlatformColorToken;
  label: string;
  className: string;
}[] = [
  { value: "gray", label: "Gray", className: "text-gray-500" },
  { value: "primary", label: "Primary", className: "text-primary" },
  { value: "rose", label: "Rose", className: "text-[#9F1239]" },
  { value: "blue", label: "Blue", className: "text-blue-600" },
  { value: "green", label: "Green", className: "text-green-600" },
  { value: "amber", label: "Amber", className: "text-amber-600" },
];

const ICON_MAP: Record<AssetPlatformIconKey, LucideIcon> = {
  link: Link2,
  video: Video,
  play: Play,
  globe: Globe,
  building: Building2,
  file: FileText,
  shopping: ShoppingBag,
  share: Share2,
  image: Image,
  drive: HardDrive,
};

export const DEFAULT_ASSET_PLATFORMS: AssetPlatform[] = [
  { id: "alibaba", name: "Alibaba", iconKey: "shopping", colorToken: "amber", isActive: true, sortOrder: 0 },
  { id: "1688", name: "1688", iconKey: "shopping", colorToken: "amber", isActive: true, sortOrder: 1 },
  { id: "made_in_china", name: "Made-in-China", iconKey: "globe", colorToken: "rose", isActive: true, sortOrder: 2 },
  { id: "supplier_website", name: "Supplier Website", iconKey: "globe", colorToken: "blue", isActive: true, sortOrder: 3 },
  { id: "youtube", name: "YouTube", iconKey: "video", colorToken: "rose", isActive: true, sortOrder: 4 },
  { id: "tiktok", name: "TikTok", iconKey: "play", colorToken: "gray", isActive: true, sortOrder: 5 },
  { id: "facebook", name: "Facebook", iconKey: "share", colorToken: "blue", isActive: true, sortOrder: 6 },
  { id: "instagram", name: "Instagram", iconKey: "image", colorToken: "rose", isActive: true, sortOrder: 7 },
  { id: "google_drive", name: "Google Drive", iconKey: "drive", colorToken: "green", isActive: true, sortOrder: 8 },
  { id: "pdf_manual", name: "PDF / Manual", iconKey: "file", colorToken: "gray", isActive: true, sortOrder: 9 },
  { id: "other", name: "Other", iconKey: "link", colorToken: "gray", isActive: true, sortOrder: 10 },
];

export function isAssetPlatformIconKey(
  value: string,
): value is AssetPlatformIconKey {
  return value in ICON_MAP;
}

export function isAssetPlatformColorToken(
  value: string,
): value is AssetPlatformColorToken {
  return ASSET_PLATFORM_COLOR_OPTIONS.some((option) => option.value === value);
}

export function getAssetPlatformIcon(
  iconKey: string | null | undefined,
): LucideIcon {
  if (iconKey && isAssetPlatformIconKey(iconKey)) {
    return ICON_MAP[iconKey];
  }
  return Link2;
}

export function getAssetPlatformColorClass(
  colorToken: string | null | undefined,
): string {
  const match = ASSET_PLATFORM_COLOR_OPTIONS.find(
    (option) => option.value === colorToken,
  );
  return match?.className ?? "text-gray-500";
}

export function getOtherPlatform(): AssetPlatform {
  return (
    DEFAULT_ASSET_PLATFORMS.find((platform) => platform.id === "other") ?? {
      id: "other",
      name: "Other",
      iconKey: "link",
      colorToken: "gray",
      isActive: true,
      sortOrder: 999,
    }
  );
}

/** Platforms available for new selections (active only) + always Other. */
export function getSelectablePlatforms(
  platforms: AssetPlatform[],
): AssetPlatform[] {
  const active = platforms
    .filter((platform) => platform.isActive && platform.id !== "other")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const other =
    platforms.find((platform) => platform.id === "other") ?? getOtherPlatform();
  return [...active, { ...other, isActive: true }];
}

export function findAssetPlatform(
  platforms: AssetPlatform[],
  platformValue: string | null | undefined,
): AssetPlatform | null {
  if (!platformValue?.trim()) return null;
  const value = platformValue.trim();
  return (
    platforms.find(
      (platform) =>
        platform.id === value ||
        platform.name.toLowerCase() === value.toLowerCase(),
    ) ?? null
  );
}

export function slugifyPlatformId(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || `platform_${Date.now()}`;
}
