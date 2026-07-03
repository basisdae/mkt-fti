import {
  createProductImagePreviewUrl,
  defaultProductImageAlt,
  revokeProductImagePreviewUrl,
  validateProductImageFile,
} from "@/lib/product-image";

export interface ProductImageRecord {
  imageUrl: string;
  imageAlt: string;
}

export interface ProductImageUploadInput {
  file: File;
  productId: string;
  productName: string;
  alt?: string;
}

/** Storage contract for product artwork (Supabase-ready). */
export interface ProductImageStorage {
  readonly provider: "local" | "supabase";
  isConnected(): boolean;
  validate(file: File): string | null;
  createPreviewUrl(file: File): string;
  revokePreviewUrl(url: string | null | undefined): void;
  upload(input: ProductImageUploadInput): Promise<ProductImageRecord | null>;
  remove(_productId: string, _path?: string): Promise<void>;
  getPublicUrl(path: string): string;
}

class LocalProductImageStorage implements ProductImageStorage {
  readonly provider = "local" as const;

  isConnected() {
    return false;
  }

  validate(file: File) {
    return validateProductImageFile(file);
  }

  createPreviewUrl(file: File) {
    return createProductImagePreviewUrl(file);
  }

  revokePreviewUrl(url: string | null | undefined) {
    revokeProductImagePreviewUrl(url);
  }

  async upload(input: ProductImageUploadInput): Promise<ProductImageRecord | null> {
    const error = this.validate(input.file);
    if (error) throw new Error(error);

    return {
      imageUrl: this.createPreviewUrl(input.file),
      imageAlt:
        input.alt?.trim() || defaultProductImageAlt(input.productName),
    };
  }

  async remove() {
    // Local previews are revoked by the UI layer.
  }

  getPublicUrl(path: string) {
    return path;
  }
}

class SupabaseProductImageStorage implements ProductImageStorage {
  readonly provider = "supabase" as const;

  isConnected() {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }

  validate(file: File) {
    return validateProductImageFile(file);
  }

  createPreviewUrl(file: File) {
    return createProductImagePreviewUrl(file);
  }

  revokePreviewUrl(url: string | null | undefined) {
    revokeProductImagePreviewUrl(url);
  }

  async upload(_input: ProductImageUploadInput): Promise<ProductImageRecord | null> {
    if (!this.isConnected()) return null;
    // TODO: bucket `product-images`, path `{productId}/{uuid}.{ext}`
    throw new Error("Supabase Storage upload is not implemented yet.");
  }

  async remove(_productId: string, _path?: string) {
    if (!this.isConnected()) return;
    throw new Error("Supabase Storage delete is not implemented yet.");
  }

  getPublicUrl(path: string) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return path;
    return `${base}/storage/v1/object/public/product-images/${path}`;
  }
}

const localStorage = new LocalProductImageStorage();
const supabaseStorage = new SupabaseProductImageStorage();

export function getProductImageStorage(): ProductImageStorage {
  return supabaseStorage.isConnected() ? supabaseStorage : localStorage;
}

export function isSupabaseStorageConnected(): boolean {
  return supabaseStorage.isConnected();
}

export async function uploadProductImage(
  file: File,
  productId: string,
  productName: string,
  alt?: string,
) {
  return getProductImageStorage().upload({ file, productId, productName, alt });
}
