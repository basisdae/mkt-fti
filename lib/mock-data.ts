import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS } from "@/lib/constants";
import { assembleProductViews, getPriceOptionById as findPriceOption } from "@/lib/assemble-product";
import { calculatePricing, calculateSimulator } from "@/lib/pricing";
import { createProduct, priceOption } from "@/lib/product-builder";
import type {
  ActivityItem,
  DashboardMetric,
  PipelineColumn,
  PipelineLog,
  PipelineStage,
  Product,
  ProductPriceOption,
  ProductStatusEntry,
  ProductView,
  SimulatorInput,
  SimulatorResult,
} from "@/types/product";

// ---------------------------------------------------------------------------
// Source-of-truth mock collections
// ---------------------------------------------------------------------------

export const products: Product[] = [
  createProduct({
    id: "prod-001",
    name: "Smart Air Purifier Pro",
    code: "SAP-2401",
    supplier: "Guangzhou CleanTech Co.",
    category: "appliances",
    description: "HEPA H13 filter with IoT air quality monitoring.",
    opportunityScore: 92,
    latestNote: "Final packaging approved. Launch Q3.",
    updatedAt: "2026-07-02T09:30:00",
    businessType: "OEM Private Label",
    oemType: "OEM",
    factoryContact: "Ms. Lin Wei · lin@cleantech.cn",
    productSystem: "FTI Home Living",
    packagingNotes: "White-label box with FTI branding",
    marginTarget: 40,
    annualVolumeTarget: 12000,
    imageUrl: "/images/products/prod-001.svg",
    imageAlt: "Smart Air Purifier Pro transparent product cutout",
    certifications: ["TISI", "CE", "RoHS"],
  }),
  createProduct({
    id: "prod-002",
    name: "Portable Blender Max",
    code: "PBM-2402",
    supplier: "Shenzhen BlendWorks Ltd.",
    category: "appliances",
    description: "USB-C rechargeable 300ml personal blender.",
    opportunityScore: 88,
    latestNote: "Sample batch 2 sent for durability test.",
    updatedAt: "2026-07-01T14:15:00",
    businessType: "ODM Catalog",
    oemType: "ODM",
    factoryContact: "Mr. Chen Hao · sales@blendworks.com",
    productSystem: "FTI Kitchen",
    packagingNotes: "Color box + Thai manual",
    marginTarget: 45,
    annualVolumeTarget: 25000,
    imageUrl: "/images/products/prod-002.svg",
    imageAlt: "Portable Blender Max transparent product cutout",
    certifications: ["TISI", "CB"],
  }),
  createProduct({
    id: "prod-003",
    name: "UV Water Sterilizer",
    code: "UWS-2403",
    supplier: "Hangzhou PureFlow Inc.",
    category: "health",
    description: "Countertop UV-C water purification unit.",
    opportunityScore: 85,
    latestNote: "Awaiting revised quote for 300-unit MOQ.",
    updatedAt: "2026-06-30T11:00:00",
    businessType: "Custom Development",
    oemType: "Custom",
    factoryContact: "Dr. Wang Mei · wang@pureflow.cn",
    productSystem: "FTI Wellness",
    packagingNotes: "Premium gift box option",
    marginTarget: 42,
    annualVolumeTarget: 8000,
    imageUrl: "/images/products/prod-003.svg",
    imageAlt: "UV Water Sterilizer transparent product cutout",
    certifications: ["TISI", "FDA", "NSF"],
  }),
  createProduct({
    id: "prod-004",
    name: "Cordless Vacuum Lite",
    code: "CVL-2404",
    supplier: "Ningbo HomePro Mfg.",
    category: "appliances",
    description: "Lightweight stick vacuum, 40-min runtime.",
    opportunityScore: 81,
    latestNote: "TISI submission in progress.",
    updatedAt: "2026-06-29T16:45:00",
    businessType: "OEM Private Label",
    oemType: "OEM",
    factoryContact: "Mr. Zhang Li · zhang@homepro.cn",
    productSystem: "FTI Home Living",
    packagingNotes: "Compact retail packaging",
    marginTarget: 40,
    annualVolumeTarget: 15000,
    imageUrl: "/images/products/prod-004.svg",
    imageAlt: "Cordless Vacuum Lite transparent product cutout",
    certifications: ["TISI", "CE"],
  }),
  createProduct({
    id: "prod-005",
    name: "Smart Door Lock S3",
    code: "SDL-2405",
    supplier: "Shenzhen SecureHome Tech",
    category: "electronics",
    description: "Fingerprint + PIN smart lock with app control.",
    opportunityScore: 79,
    latestNote: "Negotiating MOQ down from 500 to 200.",
    updatedAt: "2026-06-28T10:20:00",
    businessType: "ODM Catalog",
    oemType: "ODM",
    factoryContact: "Ms. Liu Yan · liu@securehome.com",
    productSystem: "FTI Smart Home",
    packagingNotes: "Installer kit included",
    marginTarget: 45,
    annualVolumeTarget: 6000,
    imageUrl: "/images/products/prod-005.svg",
    imageAlt: "Smart Door Lock S3 transparent product cutout",
    certifications: ["TISI", "Bluetooth SIG"],
  }),
  createProduct({
    id: "prod-006",
    name: "Car Dash Cam 4K",
    code: "CDC-2406",
    supplier: "Dongguan VisionDrive Co.",
    category: "automotive",
    description: "4K front + 1080p rear dash cam bundle.",
    opportunityScore: 76,
    latestNote: "Production run 60% complete.",
    updatedAt: "2026-07-02T08:00:00",
    businessType: "OEM Private Label",
    oemType: "OEM",
    factoryContact: "Mr. Huang Jun · huang@visiondrive.cn",
    productSystem: "FTI Auto",
    packagingNotes: "SD card bundle option",
    marginTarget: 45,
    annualVolumeTarget: 30000,
    imageUrl: "/images/products/prod-006.svg",
    imageAlt: "Car Dash Cam 4K transparent product cutout",
    certifications: ["TISI", "CE", "FCC"],
  }),
  createProduct({
    id: "prod-007",
    name: "Massage Gun Elite",
    code: "MGE-2407",
    supplier: "Xiamen RecoverTech Ltd.",
    category: "health",
    description: "6-speed percussive therapy device.",
    opportunityScore: 74,
    latestNote: "Launched in FTI stores May 2026.",
    updatedAt: "2026-06-15T09:00:00",
    businessType: "ODM Catalog",
    oemType: "ODM",
    factoryContact: "Ms. Wu Fang · wu@recovertech.cn",
    productSystem: "FTI Wellness",
    packagingNotes: "Carry case included",
    marginTarget: 45,
    annualVolumeTarget: 18000,
    imageUrl: "/images/products/prod-007.svg",
    imageAlt: "Massage Gun Elite transparent product cutout",
    certifications: ["TISI", "CE"],
  }),
  createProduct({
    id: "prod-008",
    name: "Robot Mop Cleaner",
    code: "RMC-2408",
    supplier: "Suzhou RoboClean Inc.",
    category: "appliances",
    description: "LIDAR navigation wet/dry robot mop.",
    opportunityScore: 70,
    latestNote: "Initial factory contact — awaiting spec sheet.",
    updatedAt: "2026-06-25T13:30:00",
    businessType: "Custom Development",
    oemType: "Custom",
    factoryContact: "Mr. Sun Kai · sun@roboclean.cn",
    productSystem: "FTI Home Living",
    packagingNotes: "TBD",
    marginTarget: 42,
    annualVolumeTarget: 5000,
    imageUrl: "/images/products/prod-008.svg",
    imageAlt: "Robot Mop Cleaner transparent product cutout",
    certifications: ["TISI", "CE", "RoHS"],
  }),
  createProduct({
    id: "prod-009",
    name: "LED Desk Lamp Pro",
    code: "LDP-2409",
    supplier: "Zhongshan LightWorks Co.",
    category: "lifestyle",
    description: "Adjustable color temp, USB charging port.",
    opportunityScore: 68,
    latestNote: "Shipment ETA 12 Jul — 2,000 units.",
    updatedAt: "2026-07-01T07:45:00",
    businessType: "OEM Private Label",
    oemType: "OEM",
    factoryContact: "Ms. Ye Lin · ye@lightworks.cn",
    productSystem: "FTI Lifestyle",
    packagingNotes: "Minimalist white box",
    marginTarget: 50,
    annualVolumeTarget: 40000,
    imageUrl: "/images/products/prod-009.svg",
    imageAlt: "LED Desk Lamp Pro transparent product cutout",
    certifications: ["TISI", "CE"],
  }),
];

