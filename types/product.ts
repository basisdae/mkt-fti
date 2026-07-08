export type ProductStatus =
  | "draft"
  | "interested"
  | "researching"
  | "contact_factory"
  | "waiting_moq"
  | "quotation"
  | "sample_testing"
  | "certification"
  | "purchase_approved"
  | "ordered"
  | "shipping"
  | "received"
  | "ready_launch"
  | "launched";

export type ProductMediaType =
  | "source_page"
  | "hidden_video_ref"
  | "product_video"
  | "youtube"
  | "vimeo"
  | "bilibili"
  | "alibaba_video"
  | "alibaba_link"
  | "google_drive"
  | "website"
  | "embed_other"
  | "manual_pdf"
  | "factory_source";

export interface ProductMediaLink {
  id: string;
  productId: string;
  title: string;
  mediaType: ProductMediaType;
  url: string;
  embedUrl: string;
  platform: string;
  videoId: string;
  videoFileName: string;
  coverImageUrl: string;
  duration: string;
  isActive: boolean;
  sortOrder: number;
  remark: string;
}

/** Product tag assignment with optional joined display fields. */
export interface ProductTagLink {
  id: string;
  productId: string;
  tagId: string;
  customLabel: string | null;
  label?: string;
  groupKey?: string;
  groupName?: string;
}

export type PipelineStage =
  | "interested"
  | "researching"
  | "contact_factory"
  | "waiting_moq"
  | "quotation"
  | "sample_testing"
  | "certification"
  | "purchase_approved"
  | "ordered"
  | "shipping"
  | "received"
  | "ready_launch"
  | "launched";

export type PipelineStageTone = "pending" | "working" | "success" | "critical";

export type OemType = "OEM" | "ODM" | "Custom";

export type FtiBrand =
  | "aquatek"
  | "variia"
  | "fastpure"
  | "uni_pure"
  | "treatton";

export interface ProductBrandStrategy {
  factory: string;
  internalProjectName: string;
  /** Null when brand decision is still open. */
  currentBrand: FtiBrand | null;
  candidateBrands: FtiBrand[];
  businessUnit: string;
  reason: string;
  decisionDate: string | null;
  owner: string;
  /** Reserved for future Brand Fit Score (0–100). */
  brandFitScore: number | null;
}

export type ProductImageType =
  | ""
  | "cover"
  | "front"
  | "back"
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "inside"
  | "packaging"
  | "filter"
  | "accessories"
  | "certificate"
  | "dimension_drawing"
  | "installation"
  | "lifestyle"
  | "marketing"
  | "manual"
  | "factory"
  | "other";

export const PRODUCT_IMAGE_TYPE_LABELS: Record<ProductImageType, string> = {
  "": "No type",
  cover: "Cover",
  front: "Front",
  back: "Back",
  left: "Left",
  right: "Right",
  top: "Top",
  bottom: "Bottom",
  inside: "Inside",
  packaging: "Packaging",
  filter: "Filter",
  accessories: "Accessories",
  certificate: "Certificate",
  dimension_drawing: "Dimension Drawing",
  installation: "Installation",
  lifestyle: "Lifestyle",
  marketing: "Marketing",
  manual: "Manual",
  factory: "Factory",
  other: "Other",
};

export type ProductImageUsageTag =
  | "website"
  | "catalog"
  | "marketplace"
  | "presentation"
  | "social_media"
  | "packaging"
  | "manual"
  | "internal"
  | "dealer";

export const PRODUCT_IMAGE_USAGE_LABELS: Record<ProductImageUsageTag, string> = {
  website: "Website",
  catalog: "Catalog",
  marketplace: "Marketplace",
  presentation: "Presentation",
  social_media: "Social Media",
  packaging: "Packaging",
  manual: "Manual",
  internal: "Internal",
  dealer: "Dealer",
};

export interface ProductGalleryImage {
  id: string;
  url: string;
  alt: string;
  sortOrder: number;
  isCover: boolean;
  /** Supabase Storage object path — used for delete on edit. */
  imagePath?: string | null;
  /** Image category type for asset management. */
  imageType?: ProductImageType;
  /** Usage channels this image is approved for. */
  usageTags?: ProductImageUsageTag[];
}

/** Product body size — separate from shipping carton (logistics-ready). */
export interface ProductDimension {
  /** Height in mm */
  height: string;
  /** Width in mm */
  width: string;
  /** Depth in mm */
  depth: string;
  /** Product weight in kg */
  weight: string;
}

/** Shipping carton / packing data — reusable by logistics modules. */
export interface PackagingInformation {
  /** Carton width in mm */
  cartonWidth: string;
  /** Carton depth in mm */
  cartonDepth: string;
  /** Carton height in mm */
  cartonHeight: string;
  /** Gross weight in kg */
  grossWeight: string;
  /** Net weight in kg */
  netWeight: string;
  unitsPerCarton: string;
  /** Cubic meters — auto from W×D×H/1e9 when dimensions filled */
  cbm: string;
}

/** Technical specification — separate from core product create/edit. */
export interface ProductSpecification {
  material: string;
  connector: string;
  voltage: string;
  power: string;
  flowRate: string;
  pressure: string;
  productDimension: ProductDimension;
  packaging: PackagingInformation;
  installation: string;
  warranty: string;
  remark: string;
}

export type ProductSpecStatus =
  | "not_started"
  | "draft"
  | "completed"
  | "need_review";

