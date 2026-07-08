/**
 * Recycle Bin — client metadata in localStorage.
 * Products are soft-hidden via existing `is_archived` (no new schema).
 * Permanent delete uses the existing hard-delete path only when user confirms.
 */
import { generateId } from "@/lib/generate-id";

export const RECYCLE_BIN_KEY = "mkt_hq_recycle_bin";
export const RECYCLE_BIN_RETENTION_DAYS = 30;

export type RecycleEntityType = "product" | "supplier";

export interface RecycleBinItem {
  id: string;
  entityType: RecycleEntityType;
  entityId: string;
  name: string;
  code?: string;
  subtitle?: string;
  imageUrl?: string | null;
  deletedAt: string;
  expiresAt: string;
}

function canUseStorage(): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const probe = "__mkt_hq_recycle_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function readAll(): RecycleBinItem[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(RECYCLE_BIN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecycleBinItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: RecycleBinItem[]): boolean {
  if (!canUseStorage()) return false;
  try {
    window.localStorage.setItem(RECYCLE_BIN_KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

export function listRecycleBinItems(): RecycleBinItem[] {
  return readAll().sort(
    (a, b) =>
      new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime(),
  );
}

export function isRecycleItemExpired(item: RecycleBinItem, now = Date.now()): boolean {
  return new Date(item.expiresAt).getTime() <= now;
}

export function daysLeftInRecycleBin(item: RecycleBinItem, now = Date.now()): number {
  const ms = new Date(item.expiresAt).getTime() - now;
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function addProductToRecycleBin(input: {
  entityId: string;
  name: string;
  code?: string;
  subtitle?: string;
  imageUrl?: string | null;
}): RecycleBinItem | null {
  const deletedAt = new Date();
  const expiresAt = new Date(
    deletedAt.getTime() + RECYCLE_BIN_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );
  const item: RecycleBinItem = {
    id: generateId(),
    entityType: "product",
    entityId: input.entityId,
    name: input.name,
    code: input.code,
    subtitle: input.subtitle,
    imageUrl: input.imageUrl ?? null,
    deletedAt: deletedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  const items = readAll().filter(
    (entry) =>
      !(
        entry.entityType === "product" && entry.entityId === input.entityId
      ),
  );
  const ok = writeAll([item, ...items]);
  return ok ? item : null;
}

export function removeFromRecycleBin(entryId: string): boolean {
  return writeAll(readAll().filter((item) => item.id !== entryId));
}

export function removeRecycleBinByEntity(
  entityType: RecycleEntityType,
  entityId: string,
): boolean {
  return writeAll(
    readAll().filter(
      (item) =>
        !(item.entityType === entityType && item.entityId === entityId),
    ),
  );
}

export function getRecycleBinItem(entryId: string): RecycleBinItem | undefined {
  return readAll().find((item) => item.id === entryId);
}
