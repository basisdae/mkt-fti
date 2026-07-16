"use server";

import {
  canEditGiftPlans,
  canExportGiftPlans,
  canViewGiftPlans,
} from "@/lib/auth/permissions";
import {
  buildPurchasingSummary,
  calcGiftCampaign,
  normalizeTierName,
  tierNamesConflict,
  toCampaignCalcInput,
} from "@/lib/gift-plan-calculations";
import { checkPurchaseGroupCompatibility } from "@/lib/gift-plan-purchase-groups";
import {
  assertCommunicationReportSafe,
  buildCommunicationReport,
} from "@/lib/gift-plan-communication";
import { getAuthenticatedSupabaseForActions } from "@/lib/supabase/authenticated-server";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  GiftPlanCommunicationReport,
  GiftPlanEditorBundle,
  GiftPlanEditorPayload,
  GiftPlanItemRow,
  GiftPlanListSummary,
  GiftPlanPurchaseGroupRow,
  GiftPlanRow,
  GiftPlanTierRow,
} from "@/types/gift-plan";
import type { AppUser } from "@/types/auth";

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type ActionAuth = {
  user: AppUser;
  supabase: SupabaseClient;
};

function fail<T>(error: string): ActionResult<T> {
  return { ok: false, error };
}

async function requireView(): Promise<ActionResult<ActionAuth>> {
  const auth = await getAuthenticatedSupabaseForActions();
  if (!auth.ok) return fail(auth.error);

  const { user, supabase } = auth.data;
  if (
    !canViewGiftPlans(user) &&
    !canEditGiftPlans(user) &&
    !canExportGiftPlans(user)
  ) {
    return fail(t.noPermissionGiftPlans);
  }

  return { ok: true, data: { user, supabase } };
}

async function requireEdit(): Promise<ActionResult<ActionAuth>> {
  const view = await requireView();
  if (!view.ok) return view;
  if (!canEditGiftPlans(view.data.user)) {
    return fail(t.noPermissionEditGiftPlans);
  }
  return view;
}

async function requireExport(): Promise<ActionResult<ActionAuth>> {
  const view = await requireView();
  if (!view.ok) return view;
  if (!canExportGiftPlans(view.data.user)) {
    return fail(t.noPermissionExportGiftPlans);
  }
  return view;
}

function mapPlanRow(row: Record<string, unknown>): GiftPlanRow {
  const plan = row as unknown as GiftPlanRow;
  return {
    ...plan,
    campaign_headline: plan.campaign_headline ?? "",
  };
}

function mapTierRow(row: Record<string, unknown>): GiftPlanTierRow {
  return row as unknown as GiftPlanTierRow;
}

function mapItemRow(row: Record<string, unknown>): GiftPlanItemRow {
  return row as unknown as GiftPlanItemRow;
}

function mapGroupRow(row: Record<string, unknown>): GiftPlanPurchaseGroupRow {
  return row as unknown as GiftPlanPurchaseGroupRow;
}

function validateTierNames(
  tiers: Array<{ id: string; name: string }>,
): string | null {
  const seen = new Set<string>();
  for (const tier of tiers) {
    const normalized = normalizeTierName(tier.name).toLowerCase();
    if (!normalized) return t.everyTierMustHaveName;
    if (seen.has(normalized) || tierNamesConflict(tiers, tier.id, tier.name)) {
      return t.duplicateTierName(tier.name);
    }
    seen.add(normalized);
  }
  return null;
}

function buildListSummary(
  plan: GiftPlanRow,
  tiers: GiftPlanTierRow[],
  items: GiftPlanItemRow[],
): GiftPlanListSummary {
  const calc = toCampaignCalcInput(plan, tiers, items);
  const campaign = calcGiftCampaign(calc);

  return {
    id: plan.id,
    name: plan.name,
    campaign_year: plan.campaign_year,
    status: plan.status,
    is_archived: plan.is_archived,
    owner: plan.owner,
    total_customers: campaign.total_customers,
    total_gift_units: campaign.total_gift_units,
    total_actual_cost: campaign.total_campaign_actual_cost,
    total_estimated_value: campaign.total_campaign_estimated_value,
    budget_percent: campaign.actual_gift_budget_percent,
    updated_at: plan.updated_at,
    last_saved_at: plan.last_saved_at,
  };
}

