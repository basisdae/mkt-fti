import { formatProductBrand } from "@/lib/brand-strategy";
import { PRODUCT_CATEGORY_LABELS, PRODUCT_STATUS_LABELS } from "@/lib/constants";
import { getEvaluationTotalScore } from "@/lib/evaluation-scorecard";
import { formatLeadTimeDays } from "@/lib/lead-time";
import {
  getIsoCertifications,
  getRegulatoryCertifications,
} from "@/lib/product-certification";
import { getProfitSummary } from "@/lib/product-detail";
import { resumeField } from "@/lib/product-specification";
import type { ProductView } from "@/types/product";

export interface ProductResumeProfile {
  coverUrl: string | null;
  coverAlt: string;
  brand: string;
  productName: string;
  productCode: string;
  category: string;
  supplier: string;
  factory: string;
  country: string;
  moq: string;
  leadTime: string;
  score: string;
  status: string;
  iso: string;
  certificates: string;
  remark: string;
  productSystem: string;
}

function joinList(values: string[]): string {
  const cleaned = values.map((v) => v.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned.join(", ") : "-";
}

export function buildProductResumeProfile(
  product: ProductView,
): ProductResumeProfile {
  const location = product.factoryLocation?.trim() ?? "";
  const country = location.includes(",")
    ? location.split(",").pop()?.trim() ?? ""
    : location;
  const factory =
    product.brandStrategy?.factory?.trim() ||
    product.supplier?.trim() ||
    location.split(",")[0]?.trim() ||
    "";

  const hasPricing = product.priceOptions.length > 0;
  const recommended = hasPricing
    ? getProfitSummary(product.priceOptions).recommended
    : null;

  const score = getEvaluationTotalScore(product.evaluationScorecard);
  const categoryLabel =
    PRODUCT_CATEGORY_LABELS[product.category] ?? product.category;

  return {
    coverUrl: product.imageUrl,
    coverAlt: product.imageAlt || product.name,
    brand: resumeField(formatProductBrand(product.brand)),
    productName: resumeField(product.name),
    productCode: resumeField(product.code),
    category: resumeField(categoryLabel),
    supplier: resumeField(product.supplier),
    factory: resumeField(factory),
    country: resumeField(country),
    moq: recommended
      ? `${recommended.tier.moq.toLocaleString()} pcs`
      : "-",
    leadTime: recommended
      ? formatLeadTimeDays(recommended.tier.leadTime)
      : "-",
    score: `${score}/100`,
    status: resumeField(PRODUCT_STATUS_LABELS[product.status]),
    iso: joinList(getIsoCertifications(product.certification)),
    certificates: joinList(getRegulatoryCertifications(product.certification)),
    remark: resumeField(product.latestNote || product.description),
    productSystem: resumeField(product.productSystem),
  };
}