export const productPriceOptions: ProductPriceOption[] = [
  priceOption("moq-001-a", "prod-001", 500, 80, 36.125, 0.42, 0.14, undefined, "45 days"),
  priceOption("moq-001-b", "prod-001", 1000, 72, 36.125, 0.42, 0.14, "1K volume", "40 days"),
  priceOption("moq-001-c", "prod-001", 2000, 65, 36.125, 0.4, 0.14, "2K volume", "35 days"),
  priceOption("moq-002-a", "prod-002", 1000, 18.8, 36.17, 0.473, 0.12),
  priceOption("moq-002-b", "prod-002", 2000, 16.5, 36.17, 0.45, 0.12, "2K volume"),
  priceOption("moq-002-c", "prod-002", 5000, 14.2, 36.17, 0.42, 0.12, "5K volume"),
  priceOption("moq-003-a", "prod-003", 300, 116.5, 36.05, 0.439, 0.13),
  priceOption("moq-003-b", "prod-003", 600, 105, 36.05, 0.42, 0.13, "600 volume"),
  priceOption("moq-003-c", "prod-003", 1000, 98, 36.05, 0.4, 0.13, "1K volume"),
  priceOption("moq-004-a", "prod-004", 800, 51.3, 36.06, 0.438, 0.12),
  priceOption("moq-004-b", "prod-004", 1500, 46, 36.06, 0.42, 0.12, "1.5K volume"),
  priceOption("moq-005-a", "prod-005", 200, 88.8, 36.04, 0.466, 0.13),
  priceOption("moq-005-b", "prod-005", 500, 78, 36.04, 0.44, 0.13, "500 volume"),
  priceOption("moq-005-c", "prod-005", 1000, 70, 36.04, 0.42, 0.13, "1K volume"),
  priceOption("moq-006-a", "prod-006", 1500, 31, 36.13, 0.489, 0.11),
  priceOption("moq-006-b", "prod-006", 3000, 27.5, 36.13, 0.46, 0.11, "3K volume"),
  priceOption("moq-006-c", "prod-006", 5000, 24, 36.13, 0.22, 0.11, "5K promo"),
  priceOption("moq-007-a", "prod-007", 600, 27.1, 36.16, 0.481, 0.12),
  priceOption("moq-007-b", "prod-007", 1200, 24, 36.16, 0.45, 0.12, "1.2K volume"),
  priceOption("moq-008-a", "prod-008", 400, 155.3, 36.06, 0.439, 0.13),
  priceOption("moq-008-b", "prod-008", 800, 140, 36.06, 0.42, 0.13, "800 volume"),
  priceOption("moq-009-a", "prod-009", 2000, 11.65, 36.05, 0.528, 0.1),
  priceOption("moq-009-b", "prod-009", 5000, 10.2, 36.05, 0.35, 0.1, "5K volume"),
  priceOption("moq-009-c", "prod-009", 10000, 9, 36.05, 0.2, 0.1, "10K promo"),
];