async function loadBundle(
  planId: string,
  supabase: SupabaseClient,
): Promise<GiftPlanEditorBundle | null> {
  const { data: plan, error: planError } = await supabase
    .from("gift_plans")
    .select("*")
    .eq("id", planId)
    .maybeSingle();

  if (planError || !plan) return null;

  const { data: tiers } = await supabase
    .from("gift_plan_tiers")
    .select("*")
    .eq("plan_id", planId)
    .order("sort_order", { ascending: true });

  const tierIds = (tiers ?? []).map((tier) => tier.id as string);
  const { data: items } =
    tierIds.length > 0
      ? await supabase
          .from("gift_plan_items")
          .select("*")
          .in("tier_id", tierIds)
          .order("sort_order", { ascending: true })
      : { data: [] as Record<string, unknown>[] };

  const { data: groups } = await supabase
    .from("gift_plan_purchase_groups")
    .select("*")
    .eq("plan_id", planId);

  return {
    plan: mapPlanRow(plan),
    tiers: (tiers ?? []).map(mapTierRow),
    items: (items ?? []).map(mapItemRow),
    purchase_groups: (groups ?? []).map(mapGroupRow),
  };
}

export async function listGiftPlanSummariesAction(): Promise<
  ActionResult<GiftPlanListSummary[]>
> {
  const auth = await requireView();
  if (!auth.ok) return auth;

  const { supabase } = auth.data;

  const { data: plans, error } = await supabase
    .from("gift_plans")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) return fail(error.message);

  const summaries: GiftPlanListSummary[] = [];
  for (const plan of plans ?? []) {
    const bundle = await loadBundle(plan.id as string, supabase);
    if (!bundle) continue;
    summaries.push(buildListSummary(bundle.plan, bundle.tiers, bundle.items));
  }

  return { ok: true, data: summaries };
}

export async function getGiftPlanEditorBundleAction(
  planId: string,
): Promise<ActionResult<GiftPlanEditorBundle>> {
  const auth = await requireView();
  if (!auth.ok) return auth;
  if (!canEditGiftPlans(auth.data.user)) {
    return fail(t.noPermissionEditGiftPlans);
  }

  const bundle = await loadBundle(planId, auth.data.supabase);
  if (!bundle) return fail(t.giftPlanNotFound);
  return { ok: true, data: bundle };
}

export async function getGiftPlanCommunicationReportAction(
  planId: string,
): Promise<ActionResult<GiftPlanCommunicationReport>> {
  const auth = await requireView();
  if (!auth.ok) return auth;

  const bundle = await loadBundle(planId, auth.data.supabase);
  if (!bundle) return fail(t.giftPlanNotFound);

  const report = buildCommunicationReport(bundle);
  assertCommunicationReportSafe(report);
  return { ok: true, data: report };
}

