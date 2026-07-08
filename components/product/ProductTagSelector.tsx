"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import {
  ArrowLeftRight,
  Building2,
  Droplets,
  GlassWater,
  Tags,
  Wrench,
  Zap,
} from "lucide-react";
import { Input } from "@/components/forms/Input";
import {
  isOtherTag,
  type ProductTagFormState,
  type ProductTagGroupWithTags,
} from "@/lib/product-tags";
import { loadProductTagCatalogForForm } from "@/lib/services/product-tags";
import { cn } from "@/lib/utils";

interface ProductTagSelectorProps {
  value: ProductTagFormState;
  onChange: (value: ProductTagFormState) => void;
  className?: string;
  /** Hide internal title when parent section already labels Classification. */
  hideHeader?: boolean;
}

interface GroupVisual {
  icon: ComponentType<{ className?: string }>;
  helper: string;
  accentClass: string;
}

function getGroupVisual(groupKey: string, groupName?: string): GroupVisual {
  const key = groupKey.trim().toLowerCase();
  const name = (groupName ?? "").trim().toLowerCase();

  if (key === "water_technology" || name.includes("water technology")) {
    return {
      icon: Droplets,
      helper: "Filtration and water treatment method",
      accentClass: "border-l-[#7A1F2B]",
    };
  }
  if (key === "output_function" || name.includes("output function")) {
    return {
      icon: GlassWater,
      helper: "Water output or serving function",
      accentClass: "border-l-[#7A1F2B]",
    };
  }
  if (key === "water_flow_system" || name.includes("water flow")) {
    return {
      icon: ArrowLeftRight,
      helper: "Inlet, outlet, tank, and pump system",
      accentClass: "border-l-[#7A1F2B]",
    };
  }
  if (key === "power_system" || name.includes("power")) {
    return {
      icon: Zap,
      helper: "Electric, battery, or non-electric system",
      accentClass: "border-l-[#7A1F2B]",
    };
  }
  if (key === "installation_type" || name.includes("installation")) {
    return {
      icon: Wrench,
      helper: "Where and how the product is installed",
      accentClass: "border-l-[#7A1F2B]",
    };
  }
  if (key === "application" || name.includes("application")) {
    return {
      icon: Building2,
      helper: "Recommended usage environment",
      accentClass: "border-l-[#7A1F2B]",
    };
  }

  return {
    icon: Tags,
    helper: "Product classification tags",
    accentClass: "border-l-[#7A1F2B]",
  };
}

export function ProductTagSelector({
  value,
  onChange,
  className,
  hideHeader = false,
}: ProductTagSelectorProps) {
  const [groups, setGroups] = useState<ProductTagGroupWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const initialSelectedIds = useRef(value.selectedTagIds);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const catalog = await loadProductTagCatalogForForm(
        initialSelectedIds.current,
      );
      if (!cancelled) {
        setGroups(catalog);
        setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleTag(group: ProductTagGroupWithTags, tagId: string) {
    const tag = group.tags.find((item) => item.id === tagId);
    if (!tag) return;

    const selected = new Set(value.selectedTagIds);
    if (selected.has(tagId)) {
      selected.delete(tagId);
      const otherTextByGroupKey = { ...value.otherTextByGroupKey };
      if (isOtherTag(tag)) {
        delete otherTextByGroupKey[group.key];
      }
      onChange({
        selectedTagIds: [...selected],
        otherTextByGroupKey,
      });
      return;
    }

    // Inactive tags can only be deselected, not newly selected.
    if (!tag.active) return;

    selected.add(tagId);
    onChange({
      ...value,
      selectedTagIds: [...selected],
    });
  }

  function updateOtherText(groupKey: string, text: string) {
    onChange({
      ...value,
      otherTextByGroupKey: {
        ...value.otherTextByGroupKey,
        [groupKey]: text,
      },
    });
  }

  if (loading) {
    return (
      <p className={cn("text-sm text-gray-400", className)}>
        Loading tags…
      </p>
    );
  }

  if (groups.length === 0) {
    return (
      <p className={cn("text-sm text-gray-400", className)}>
        Product tags are unavailable. Run migrations 20260704190000 and
        20260704192000.
      </p>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {!hideHeader && (
        <div className="border-b border-gray-100 pb-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Product Classification
          </h3>
          <p className="mt-0.5 text-xs text-gray-400">
            Select all tags that apply. Other creates a reusable custom tag.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        {groups.map((group) => {
          const visual = getGroupVisual(group.key, group.name);
          const Icon = visual.icon;
          const otherTag = group.tags.find(isOtherTag);
          const otherSelected =
            otherTag != null && value.selectedTagIds.includes(otherTag.id);
          const selectableTags = group.tags.filter(
            (tag) => tag.active || value.selectedTagIds.includes(tag.id),
          );

          return (
            <section
              key={group.id}
              className={cn(
                "rounded-xl border border-gray-100 border-l-[3px] bg-gray-50/80 p-4 shadow-sm shadow-gray-100/60",
                visual.accentClass,
              )}
            >
              <div className="mb-3 flex items-start gap-2.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#7A1F2B] shadow-sm ring-1 ring-gray-100">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {group.name}
                    {!group.active && (
                      <span className="ml-2 text-xs font-normal text-amber-600">
                        (legacy group)
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-gray-400">
                    {visual.helper}
                  </p>
                </div>
              </div>

              <div className="mb-3 border-t border-gray-100/90" />

              <div className="flex flex-wrap gap-2">
                {selectableTags.map((tag) => {
                  const selected = value.selectedTagIds.includes(tag.id);
                  const inactive = !tag.active;
                  const notClickable = inactive && !selected;

                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(group, tag.id)}
                      disabled={notClickable}
                      title={
                        inactive
                          ? "Disabled tag — still linked to this product"
                          : undefined
                      }
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors",
                        selected
                          ? "border-[#7A1F2B] bg-[#7A1F2B] text-white"
                          : "border-gray-200 bg-white text-gray-700 hover:border-[#7A1F2B]/40 hover:text-[#7A1F2B]",
                        inactive && selected && "opacity-70 ring-1 ring-amber-300",
                        notClickable && "cursor-not-allowed opacity-40",
                      )}
                    >
                      {tag.label}
                      {inactive ? " *" : ""}
                    </button>
                  );
                })}
              </div>

              {otherSelected && otherTag?.active !== false && (
                <div className="mt-3 max-w-sm border-t border-gray-100 pt-3">
                  <Input
                    label="Custom tag"
                    value={value.otherTextByGroupKey[group.key] ?? ""}
                    onChange={(e) =>
                      updateOtherText(group.key, e.target.value)
                    }
                    placeholder="Type custom value — becomes reusable"
                  />
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