export const productStatuses: ProductStatusEntry[] = [
  { productId: "prod-001", status: "ready_to_launch", pipelineStage: "ready_launch", updatedAt: "2026-07-02T09:30:00" },
  { productId: "prod-002", status: "in_testing", pipelineStage: "sample_testing", updatedAt: "2026-07-01T14:15:00" },
  { productId: "prod-003", status: "waiting_quotation", pipelineStage: "quotation", updatedAt: "2026-06-30T11:00:00" },
  { productId: "prod-004", status: "in_testing", pipelineStage: "certification", updatedAt: "2026-06-29T16:45:00" },
  { productId: "prod-005", status: "waiting_quotation", pipelineStage: "waiting_moq", updatedAt: "2026-06-28T10:20:00" },
  { productId: "prod-006", status: "active", pipelineStage: "ordered", updatedAt: "2026-07-02T08:00:00" },
  { productId: "prod-007", status: "launched", pipelineStage: "ready_launch", updatedAt: "2026-06-15T09:00:00" },
  { productId: "prod-008", status: "on_hold", pipelineStage: "contact_factory", updatedAt: "2026-06-25T13:30:00" },
  { productId: "prod-009", status: "active", pipelineStage: "shipping", updatedAt: "2026-07-01T07:45:00" },
];