export async function createGiftPlanAction(input: {
  name: string;
  campaign_year: number;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  const { user, supabase } = auth.data;
  const name = input.name.trim();
  if (!name) return fail(t.planNameRequired);

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("gift_plans")
    .insert({
      name,
      campaign_year: input.campaign_year,
      status: "draft",
      created_by_email: user.email,
      updated_by_email: user.email,
      last_saved_at: now,
    })
    .select("id")
    .single();

  if (error || !data) return fail(error?.message ?? t.couldNotCreateGiftPlan);
  return { ok: true, data: { id: data.id as string } };
}

export async function saveGiftPlanAction(
  payload: GiftPlanEditorPayload,
): Promise<ActionResult<{ updated_at: string }>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  const { user, supabase } = auth.data;

  const tierValidation = validateTierNames(
    payload.tiers.map((tier) => ({ id: tier.id, name: tier.name })),
  );
  if (tierValidation) return fail(tierValidation);

  const planId = payload.plan.id;
  const now = new Date().toISOString();

  if (payload.expected_updated_at) {
    const { data: current } = await supabase
      .from("gift_plans")
      .select("updated_at")
      .eq("id", planId)
      .maybeSingle();
    if (
      current?.updated_at &&
      current.updated_at !== payload.expected_updated_at
    ) {
      return fail(t.planUpdatedElsewhere);
    }
  }

  const { error: planError } = await supabase
    .from("gift_plans")
    .update({
      name: payload.plan.name.trim(),
      campaign_year: payload.plan.campaign_year,
      campaign_headline: payload.plan.campaign_headline,
      description: payload.plan.description,
      owner: payload.plan.owner,
      status: payload.plan.status,
      total_customer_sales: payload.plan.total_customer_sales,
      max_actual_cost_budget: payload.plan.max_actual_cost_budget,
      budget_limit_percent: payload.plan.budget_limit_percent,
      campaign_conditions: payload.plan.campaign_conditions,
      approval_notes: payload.plan.approval_notes,
      is_archived: payload.plan.is_archived,
      updated_by_email: user.email,
      last_saved_at: now,
      updated_at: now,
    })
    .eq("id", planId);

  if (planError) return fail(planError.message);

  const existingBundle = await loadBundle(planId, supabase);
  if (!existingBundle) return fail(t.giftPlanNotFound);

  const incomingTierIds = new Set(payload.tiers.map((tier) => tier.id));
  const tiersToDelete = existingBundle.tiers
    .filter((tier) => !incomingTierIds.has(tier.id))
    .map((tier) => tier.id);

  if (tiersToDelete.length > 0) {
    const { error } = await supabase
      .from("gift_plan_tiers")
      .delete()
      .in("id", tiersToDelete);
    if (error) return fail(error.message);
  }

  for (const tier of payload.tiers) {
    const { error } = await supabase.from("gift_plan_tiers").upsert({
      id: tier.id,
      plan_id: planId,
      name: normalizeTierName(tier.name),
      sort_order: tier.sort_order,
      sales_threshold: tier.sales_threshold,
      sales_threshold_label: tier.sales_threshold_label,
      customer_count: tier.customer_count,
      notes: tier.notes,
      gift_policy: tier.gift_policy,
      updated_at: now,
    });
    if (error) return fail(error.message);
  }

  const incomingItemIds = new Set(
    payload.tiers.flatMap((tier) => tier.items.map((item) => item.id)),
  );
  const itemsToDelete = existingBundle.items
    .filter((item) => !incomingItemIds.has(item.id))
    .map((item) => item.id);

  if (itemsToDelete.length > 0) {
    const { error } = await supabase
      .from("gift_plan_items")
      .delete()
      .in("id", itemsToDelete);
    if (error) return fail(error.message);
  }

  const incomingGroupIds = new Set(payload.purchase_groups.map((group) => group.id));
  const groupsToDelete = existingBundle.purchase_groups
    .filter((group) => !incomingGroupIds.has(group.id))
    .map((group) => group.id);

  if (groupsToDelete.length > 0) {
    const { error } = await supabase
      .from("gift_plan_purchase_groups")
      .delete()
      .in("id", groupsToDelete);
    if (error) return fail(error.message);
  }

  for (const group of payload.purchase_groups) {
    const { error } = await supabase.from("gift_plan_purchase_groups").upsert({
      id: group.id,
      plan_id: planId,
      label: group.label,
      notes: group.notes,
      updated_at: now,
    });
    if (error) return fail(error.message);
  }

  for (const tier of payload.tiers) {
    for (const item of tier.items) {
      const { error } = await supabase.from("gift_plan_items").upsert({
        id: item.id,
        tier_id: tier.id,
        sort_order: item.sort_order,
        gift_name: item.gift_name.trim(),
        category: item.category,
        source: item.source,
        qty_per_customer: item.qty_per_customer,
        unit_actual_cost: item.unit_actual_cost,
        estimated_gift_value_per_unit: item.estimated_gift_value_per_unit,
        supplier: item.supplier,
        notes: item.notes,
        purchase_group_id: item.purchase_group_id,
        gift_catalog_id: item.gift_catalog_id ?? null,
        specification: item.specification ?? "",
        updated_at: now,
      });
      if (error) return fail(error.message);
    }
  }

  return { ok: true, data: { updated_at: now } };
}

