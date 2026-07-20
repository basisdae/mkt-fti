export const SEMINAR_AGENDA_DRAG_ACTIVATION_PX = 6;

export function isSeminarAgendaTap(
  start: { x: number; y: number } | null,
  end: { x: number; y: number },
  threshold = SEMINAR_AGENDA_DRAG_ACTIVATION_PX,
): boolean {
  if (!start) return false;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return Math.hypot(dx, dy) <= threshold;
}
