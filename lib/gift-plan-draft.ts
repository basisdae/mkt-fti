import type { GiftPlanDraftSnapshot, GiftPlanEditorPayload } from "@/types/gift-plan";

const DRAFT_PREFIX = "mkt_gift_plan_draft_";

export function giftPlanDraftKey(planId: string): string {
  return `${DRAFT_PREFIX}${planId}`;
}

export function readGiftPlanDraft(planId: string): GiftPlanDraftSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(giftPlanDraftKey(planId));
    if (!raw) return null;
    return JSON.parse(raw) as GiftPlanDraftSnapshot;
  } catch {
    return null;
  }
}

export function writeGiftPlanDraft(
  planId: string,
  payload: GiftPlanEditorPayload,
  baseUpdatedAt: string | null,
): void {
  if (typeof window === "undefined") return;
  const snapshot: GiftPlanDraftSnapshot = {
    payload,
    saved_at: new Date().toISOString(),
    base_updated_at: baseUpdatedAt,
  };
  localStorage.setItem(giftPlanDraftKey(planId), JSON.stringify(snapshot));
}

export function clearGiftPlanDraft(planId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(giftPlanDraftKey(planId));
}

export function isDraftNewerThanServer(
  draft: GiftPlanDraftSnapshot,
  serverUpdatedAt: string | null,
): boolean {
  if (!serverUpdatedAt) return true;
  const base = draft.base_updated_at;
  if (!base) return true;
  return new Date(draft.saved_at).getTime() > new Date(serverUpdatedAt).getTime();
}