export async function duplicateGiftPlanAction(
  planId: string,
  newName?: string,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  const { user, supabase } = auth.data;
  const bundle = await loadBundle(planId, supabase);
  if (!bundle) return fail(t.giftPlanNotFound);

  const now = new Date().toISOString();
  const groupMap = new Map<string, string>();

  const { data: newPlan, error: planError } = await supabase
    .from("gift_plans")
    .insert({
      name: (newName?.trim() || `${bundle.plan.name}${t.planCopySuffix}`).slice(0, 200),
      campaign_year: bundle.plan.campaign_year,
      campaign_headline: bundle.plan.campaign_headline,
      description: bundle.plan.description,
      owner: bundle.plan.owner,
      status: "draft",
      total_customer_sales: bundle.plan.total_customer_sales,
      max_actual_cost_budget: bundle.plan.max_actual_cost_budget,
      budget_limit_percent: bundle.plan.budget_limit_percent,
      campaign_conditions: bundle.plan.campaign_conditions,
      approval_notes: bundle.plan.approval_notes,
      is_archived: false,
      created_by_email: user.email,
      updated_by_email: user.email,
      last_saved_at: now,
    })
    .select("id")
    .single();

  if (planError || !newPlan) return fail(planError?.message ?? t.couldNotDuplicatePlan);

  const newPlanId = newPlan.id as string;

  for (const group of bundle.purchase_groups) {
    const { data: inserted, error } = await supabase
      .from("gift_plan_purchase_groups")
      .insert({
        plan_id: newPlanId,
        label: group.label,
        notes: group.notes,
      })
      .select("id")
      .single();
    if (error || !inserted) return fail(error?.message ?? t.couldNotDuplicatePurchaseGroup);
    groupMap.set(group.id, inserted.id as string);
  }

  const tierMap = new Map<string, string>();
  for (const tier of bundle.tiers) {
    const { data: inserted, error } = await supabase
      .from("gift_plan_tiers")
      .insert({
        plan_id: newPlanId,
        name: tier.name,
        sort_order: tier.sort_order,
        sales_threshold: tier.sales_threshold,
        sales_threshold_label: tier.sales_threshold_label,
        customer_count: tier.customer_count,
        notes: tier.notes,
        gift_policy: tier.gift_policy,
      })
      .select("id")
      .single();
    if (error || !inserted) return fail(error?.message ?? t.couldNotDuplicateTier);
    tierMap.set(tier.id, inserted.id as string);
  }

  for (const item of bundle.items) {
    const newTierId = tierMap.get(item.tier_id);
    if (!newTierId) continue;
    const newGroupId = item.purchase_group_id
      ? groupMap.get(item.purchase_group_id) ?? null
      : null;

    const { error } = await supabase.from("gift_plan_items").insert({
      tier_id: newTierId,
      sort_order: item.sort_order,
      gift_name: item.gift_name,
      category: item.category,
      source: item.source,
      qty_per_customer: item.qty_per_customer,
      unit_actual_cost: item.unit_actual_cost,
      estimated_gift_value_per_unit: item.estimated_gift_value_per_unit,
      supplier: item.supplier,
      notes: item.notes,
      purchase_group_id: newGroupId,
      gift_catalog_id: item.gift_catalog_id ?? null,
      specification: item.specification ?? "",
    });
    if (error) return fail(error.message);
  }

  return { ok: true, data: { id: newPlanId } };
}

