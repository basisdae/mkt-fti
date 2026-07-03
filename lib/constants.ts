import {
  Clock3,
  LayoutDashboard,
  Package,
  GitBranch,
  StickyNote,
  Calculator,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { PipelineStage, PipelineStageTone, ProductStatus } from "@/types/product";

export const APP_TITLE = "FTI Product Command Center";
export const APP_SHORT = "MKT-FTI";
/** @deprecated Use APP_TITLE */
export const APP_NAME = APP_SHORT;
export const APP_TAGLINE = APP_TITLE;
export const APP_VERSION = "MKT-FTI Product Line-up MVP v0.1";

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

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/products", icon: Package },
  { label: "Pipeline", href: "/pipeline", icon: GitBranch },
  { label: "Timeline", href: "/timeline", icon: Clock3 },
  { label: "Notes", href: "/notes", icon: StickyNote },
  { label: "Simulator", href: "/simulator", icon: Calculator },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  active: "Active",
  waiting_quotation: "Waiting Quotation",
  in_testing: "In Testing",
  ready_to_launch: "Ready to Launch",
  launched: "Launched",
  on_hold: "On Hold",
};

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
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
};

export const PIPELINE_STAGES: PipelineStage[] = [
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
];

export const PIPELINE_STAGE_TONES: Record<PipelineStage, PipelineStageTone> = {
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
};

export const PIPELINE_TONE_STYLES: Record<
  PipelineStageTone,
  {
    columnBorder: string;
    columnBadge: string;
    cardAccent: string;
    dot: string;
    label: string;
  }
> = {
  pending: {
    columnBorder: "border-t-amber-400",
    columnBadge: "bg-amber-50 text-amber-700",
    cardAccent: "border-l-amber-400",
    dot: "bg-amber-400",
    label: "Pending",
  },
  working: {
    columnBorder: "border-t-primary",
    columnBadge: "bg-light-purple text-primary",
    cardAccent: "border-l-primary",
    dot: "bg-primary",
    label: "Working",
  },
  success: {
    columnBorder: "border-t-success",
    columnBadge: "bg-green-50 text-green-700",
    cardAccent: "border-l-success",
    dot: "bg-success",
    label: "Success",
  },
  critical: {
    columnBorder: "border-t-fti-red",
    columnBadge: "bg-red-50 text-fti-red",
    cardAccent: "border-l-fti-red",
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
