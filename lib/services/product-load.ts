import { defaultBrandStrategy } from "@/lib/brand-strategy";
import { createEmptyEvaluationScorecard } from "@/lib/evaluation-scorecard";
import { normalizeProductCertification } from "@/lib/product-certification";
import { normalizeProductSpecification } from "@/lib/product-specification";
import { mergeProductViews } from "@/lib/repositories/product.repository";
import { listAllProductGalleryGrouped } from "@/lib/services/product-images";
import {
  listAllProductScorecards,
  listProducts,
} from "@/lib/services/products";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  PipelineStage,
  Product,
  ProductGalleryImage,
  ProductPriceOption,
  ProductSpecStatus,
  ProductStatus,
  ProductStatusEntry,
  ProductView,
} from "@/types/product";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function mapPriceRow(row: Record<string, unknown>): ProductPriceOption {
  return {
    id: String(row.id),
    productId: String(row.product_id),
    moq: Number(row.moq) || 0,
    label: typeof row.label === "string" ? row.label : undefined,
    usdCost: Number(row.usd_cost) || 0,
    exchangeRate: Number(row.exchange_rate) || 36,
    wholesaleGp: Number(row.wholesale_gp) || 0.42,
    dealerGp: Number(row.dealer_gp) || 0.14,
    leadTime: typeof row.lead_time === "string" ? row.lead_time : "",
  };
}

function mapProductRow(
  row: Record<string, unknown>,
  scorecard: Product["evaluationScorecard"],
  images: Product["images"],
): Product {
  const brandStrategyRaw = asRecord(row.brand_strategy);
  const customOptionsRaw = asRecord(row.custom_options);
  const supplierName = String(row.supplier ?? "");

  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    code: String(row.code ?? ""),
    brand: String(row.brand ?? ""),
    brandStrategy: defaultBrandStrategy({
      factory:
        typeof brandStrategyRaw.factory === "string"
          ? brandStrategyRaw.factory
          : supplierName,
      internalProjectName:
        typeof brandStrategyRaw.internalProjectName === "string"
          ? brandStrategyRaw.internalProjectName
          : String(row.name ?? ""),
      currentBrand:
        (brandStrategyRaw.currentBrand as Product["brandStrategy"]["currentBrand"]) ??
        null,
      candidateBrands: Array.isArray(brandStrategyRaw.candidateBrands)
        ? (brandStrategyRaw.candidateBrands as Product["brandStrategy"]["candidateBrands"])
        : [],
      businessUnit:
        typeof brandStrategyRaw.businessUnit === "string"
          ? brandStrategyRaw.businessUnit
          : "",
      reason:
        typeof brandStrategyRaw.reason === "string"
          ? brandStrategyRaw.reason
          : "",
      decisionDate:
        typeof brandStrategyRaw.decisionDate === "string"
          ? brandStrategyRaw.decisionDate
          : null,
      owner:
        typeof brandStrategyRaw.owner === "string"
          ? brandStrategyRaw.owner
          : "",
      brandFitScore:
        typeof brandStrategyRaw.brandFitScore === "number"
          ? brandStrategyRaw.brandFitScore
          : null,
    }),
    supplierId:
      typeof row.supplier_id === "string" && row.supplier_id
        ? row.supplier_id
        : null,
    supplier: supplierName,
    factoryLocation: String(row.factory_location ?? ""),
    category: String(row.category ?? ""),
    description: String(row.description ?? ""),
    opportunityScore: Number(row.opportunity_score) || 0,
    latestNote: String(row.latest_note ?? ""),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
    businessType: String(row.business_type ?? ""),
    oemType: (row.oem_type as Product["oemType"]) || "OEM",
    factoryContact: String(row.factory_contact ?? ""),
    productSystem: String(row.product_system ?? ""),
    packagingNotes: String(row.packaging_notes ?? ""),
    marginTarget: Number(row.margin_target) || 0,
    annualVolumeTarget: Number(row.annual_volume_target) || 0,
    imageUrl: typeof row.image_url === "string" ? row.image_url : null,
    imageAlt: String(row.image_alt ?? ""),
    images,
    customOptions: {
      oem: Boolean(customOptionsRaw.oem),
      odm: Boolean(customOptionsRaw.odm),
      privateLabel: Boolean(customOptionsRaw.privateLabel),
      packagingCustom: Boolean(customOptionsRaw.packagingCustom),
      colorCustom: Boolean(customOptionsRaw.colorCustom),
      specCustom: Boolean(customOptionsRaw.specCustom),
      exclusive: Boolean(customOptionsRaw.exclusive),
      customLevel: String(customOptionsRaw.customLevel ?? ""),
      customNotes: String(customOptionsRaw.customNotes ?? ""),
    },
    certification: normalizeProductCertification(
      row.certification as Product["certification"] | null | undefined,
    ),
    evaluationScorecard: scorecard,
    specification: normalizeProductSpecification(
      row.specification as Product["specification"] | null | undefined,
    ),
    specStatus: (row.spec_status as ProductSpecStatus) || "not_started",
  };
}