/** Core product record (no pricing summary or workflow status). */
export interface Product {
  id: string;
  name: string;
  code: string;
  brand: string;
  brandStrategy: ProductBrandStrategy;
  /** Link to supplier master record when factory is known. */
  supplierId: string | null;
  supplier: string;
  factoryLocation: string;
  category: string;
  description: string;
  opportunityScore: number;
  latestNote: string;
  updatedAt: string;
  businessType: string;
  oemType: OemType;
  factoryContact: string;
  productSystem: string;
  packagingNotes: string;
  marginTarget: number;
  annualVolumeTarget: number;
  imageUrl: string | null;
  imageAlt: string;
  /** Full gallery — list/card views use cover image only via imageUrl. */
  images: ProductGalleryImage[];
  customOptions: ProductCustomOptions;
  certification: ProductCertification;
  evaluationScorecard: ProductEvaluationScorecard;
  /** Technical specs for resume export — optional, empty fields show as "-". */
  specification?: ProductSpecification;
  /** Spec workflow status for MKT / R&D tracking. */
  specStatus?: ProductSpecStatus;
  /** External media / source links (product_media_links). */
  mediaLinks?: ProductMediaLink[];
  /** Tag assignments for classification export and filters. */
  tagLinks?: ProductTagLink[];
}

export type EvaluationScore = 1 | 2 | 3 | 4 | 5;

export type EvaluationCriterionId =
  | "market_potential"
  | "innovation_interest"
  | "product_quality"
  | "price_competitiveness"
  | "oem_opportunity"
  | "brand_fit"
  | "marketing_potential"
  | "supplier_reliability";

export interface EvaluationCriterionInput {
  score: EvaluationScore;
  note: string;
}

export interface ProductEvaluationScorecard {
  criteria: Record<EvaluationCriterionId, EvaluationCriterionInput>;
  evaluatedAt: string;
  evaluator: string;
  overallComment: string;
  nextAction: string;
}

export interface ProductPriceOption {
  id: string;
  productId: string;
  moq: number;
  label?: string;
  usdCost: number;
  exchangeRate: number;
  /** Gross margin on FTI selling price, e.g. 0.42 = 42% */
  wholesaleGp: number;
  /** Gross margin on dealer selling price, e.g. 0.14 = 14% */
  dealerGp: number;
  leadTime: string;
}

export interface ProductStatusEntry {
  productId: string;
  status: ProductStatus;
  pipelineStage: PipelineStage;
  updatedAt: string;
}

export interface ProductCustomOptions {
  oem: boolean;
  odm: boolean;
  privateLabel: boolean;
  packagingCustom: boolean;
  colorCustom: boolean;
  specCustom: boolean;
  exclusive: boolean;
  customLevel: string;
  customNotes: string;
}

export interface ProductCertification {
  iso1: string;
  iso2: string;
  iso3: string;
  /** User-selected ISO standards (array stored in certification jsonb). */
  iso: string[];
  certifications: string[];
  productSystems: string[];
}

export interface PipelineLog {
  id: string;
  productId: string;
  action: string;
  detail: string;
  updatedAt: string;
}

export type ProductTimelineStage =
  | "factory_contact"
  | "moq"
  | "quotation"
  | "sample"
  | "testing"
  | "certification"
  | "approval"
  | "production"
  | "shipping"
  | "warehouse"
  | "launch";

export interface ProductTimelineMovement {
  id: string;
  productId: string;
  stage: ProductTimelineStage;
  occurredAt: string;
  user: string;
  note: string;
}

export type ProductNoteType =
  | "rich"
  | "factory_comment"
  | "negotiation"
  | "meeting_summary";

export type ProductNoteFileType = "pdf" | "excel" | "image";

export interface ProductNoteAttachment {
  id: string;
  name: string;
  fileType: ProductNoteFileType;
  mimeType: string;
  sizeBytes: number;
  /** Mock path or blob URL for local preview. */
  url: string;
}

export interface ProductNote {
  id: string;
  productId: string;
  type: ProductNoteType;
  title: string;
  body: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  attachments: ProductNoteAttachment[];
}

/** Assembled product with pricing summary and workflow status for UI. */
export interface ProductView extends Product {
  status: ProductStatus;
  pipelineStage: PipelineStage;
  moq: number;
  costThb: number;
  ftiSellingPrice: number;
  gpPercent: number;
  dealerPrice: number;
  priceOptions: ProductPriceOption[];
  /** Alias of priceOptions for pricing helpers. */
  moqTiers: ProductPriceOption[];
}

export interface PipelineColumn {
  id: PipelineStage;
  title: string;
  items: PipelineItem[];
}

export interface PipelineItem {
  id: string;
  productId: string;
  productName: string;
  supplier: string;
  imageUrl: string | null;
  imageAlt: string;
  latestNote: string;
  activityNote: string;
  updatedAt: string;
  justUpdated?: boolean;
}

export interface DashboardMetric {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  product: string;
  detail: string;
  updatedAt: string;
}

export type ProductSortOption =
  | "latest_updated"
  | "highest_profit"
  | "lowest_moq"
  | "highest_selling_price"
  | "highest_evaluation_score"
  | "lowest_evaluation_score";

export type DashboardQuickFilter =
  | "quotation"
  | "sample_testing"
  | "certification"
  | "ready_launch";

export interface SimulatorInput {
  productId: string;
  targetRevenue: number;
  expectedQty: number;
}

export interface SimulatorResult {
  revenue: number;
  totalCost: number;
  grossProfit: number;
  grossProfitPercent: number;
  requiredQtyFor100M: number;
}