export async function setGiftPlanArchivedAction(
  planId: string,
  archived: boolean,
): Promise<ActionResult<null>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  const { user, supabase } = auth.data;
  const { error } = await supabase
    .from("gift_plans")
    .update({
      is_archived: archived,
      updated_by_email: user.email,
      updated_at: new Date().toISOString(),
    })
    .eq("id", planId);

  if (error) return fail(error.message);
  return { ok: true, data: null };
}

export async function deleteGiftPlanAction(
  planId: string,
): Promise<ActionResult<null>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  const { error } = await auth.data.supabase
    .from("gift_plans")
    .delete()
    .eq("id", planId);
  if (error) return fail(error.message);
  return { ok: true, data: null };
}

export async function renameGiftPlanAction(
  planId: string,
  name: string,
): Promise<ActionResult<null>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  const trimmed = name.trim();
  if (!trimmed) return fail(t.planNameRequired);

  const { user, supabase } = auth.data;
  const { error } = await supabase
    .from("gift_plans")
    .update({
      name: trimmed,
      updated_by_email: user.email,
      updated_at: new Date().toISOString(),
    })
    .eq("id", planId);

  if (error) return fail(error.message);
  return { ok: true, data: null };
}

export async function createPurchaseGroupAction(input: {
  plan_id: string;
  item_ids: string[];
  label?: string;
  force?: boolean;
}): Promise<ActionResult<{ group_id: string }>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  if (input.item_ids.length < 2) {
    return fail(t.selectAtLeastTwoItems);
  }

  const { supabase } = auth.data;
  const bundle = await loadBundle(input.plan_id, supabase);
  if (!bundle) return fail(t.giftPlanNotFound);

  const selected = bundle.items.filter((item) => input.item_ids.includes(item.id));
  if (selected.length !== input.item_ids.length) {
    return fail(t.itemsNotFound);
  }

  const issues = checkPurchaseGroupCompatibility(selected);
  if (issues.length > 0 && !input.force) {
    return fail(issues.map((issue) => issue.message).join(" "));
  }

  const { data: group, error: groupError } = await supabase
    .from("gift_plan_purchase_groups")
    .insert({
      plan_id: input.plan_id,
      label: input.label?.trim() || selected[0]?.gift_name || "",
    })
    .select("id")
    .single();

  if (groupError || !group) {
    return fail(groupError?.message ?? t.couldNotCreatePurchaseGroup);
  }

  const { error: updateError } = await supabase
    .from("gift_plan_items")
    .update({ purchase_group_id: group.id })
    .in("id", input.item_ids);

  if (updateError) return fail(updateError.message);
  return { ok: true, data: { group_id: group.id as string } };
}

export async function ungroupGiftItemsAction(
  itemIds: string[],
): Promise<ActionResult<null>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  if (itemIds.length === 0) return fail(t.noItemsSelected);

  const { error } = await auth.data.supabase
    .from("gift_plan_items")
    .update({ purchase_group_id: null })
    .in("id", itemIds);

  if (error) return fail(error.message);
  return { ok: true, data: null };
}

export async function deletePurchaseGroupAction(
  groupId: string,
): Promise<ActionResult<null>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  const { error } = await auth.data.supabase
    .from("gift_plan_purchase_groups")
    .delete()
    .eq("id", groupId);

  if (error) return fail(error.message);
  return { ok: true, data: null };
}

export async function getGiftPlanExportBundleAction(
  planId: string,
): Promise<
  ActionResult<{
    bundle: GiftPlanEditorBundle;
    purchasing: ReturnType<typeof buildPurchasingSummary>;
  }>
> {
  const auth = await requireExport();
  if (!auth.ok) return auth;

  const bundle = await loadBundle(planId, auth.data.supabase);
  if (!bundle) return fail(t.giftPlanNotFound);

  const tiersForPurchasing = bundle.tiers.map((tier) => ({
    name: tier.name,
    customer_count: tier.customer_count,
    items: bundle.items.filter((item) => item.tier_id === tier.id),
  }));

  return {
    ok: true,
    data: {
      bundle,
      purchasing: buildPurchasingSummary(tiersForPurchasing),
    },
  };
}