export const pipelineLogs: PipelineLog[] = [
  { id: "log-1", productId: "prod-001", action: "Status updated", detail: "Moved to Ready Launch", updatedAt: "2026-07-02T09:30:00" },
  { id: "log-2", productId: "prod-003", action: "Quotation received", detail: "Factory sent revised pricing", updatedAt: "2026-07-01T11:00:00" },
  { id: "log-3", productId: "prod-002", action: "Sample approved", detail: "Batch 2 passed drop test", updatedAt: "2026-07-01T14:15:00" },
  { id: "log-4", productId: "prod-009", action: "Shipment dispatched", detail: "2,000 units en route to BKK", updatedAt: "2026-07-01T07:45:00" },
  { id: "log-5", productId: "prod-005", action: "MOQ negotiation", detail: "Requested MOQ reduction to 200", updatedAt: "2026-06-28T10:20:00" },
];

// ---------------------------------------------------------------------------
// Assembled views (derived from source collections)
// ---------------------------------------------------------------------------

const productViews = assembleProductViews(
  products,
  productStatuses,
  productPriceOptions,
);

const productViewById = new Map(productViews.map((p) => [p.id, p]));

// ---------------------------------------------------------------------------
// Query helpers — single import path for pages & features
// ---------------------------------------------------------------------------

export function getProducts(): ProductView[] {
  return productViews;
}

export function getProductById(id: string): ProductView | undefined {
  return productViewById.get(id);
}

export function getPriceOptionsForProduct(
  productId: string,
): ProductPriceOption[] {
  return productPriceOptions.filter((option) => option.productId === productId);
}

export function getMoqTierById(
  product: ProductView,
  tierId: string,
): ProductPriceOption | undefined {
  return findPriceOption(product, tierId);
}

export function getProductStatus(productId: string): ProductStatusEntry | undefined {
  return productStatuses.find((entry) => entry.productId === productId);
}

export function getRecentActivity(): ActivityItem[] {
  const nameById = new Map(products.map((p) => [p.id, p.name]));

  return pipelineLogs.map((log) => ({
    id: log.id,
    action: log.action,
    product: nameById.get(log.productId) ?? "Unknown product",
    detail: log.detail,
    updatedAt: log.updatedAt,
  }));
}

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: "Total Products",
    value: products.length,
    change: "+2 this month",
    trend: "up",
  },
  {
    label: "Waiting Quotation",
    value: productStatuses.filter((s) => s.status === "waiting_quotation").length,
    change: "2 pending factory reply",
    trend: "neutral",
  },
  {
    label: "In Testing",
    value: productStatuses.filter((s) => s.status === "in_testing").length,
    change: "Sample & cert review",
    trend: "neutral",
  },
  {
    label: "Ready to Launch",
    value: productStatuses.filter((s) => s.status === "ready_to_launch").length,
    change: "1 launch this quarter",
    trend: "up",
  },
];

export function getTopOpportunityProducts(limit = 5): ProductView[] {
  return [...productViews]
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, limit);
}

export function getPipelineOverview(): { stage: PipelineStage; count: number }[] {
  return PIPELINE_STAGES.map((stage) => ({
    stage,
    count: productStatuses.filter((s) => s.pipelineStage === stage).length,
  }));
}

export function getPipelineColumns(): PipelineColumn[] {
  return PIPELINE_STAGES.map((stage) => ({
    id: stage,
    title: PIPELINE_STAGE_LABELS[stage],
    items: productViews
      .filter((p) => p.pipelineStage === stage)
      .map((p) => ({
        id: p.id,
        productId: p.id,
        productName: p.name,
        supplier: p.supplier,
        imageUrl: p.imageUrl,
        imageAlt: p.imageAlt,
        latestNote: p.latestNote,
        activityNote: "",
        updatedAt: p.updatedAt,
      })),
  }));
}

export const simulatorDefaults: SimulatorInput = {
  productId: "prod-001",
  targetRevenue: 50_000_000,
  expectedQty: 10_000,
};

export function runSimulator(
  product: ProductView,
  input: SimulatorInput,
  optionId?: string,
): SimulatorResult {
  const option =
    findPriceOption(product, optionId ?? product.priceOptions[0].id) ??
    product.priceOptions[0];
  const pricing = calculatePricing(option);

  return calculateSimulator({
    pricing,
    expectedQty: input.expectedQty,
    targetRevenue: input.targetRevenue,
  });
}

export function getSimulatorResult(): SimulatorResult {
  const product = getProductById("prod-001")!;
  return runSimulator(product, simulatorDefaults);
}

/** @deprecated Use getProducts() */
export const mockProducts = productViews;

/** @deprecated Use getRecentActivity() */
export const recentActivity = getRecentActivity();
