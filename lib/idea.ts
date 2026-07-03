import { createProduct, priceOption } from "@/lib/product-builder";
import { defaultBrandStrategy } from "@/lib/brand-strategy";
import { createEmptyEvaluationScorecard } from "@/lib/evaluation-scorecard";
import { IDEA_SOURCE_PLATFORM_LABELS } from "@/lib/idea-constants";
import type { ProductIdea } from "@/types/idea";
import type {
  Product,
  ProductPriceOption,
  ProductStatusEntry,
} from "@/types/product";

export interface ConvertedProductBundle {
  product: Product;
  status: ProductStatusEntry;
  priceOptions: ProductPriceOption[];
}

function slugCode(name: string): string {
  const words = name
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 3);
  const prefix = words.map((w) => w.slice(0, 3).toUpperCase()).join("");
  const suffix = String(Date.now()).slice(-4);
  return `${prefix || "IDEA"}-${suffix}`;
}

function inferCategory(tags: string[]): string {
  if (tags.includes("appliances")) return "appliances";
  if (tags.includes("pet") || tags.includes("wellness")) return "health";
  if (tags.includes("smart home") || tags.includes("wifi")) return "electronics";
  if (tags.includes("travel") || tags.includes("garment care")) return "lifestyle";
  return "lifestyle";
}

function parseUsdCostFromRange(range: string): number {
  const numbers = range.match(/[\d,]+/g);
  if (!numbers || numbers.length === 0) return 25;
  const values = numbers.map((n) => parseInt(n.replace(/,/g, ""), 10));
  const avgThb = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.max(8, Math.round((avgThb / 36) * 10) / 10);
}

export function matchesIdeaSearch(idea: ProductIdea, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    idea.productName,
    idea.whyInteresting,
    idea.possibleBrand,
    idea.estimatedPriceRange,
    IDEA_SOURCE_PLATFORM_LABELS[idea.sourcePlatform],
    ...idea.tags,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function buildProductFromIdea(idea: ProductIdea): ConvertedProductBundle {
  const now = new Date().toISOString();
  const productId = `prod-${Date.now()}`;
  const code = slugCode(idea.productName);
  const usdCost = parseUsdCostFromRange(idea.estimatedPriceRange);
  const platform = IDEA_SOURCE_PLATFORM_LABELS[idea.sourcePlatform];

  const base = createProduct({
    id: productId,
    name: idea.productName,
    code,
    supplier: "",
    supplierId: null,
    brand: idea.possibleBrand !== "—" ? idea.possibleBrand : "FTI Lifestyle",
    category: inferCategory(idea.tags),
    description: idea.whyInteresting,
    opportunityScore: 75,
    latestNote: `Converted from idea inbox · Source: ${platform}`,
    updatedAt: now,
    businessType: "Online Sourcing Idea",
    oemType: "ODM",
    factoryContact: "",
    productSystem: idea.possibleBrand !== "—" ? idea.possibleBrand : "FTI Lifestyle",
    packagingNotes: `Source: ${idea.sourceLink}`,
    marginTarget: 40,
    annualVolumeTarget: 5000,
    imageUrl: idea.imageUrl,
    imageAlt: idea.productName,
    certifications: [],
    brandStrategy: {
      factory: "",
      internalProjectName: `Idea ${code}`,
      businessUnit: idea.possibleBrand !== "—" ? idea.possibleBrand : "Lifestyle",
      reason: idea.whyInteresting,
    },
  });

  const product: Product = {
    ...base,
    brandStrategy: defaultBrandStrategy({
      ...base.brandStrategy,
      factory: "",
      reason: `Converted from idea: ${idea.whyInteresting}`,
    }),
    evaluationScorecard: createEmptyEvaluationScorecard(),
  };

  const status: ProductStatusEntry = {
    productId,
    status: "interested",
    pipelineStage: "interested",
    updatedAt: now,
  };

  const priceOptions: ProductPriceOption[] = [
    priceOption(
      `moq-${productId}-a`,
      productId,
      500,
      usdCost,
      36,
      0.42,
      0.14,
      "500 MOQ",
    ),
  ];

  return { product, status, priceOptions };
}
