import { generateId } from "@/lib/generate-id";
import type {
  GiftPlanItemInput,
  GiftPlanPurchaseGroupInput,
} from "@/types/gift-plan";

export function buildDefaultPurchaseGroupLabel(item: {
  gift_name: string;
  specification?: string | null;
}): string {
  const name = item.gift_name.trim() || "Gift item";
  const spec = item.specification?.trim();
  return spec ? `${name} — ${spec}` : name;
}

export function createDefaultPurchaseGroup(
  planId: string,
  item: Pick<GiftPlanItemInput, "gift_name" | "specification">,
): GiftPlanPurchaseGroupInput {
  return {
    id: generateId(),
    plan_id: planId,
    label: buildDefaultPurchaseGroupLabel(item),
    notes: "",
    buffer_percentage: 0,
  };
}

/** Attach a dedicated purchase group to a newly created plan item. */
export function withDefaultPurchaseGroup(
  planId: string,
  item: GiftPlanItemInput,
): {
  item: GiftPlanItemInput;
  group: GiftPlanPurchaseGroupInput;
} {
  const group = createDefaultPurchaseGroup(planId, item);
  return {
    group,
    item: { ...item, purchase_group_id: group.id },
  };
}

export function splitItemsIntoIndividualGroups(
  planId: string,
  items: GiftPlanItemInput[],
): {
  groups: GiftPlanPurchaseGroupInput[];
  items: GiftPlanItemInput[];
} {
  const groups: GiftPlanPurchaseGroupInput[] = [];
  const nextItems = items.map((item) => {
    const group = createDefaultPurchaseGroup(planId, item);
    groups.push(group);
    return { ...item, purchase_group_id: group.id };
  });
  return { groups, items: nextItems };
}
