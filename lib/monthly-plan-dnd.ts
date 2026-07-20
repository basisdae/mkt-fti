import {
  closestCorners,
  pointerWithin,
  type CollisionDetection,
} from "@dnd-kit/core";

/** Prefer sortable cards for ordering; fall back to bucket containers for empty areas. */
export const monthlyPlanCollisionDetection: CollisionDetection = (args) => {
  const cornerCollisions = closestCorners(args);
  const sortableHit = cornerCollisions.find(
    (collision) => !String(collision.id).startsWith("bucket:"),
  );
  if (sortableHit) {
    return cornerCollisions;
  }

  const pointerCollisions = pointerWithin(args);
  const bucketHits = pointerCollisions.filter((collision) =>
    String(collision.id).startsWith("bucket:"),
  );
  if (bucketHits.length > 0) {
    return bucketHits;
  }

  return cornerCollisions;
};

export const MONTHLY_PLAN_DRAG_ACTIVATION_PX = 8;

export function isMonthlyPlanTap(
  start: { x: number; y: number } | null,
  end: { x: number; y: number },
  threshold = MONTHLY_PLAN_DRAG_ACTIVATION_PX,
): boolean {
  if (!start) return false;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return Math.hypot(dx, dy) <= threshold;
}
