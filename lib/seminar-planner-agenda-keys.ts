import type { SeminarAgendaItemInput } from "@/types/seminar-planner";

/** Stable React / DnD key — survives reorder before the row is persisted. */
export function agendaItemKey(
  item: SeminarAgendaItemInput,
  index: number,
): string {
  return item.id ?? item.client_key ?? `agenda-new-${index}`;
}

export function newAgendaClientKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `agenda-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
