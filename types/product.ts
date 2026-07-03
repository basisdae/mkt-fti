export type ProductStatus =
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

export interface ProductGalleryImage {
  id: string;
  url: string;
  alt: string;
  sortOrder: number;
  isCover: boolean;
}

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
