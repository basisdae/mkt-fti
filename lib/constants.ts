import {
  Clock3,
  Factory,
  LayoutDashboard,
  Lightbulb,
  Package,
  GitBranch,
  Sparkles,
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
  { label: "Brand Board", href: "/brand-board", icon: Sparkles },
  { label: "Ideas", href: "/ideas", icon: Lightbulb },
  { label: "Suppliers", href: "/suppliers", icon: Factory },
  { label: "Pipeline", href: "/pipeline", icon: GitBranch },
  { label: "Timeline", href: "/timeline", icon: Clock3 },
  { label: "Notes", href: "/notes", icon: StickyNote },
  { label: "Simulator", href: "/simulator", icon: Calculator },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
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
    dot: string;
    label: string;
  }
> = {
  pending: {
    columnAccent: "bg-amber-400",
    columnBadge: "bg-amber-50 text-amber-700",
    dot: "bg-amber-400",
    label: "Pending",
  },
  working: {
    columnAccent: "bg-primary",
    columnBadge: "bg-light-purple text-primary",
    dot: "bg-primary",
    label: "Working",
  },
  success: {
    columnAccent: "bg-success",
    columnBadge: "bg-green-50 text-green-700",
    dot: "bg-success",
    label: "Success",
  },
  critical: {
    columnAccent: "bg-fti-red",
    columnBadge: "bg-red-50 text-fti-red",
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
