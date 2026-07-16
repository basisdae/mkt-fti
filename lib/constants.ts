import {
  Clock3,
  Factory,
  FlaskConical,
  LayoutDashboard,
  Lightbulb,
  Package,
  GitBranch,
  Sparkles,
  StickyNote,
  Calculator,
  Settings,
  Gift,
  type LucideIcon,
} from "lucide-react";
import type { PipelineStage, PipelineStageTone, ProductStatus } from "@/types/product";

export const APP_TITLE = "MKT Headquarter";
export const APP_SHORT = "MKT Headquarter";
/** @deprecated Use APP_TITLE */
export const APP_NAME = APP_SHORT;
export const APP_DESCRIPTION =
  "FTI Product Information Management Platform";
export const APP_TAGLINE = APP_DESCRIPTION;
export const APP_AUTHOR = "Function International PCL.";
export const APP_THEME_COLOR = "#7A1F2B";
export const APP_VERSION = "MKT Headquarter MVP v0.1";
export const APP_LAST_UPDATE = "July 2026";
export const APP_RELEASE_NOTES = [
  "Product import wizard with draft status for incomplete rows",
  "Missing Data Center for draft products",
  "Product media assets and supplier gallery",
  "Workspace home, favorites, and keyboard shortcuts",
] as const;

export const DESIGN_TOKENS = {
  primary: "#695CFF",
  lightPurple: "#F3F1FF",
  success: "#22C55E",
  ftiRed: "#C8102E",
  background: "#F8F9FC",
  card: "#FFFFFF",
  borderRadius: "20px",
} as const;

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/products", icon: Package },
  { label: "R&D Specs", href: "/rnd/specs", icon: FlaskConical },
  { label: "Suppliers", href: "/suppliers", icon: Factory },
  { label: "Pipeline", href: "/pipeline", icon: GitBranch },
  { label: "Simulator", href: "/simulator", icon: Calculator },
  { label: "Gift Plans", href: "/gift-plans", icon: Gift },
  { label: "Timeline", href: "/timeline", icon: Clock3 },
  { label: "Notes", href: "/notes", icon: StickyNote },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { label: "Ideas", href: "/ideas", icon: Lightbulb },
  { label: "Brand Board", href: "/brand-board", icon: Sparkles },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const NAV_GROUPS = [
  { label: "เมนูหลัก", items: MAIN_NAV_ITEMS },
  { label: "เครื่องมือเสริม", items: SECONDARY_NAV_ITEMS },
] as const;

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  draft: "Draft",
  interested: "Interested",
  researching: "Researching",
  contact_factory: "Contact Factory",
  waiting_moq: "Waiting MOQ",
  quotation: "Quotation",
  sample_testing: "Sample Testing",
  certification: "Certification",
  purchase_approved: "Purchase Approved",
  ordered: "Ordered",
  shipping: "Shipping",
  received: "Received",
  ready_launch: "Ready Launch",
  launched: "Launched",
};

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  interested: "Interested",
  researching: "Researching",
  contact_factory: "Contact Factory",
  waiting_moq: "Waiting MOQ",
  quotation: "Quotation",
  sample_testing: "Sample Testing",
  certification: "Certification",
  purchase_approved: "Purchase Approved",
  ordered: "Ordered",
  shipping: "Shipping",
  received: "Received",
  ready_launch: "Ready Launch",
  launched: "Launched",
};

export const PIPELINE_STAGES: PipelineStage[] = [
  "interested",
  "researching",
  "contact_factory",
  "waiting_moq",
  "quotation",
  "sample_testing",
  "certification",
  "purchase_approved",
  "ordered",
  "shipping",
  "received",
  "ready_launch",
  "launched",
];

export const PIPELINE_STAGE_TONES: Record<PipelineStage, PipelineStageTone> = {
  interested: "pending",
  researching: "pending",
  contact_factory: "pending",
  waiting_moq: "pending",
  quotation: "pending",
  sample_testing: "working",
  certification: "working",
  purchase_approved: "working",
  ordered: "working",
  shipping: "success",
  received: "success",
  ready_launch: "success",
  launched: "success",
};

export const PIPELINE_TONE_STYLES: Record<
  PipelineStageTone,
  {
    columnAccent: string;
    columnBadge: string;
    stepBadgeBg: string;
    stepBadgeText: string;
    dot: string;
    label: string;
  }
> = {
  pending: {
    columnAccent: "bg-amber-400",
    columnBadge: "bg-amber-50 text-amber-700",
    stepBadgeBg: "bg-amber-400/15",
    stepBadgeText: "text-amber-800",
    dot: "bg-amber-400",
    label: "Pending",
  },
  working: {
    columnAccent: "bg-primary",
    columnBadge: "bg-light-purple text-primary",
    stepBadgeBg: "bg-primary/12",
    stepBadgeText: "text-primary",
    dot: "bg-primary",
    label: "Working",
  },
  success: {
    columnAccent: "bg-success",
    columnBadge: "bg-green-50 text-green-700",
    stepBadgeBg: "bg-success/15",
    stepBadgeText: "text-green-800",
    dot: "bg-success",
    label: "Success",
  },
  critical: {
    columnAccent: "bg-fti-red",
    columnBadge: "bg-red-50 text-fti-red",
    stepBadgeBg: "bg-fti-red/12",
    stepBadgeText: "text-fti-red",
    dot: "bg-fti-red",
    label: "Critical",
  },
};

export const PRODUCT_CATEGORY_LABELS: Record<string, string> = {
  appliances: "Home Appliances",
  electronics: "Electronics",
  lifestyle: "Lifestyle",
  health: "Health & Wellness",
  automotive: "Automotive",
  industrial: "Industrial",
};