function defaultPriceOption(productId: string): ProductPriceOption {
  return {
    id: `${productId}-default-moq`,
    productId,
    moq: 0,
    usdCost: 0,
    exchangeRate: 36,
    wholesaleGp: 0.42,
    dealerGp: 0.14,
    leadTime: "",
  };
}

async function listAllMoqPrices(): Promise<ProductPriceOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_moq_prices")
    .select("*")
    .order("moq", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapPriceRow(row as Record<string, unknown>));
}

/** Load full product catalog from Supabase (single source of truth). */
export async function loadProductCatalogFromSupabase(): Promise<{
  productRecords: Product[];
  statuses: Record<string, ProductStatusEntry>;
  priceOptions: ProductPriceOption[];
}> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  const [rows, priceOptions, galleryGrouped, scorecardByProduct] =
    await Promise.all([
      listProducts(),
      listAllMoqPrices(),
      listAllProductGalleryGrouped().catch(() => new Map()),
      listAllProductScorecards().catch(
        () => new Map<string, Product["evaluationScorecard"]>(),
      ),
    ]);

  const productRecords: Product[] = [];
  const statuses: Record<string, ProductStatusEntry> = {};
  const activeRows = (rows as Record<string, unknown>[]).filter(
    (row) => row.is_archived !== true,
  );

  for (const row of activeRows) {
    const id = String(row.id);
    const images = galleryGrouped.get(id) ?? [];
    const product = mapProductRow(
      row,
      scorecardByProduct.get(id) ?? createEmptyEvaluationScorecard(),
      images,
    );
    if (images.length > 0) {
      const cover =
        images.find((image: ProductGalleryImage) => image.isCover) ?? images[0];
      if (cover) {
        product.imageUrl = cover.url;
        product.imageAlt = cover.alt || product.name;
      }
    }
    productRecords.push(product);

    const status = String(row.status ?? "interested") as ProductStatus;
    const pipelineStage = String(
      row.pipeline_stage ?? row.status ?? "interested",
    ) as PipelineStage;
    statuses[id] = {
      productId: id,
      status,
      pipelineStage,
      updatedAt: String(row.updated_at ?? product.updatedAt),
    };
  }

  const pricesByProduct = new Map<string, ProductPriceOption[]>();
  for (const option of priceOptions) {
    const list = pricesByProduct.get(option.productId) ?? [];
    list.push(option);
    pricesByProduct.set(option.productId, list);
  }

  const resolvedPrices: ProductPriceOption[] = [];
  for (const product of productRecords) {
    const options = pricesByProduct.get(product.id);
    if (options?.length) {
      resolvedPrices.push(...options);
    } else {
      resolvedPrices.push(defaultPriceOption(product.id));
    }
  }

  return { productRecords, statuses, priceOptions: resolvedPrices };
}

export async function updateProductPipelineInSupabase(
  productId: string,
  status: ProductStatus,
  pipelineStage: PipelineStage,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  const { error } = await supabase
    .from("products")
    .update({
      status,
      pipeline_stage: pipelineStage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);
  if (error) throw new Error(error.message);
}

export async function archiveProductInSupabase(
  productId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  const { error } = await supabase
    .from("products")
    .update({
      is_archived: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);
  if (error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("is_archived") ||
      message.includes("column") ||
      message.includes("does not exist")
    ) {
      return;
    }
    throw new Error(error.message);
  }
}

export async function restoreProductInSupabase(
  productId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  const { error } = await supabase
    .from("products")
    .update({
      is_archived: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);
  if (error) throw new Error(error.message);
}

/** Draft products for Missing Data Center (status = draft). */
export async function loadDraftProductViews(): Promise<ProductView[]> {
  const { productRecords, statuses, priceOptions } =
    await loadProductCatalogFromSupabase();

  return mergeProductViews(productRecords, statuses, priceOptions).filter(
    (product) => product.status === "draft",
  );
}
