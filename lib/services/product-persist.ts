import type { ProductCreateBundle } from "@/lib/repositories/types";
import { createClient } from "@/lib/supabase/client";
import {
  createProduct,
  updateProduct,
  upsertProductMoqPrices,
} from "@/lib/services/products";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Product, ProductPriceOption } from "@/types/product";

export function isProductSupabaseEnabled(): boolean {
  return isSupabaseConfigured();
}

function productToDbRow(product: Product, status: string) {
  return {
    id: product.id,
    name: product.name,
    code: product.code,
    brand: product.brand,
    supplier_id: product.supplierId,
    supplier: product.supplier,
    factory_location: product.factoryLocation,
    category: product.category,
    description: product.description,
    opportunity_score: product.opportunityScore,
    latest_note: product.latestNote,
    business_type: product.businessType,
    oem_type: product.oemType,
    factory_contact: product.factoryContact,
    product_system: product.productSystem,
    packaging_notes: product.packagingNotes,
    margin_target: product.marginTarget,
    annual_volume_target: product.annualVolumeTarget,
    image_url: product.imageUrl,
    image_alt: product.imageAlt,
    brand_strategy: product.brandStrategy,
    custom_options: product.customOptions,
    certification: product.certification,
    specification: product.specification ?? {},
    spec_status: product.specStatus ?? "not_started",
    status,
    pipeline_stage: status,
    is_archived: false,
    updated_at: product.updatedAt,
  };
}

function priceOptionToDbRow(option: ProductPriceOption) {
  return {
    id: option.id,
    product_id: option.productId,
    moq: option.moq,
    label: option.label ?? null,
    usd_cost: option.usdCost,
    exchange_rate: option.exchangeRate,
    wholesale_gp: option.wholesaleGp,
    dealer_gp: option.dealerGp,
    lead_time: option.leadTime,
  };
}

export async function createProductInSupabase(
  bundle: ProductCreateBundle,
): Promise<void> {
  if (!isProductSupabaseEnabled()) return;

  const status = bundle.status.status;
  await createProduct(productToDbRow(bundle.product, status));

  const moqRows = bundle.priceOptions.map(priceOptionToDbRow);
  if (moqRows.length > 0) {
    await upsertProductMoqPrices(moqRows);
  }
}

export async function updateProductInSupabase(
  bundle: ProductCreateBundle,
): Promise<void> {
  if (!isProductSupabaseEnabled()) return;

  const status = bundle.status.status;
  const { id: _id, ...patch } = productToDbRow(bundle.product, status);
  await updateProduct(bundle.product.id, patch);

  const supabase = createClient();
  await supabase
    .from("product_moq_prices")
    .delete()
    .eq("product_id", bundle.product.id);

  const moqRows = bundle.priceOptions.map(priceOptionToDbRow);
  if (moqRows.length > 0) {
    await upsertProductMoqPrices(moqRows);
  }
}
