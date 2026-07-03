import { createClient } from "@/lib/supabase/client";
import {
  defaultProductImageAlt,
  revokeProductImagePreviewUrl,
  validateProductImageFile,
} from "@/lib/product-image";
import { generateId } from "@/lib/generate-id";

export interface ProductImageRecord {
  imageUrl: string;
  imageAlt: string;
  imagePath: string;
}

export interface ProductImageUploadInput {
  file: File;
  productId: string;
  productName: string;
  alt?: string;
}

const PRODUCT_IMAGES_BUCKET = "product-images";

/** Storage contract for product artwork. */
export interface ProductImageStorage {
  readonly provider: "local" | "supabase";
  isConnected(): boolean;
  validate(file: File): string | null;
  createPreviewUrl(file: File): string;
  revokePreviewUrl(url: string | null | undefined): void;
  upload(input: ProductImageUploadInput): Promise<ProductImageRecord>;
  remove(productId: string, path: string): Promise<void>;
  getPublicUrl(path: string): string;
}

function sanitizeFilename(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return base.slice(0, 120) || "image";
}

function extensionFromFile(file: File): string {
  const fromName = file.name.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
  if (fromName) return fromName;
  switch (file.type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
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
    return URL.createObjectURL(file);
  }

  revokePreviewUrl(url: string | null | undefined) {
    revokeProductImagePreviewUrl(url);
  }

  async upload(_input: ProductImageUploadInput): Promise<ProductImageRecord> {
    throw new Error("Image upload requires Supabase Storage.");
  }

  async remove() {
    // No-op
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
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
  }

  validate(file: File) {
    return validateProductImageFile(file);
  }

  createPreviewUrl(file: File) {
    return URL.createObjectURL(file);
  }

  revokePreviewUrl(url: string | null | undefined) {
    revokeProductImagePreviewUrl(url);
  }

  async upload(input: ProductImageUploadInput): Promise<ProductImageRecord> {
    const error = this.validate(input.file);
    if (error) throw new Error(error);
    if (!this.isConnected()) {
      throw new Error("Supabase is not configured.");
    }

    const supabase = createClient();
    const fileId = generateId();
    const ext = extensionFromFile(input.file);
    const safeName = sanitizeFilename(input.file.name.replace(/\.[^.]+$/, ""));
    const path = `${input.productId}/${fileId}-${safeName}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(path, input.file, {
        contentType: input.file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    return {
      imageUrl: this.getPublicUrl(path),
      imageAlt:
        input.alt?.trim() || defaultProductImageAlt(input.productName),
      imagePath: path,
    };
  }

  async remove(_productId: string, path: string) {
    if (!this.isConnected() || !path.trim()) return;

    const supabase = createClient();
    const { error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove([path]);

    if (error) {
      throw new Error(error.message);
    }
  }

  getPublicUrl(path: string) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return path;
    return `${base}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${path}`;
  }
}

const localStorageAdapter = new LocalProductImageStorage();
const supabaseStorage = new SupabaseProductImageStorage();

export function getProductImageStorage(): ProductImageStorage {
  return supabaseStorage.isConnected() ? supabaseStorage : localStorageAdapter;
}

export function isSupabaseStorageConnected(): boolean {
  return supabaseStorage.isConnected();
}

export function isSupabaseStorageUploadReady(): boolean {
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

export { PRODUCT_IMAGES_BUCKET };
