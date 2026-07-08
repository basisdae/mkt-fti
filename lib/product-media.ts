import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ExternalLink,
  FileText,
  Link2,
  Video,
} from "lucide-react";
import type { ProductMediaLink, ProductMediaType } from "@/types/product";

export const PRODUCT_MEDIA_TYPE_LABELS: Record<ProductMediaType, string> = {
  source_page: "Source Page",
  hidden_video_ref: "Hidden Video Reference",
  product_video: "Product Video",
  youtube: "YouTube",
  vimeo: "Vimeo",
  bilibili: "Bilibili",
  alibaba_video: "Alibaba Video",
  alibaba_link: "Alibaba / 1688 / Made-in-China",
  google_drive: "Google Drive",
  website: "Website",
  embed_other: "Embed URL / Other",
  manual_pdf: "Catalog / Manual PDF Link",
  factory_source: "Factory Source Link",
};

/** Primary asset types for the current workflow. */
export const PRODUCT_MEDIA_TYPE_OPTIONS: {
  value: ProductMediaType;
  label: string;
}[] = [
  { value: "source_page", label: PRODUCT_MEDIA_TYPE_LABELS.source_page },
  {
    value: "hidden_video_ref",
    label: PRODUCT_MEDIA_TYPE_LABELS.hidden_video_ref,
  },
  { value: "product_video", label: PRODUCT_MEDIA_TYPE_LABELS.product_video },
  { value: "website", label: PRODUCT_MEDIA_TYPE_LABELS.website },
  { value: "manual_pdf", label: PRODUCT_MEDIA_TYPE_LABELS.manual_pdf },
  { value: "factory_source", label: PRODUCT_MEDIA_TYPE_LABELS.factory_source },
  { value: "alibaba_link", label: PRODUCT_MEDIA_TYPE_LABELS.alibaba_link },
  { value: "embed_other", label: PRODUCT_MEDIA_TYPE_LABELS.embed_other },
  { value: "youtube", label: PRODUCT_MEDIA_TYPE_LABELS.youtube },
  { value: "vimeo", label: PRODUCT_MEDIA_TYPE_LABELS.vimeo },
  { value: "bilibili", label: PRODUCT_MEDIA_TYPE_LABELS.bilibili },
  { value: "alibaba_video", label: PRODUCT_MEDIA_TYPE_LABELS.alibaba_video },
  { value: "google_drive", label: PRODUCT_MEDIA_TYPE_LABELS.google_drive },
];

export const PRODUCT_MEDIA_PLATFORM_OPTIONS = [
  { value: "Alibaba", label: "Alibaba" },
  { value: "1688", label: "1688" },
  { value: "Made-in-China", label: "Made-in-China" },
  { value: "Supplier Website", label: "Supplier Website" },
  { value: "Other", label: "Other" },
];

export function isProductMediaType(value: string): value is ProductMediaType {
  return value in PRODUCT_MEDIA_TYPE_LABELS;
}

export function createEmptyMediaLink(
  productId: string,
  sortOrder = 0,
  mediaType: ProductMediaType = "source_page",
): Omit<ProductMediaLink, "id"> {
  return {
    productId,
    title: "",
    mediaType,
    url: "",
    embedUrl: "",
    platform: "alibaba",
    videoId: "",
    videoFileName: "",
    coverImageUrl: "",
    duration: "",
    isActive: true,
    sortOrder,
    remark: "",
  };
}

export function isHiddenVideoRef(link: ProductMediaLink): boolean {
  return link.mediaType === "hidden_video_ref";
}

export function isSourcePage(link: ProductMediaLink): boolean {
  return (
    link.mediaType === "source_page" ||
    link.mediaType === "website" ||
    link.mediaType === "alibaba_link" ||
    link.mediaType === "factory_source"
  );
}

export function getActiveMediaLinks(
  links: ProductMediaLink[] | null | undefined,
): ProductMediaLink[] {
  return (links ?? [])
    .filter((link) => {
      if (!link.isActive) return false;
      if (isHiddenVideoRef(link)) {
        return Boolean(link.url.trim() || link.videoId.trim());
      }
      return Boolean(link.url.trim() || link.embedUrl.trim());
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getMediaLinkIcon(type: ProductMediaType): LucideIcon {
  switch (type) {
    case "hidden_video_ref":
    case "product_video":
    case "youtube":
    case "vimeo":
    case "bilibili":
    case "alibaba_video":
      return Video;
    case "manual_pdf":
      return FileText;
    case "factory_source":
      return Building2;
    case "source_page":
    case "website":
    case "alibaba_link":
    case "google_drive":
    case "embed_other":
    default:
      return Link2;
  }
}

/** Always opens the user-provided source page / link URL. */
export function getMediaOpenUrl(link: ProductMediaLink): string {
  return link.url.trim() || link.embedUrl.trim();
}

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Build a safe iframe src from the user-provided URL / embed URL only.
 * Never embeds source_page or hidden_video_ref (no direct playable URL).
 * Does not fetch or search the internet.
 */
export function resolveMediaEmbedSrc(link: ProductMediaLink): string | null {
  if (
    link.mediaType === "source_page" ||
    link.mediaType === "hidden_video_ref"
  ) {
    return null;
  }

  const embed = link.embedUrl.trim();
  if (embed) {
    if (embed.includes("<iframe")) {
      const match = embed.match(/src=["']([^"']+)["']/i);
      const src = match?.[1]?.trim() ?? "";
      return src && isHttpsUrl(src) ? src : null;
    }
    return isHttpsUrl(embed) ? embed : null;
  }

  const url = link.url.trim();
  if (!url || !isHttpsUrl(url)) return null;

  const ytWatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/i,
  );
  if (ytWatch?.[1]) {
    return `https://www.youtube.com/embed/${ytWatch[1]}`;
  }

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo?.[1]) {
    return `https://player.vimeo.com/video/${vimeo[1]}`;
  }

  const bili = url.match(/bilibili\.com\/video\/(BV[\w]+)/i);
  if (bili?.[1]) {
    return `https://player.bilibili.com/player.html?bvid=${bili[1]}&high_quality=1`;
  }

  const drive = url.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
  if (drive?.[1]) {
    return `https://drive.google.com/file/d/${drive[1]}/preview`;
  }

  return null;
}

export function canEmbedMedia(link: ProductMediaLink): boolean {
  return Boolean(resolveMediaEmbedSrc(link));
}

export function getPrimaryMediaForResume(
  links: ProductMediaLink[] | null | undefined,
): ProductMediaLink | null {
  const active = getActiveMediaLinks(links);
  const preferred = active.find(
    (link) =>
      link.mediaType === "hidden_video_ref" ||
      link.mediaType === "source_page" ||
      link.mediaType === "product_video" ||
      link.mediaType === "youtube" ||
      link.mediaType === "vimeo" ||
      link.mediaType === "bilibili" ||
      link.mediaType === "alibaba_video" ||
      link.mediaType === "embed_other",
  );
  return preferred ?? active[0] ?? null;
}

export { ExternalLink };
