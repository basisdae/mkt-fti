import type { ProductIdea } from "@/types/idea";
import type { Supplier } from "@/types/supplier";
import type {
  PipelineLog,
  Product,
  ProductNote,
  ProductPriceOption,
  ProductStatusEntry,
  ProductTimelineMovement,
  ProductView,
} from "@/types/product";

export interface ProductCreateBundle {
  product: Product;
  status: ProductStatusEntry;
  priceOptions: ProductPriceOption[];
}

/** Product data access — swap Local* for Supabase* without changing stores/UI. */
export interface ProductRepository {
  listViews(
    products: Product[],
    statuses: Record<string, ProductStatusEntry>,
    priceOptions: ProductPriceOption[],
  ): ProductView[];
  createBundle(bundle: ProductCreateBundle): ProductCreateBundle;
}

/** Supplier data access — swap implementation when Supabase is connected. */
export interface SupplierRepository {
  listInitial(): Supplier[];
}

export interface IdeaRepository {
  listInitial(): ProductIdea[];
}

export interface NoteRepository {
  listInitial(): ProductNote[];
}

export interface TimelineRepository {
  listInitial(): ProductTimelineMovement[];
}

export interface PipelineLogRepository {
  listInitial(): PipelineLog[];
}
