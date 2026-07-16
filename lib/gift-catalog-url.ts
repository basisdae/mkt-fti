/** Validate optional http/https reference URLs for Gift Catalog. */

export function normalizeReferenceUrl(
  value: string | null | undefined,
): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed || null;
}

export function isValidReferenceUrl(value: string | null | undefined): boolean {
  const trimmed = normalizeReferenceUrl(value);
  if (!trimmed) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function formatReferenceUrlDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    const trimmed = url.trim();
    if (trimmed.length <= 32) return trimmed;
    return `${trimmed.slice(0, 31)}…`;
  }
}
