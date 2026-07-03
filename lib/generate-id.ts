/**
 * Generate a RFC 4122 UUID for client-side records until Supabase returns an id.
 * Use Supabase `.select()` after insert when persisting to the database.
 */
export function generateId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  throw new Error("crypto.randomUUID is not available in this environment");
}
