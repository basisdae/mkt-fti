"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";
import {
  GIFT_ITEM_CATEGORIES,
  GIFT_ITEM_SOURCES,
} from "@/types/gift-plan";
import {
  GIFT_ITEM_CATEGORY_LABELS,
  GIFT_ITEM_SOURCE_LABELS,
} from "@/lib/gift-plan-format";
import { GIFT_CATALOG_STATUSES } from "@/types/gift-catalog";
import { GIFT_CATALOG_STATUS_LABELS } from "@/lib/gift-catalog-format";
import type { GiftCatalogInput, GiftCatalogRow } from "@/types/gift-catalog";

interface GiftCatalogItemDialogProps {
  open: boolean;
  initial?: GiftCatalogRow | null;
  saving?: boolean;
  error?: string | null;
  onCancel: () => void;
  onSave: (values: GiftCatalogInput) => void;
}

const emptyValues: GiftCatalogInput = {
  gift_name: "",
  internal_code: null,
  category: "other",
  source: "other",
  description: "",
  image_url: null,
  unit: "piece",
  default_actual_cost: 0,
  default_estimated_gift_value: 0,
  supplier_name: null,
  specification: "",
  notes: "",
  status: "active",
};

export function GiftCatalogItemDialog({
  open,
  initial,
  saving,
  error,
  onCancel,
  onSave,
}: GiftCatalogItemDialogProps) {
  const [values, setValues] = useState<GiftCatalogInput>(emptyValues);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setValues({
        gift_name: initial.gift_name,
        internal_code: initial.internal_code,
        category: initial.category,
        source: initial.source,
        description: initial.description,
        image_url: initial.image_url,
        unit: initial.unit,
        default_actual_cost: Number(initial.default_actual_cost),
        default_estimated_gift_value: Number(initial.default_estimated_gift_value),
        supplier_name: initial.supplier_name,
        specification: initial.specification,
        notes: initial.notes,
        status: initial.status,
      });
    } else {
      setValues(emptyValues);
    }
  }, [open, initial]);

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={initial ? "Edit Catalog Item" : "Add Catalog Item"}
      className="max-w-2xl"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Gift Name"
          value={values.gift_name}
          onChange={(e) => setValues((v) => ({ ...v, gift_name: e.target.value }))}
          className="sm:col-span-2"
        />
        <Input
          label="Internal Code"
          value={values.internal_code ?? ""}
          onChange={(e) =>
            setValues((v) => ({
              ...v,
              internal_code: e.target.value || null,
            }))
          }
        />
        <Input
          label="Unit"
          value={values.unit}
          onChange={(e) => setValues((v) => ({ ...v, unit: e.target.value }))}
        />
        <Select
          label="Category"
          value={values.category}
          onChange={(e) =>
            setValues((v) => ({
              ...v,
              category: e.target.value as GiftCatalogInput["category"],
            }))
          }
          options={GIFT_ITEM_CATEGORIES.map((value) => ({
            value,
            label: GIFT_ITEM_CATEGORY_LABELS[value],
          }))}
        />
        <Select
          label="Source"
          value={values.source}
          onChange={(e) =>
            setValues((v) => ({
              ...v,
              source: e.target.value as GiftCatalogInput["source"],
            }))
          }
          options={GIFT_ITEM_SOURCES.map((value) => ({
            value,
            label: GIFT_ITEM_SOURCE_LABELS[value],
          }))}
        />
        <Input
          label="Default Actual Cost"
          type="number"
          value={String(values.default_actual_cost)}
          onChange={(e) =>
            setValues((v) => ({
              ...v,
              default_actual_cost: Number(e.target.value) || 0,
            }))
          }
        />
        <Input
          label="Default Estimated Value"
          type="number"
          value={String(values.default_estimated_gift_value)}
          onChange={(e) =>
            setValues((v) => ({
              ...v,
              default_estimated_gift_value: Number(e.target.value) || 0,
            }))
          }
        />
        <Input
          label="Supplier Name"
          value={values.supplier_name ?? ""}
          onChange={(e) =>
            setValues((v) => ({
              ...v,
              supplier_name: e.target.value || null,
            }))
          }
          className="sm:col-span-2"
        />
        <Input
          label="Image URL (optional)"
          value={values.image_url ?? ""}
          onChange={(e) =>
            setValues((v) => ({
              ...v,
              image_url: e.target.value || null,
            }))
          }
          className="sm:col-span-2"
        />
        <Select
          label="Status"
          value={values.status}
          onChange={(e) =>
            setValues((v) => ({
              ...v,
              status: e.target.value as GiftCatalogInput["status"],
            }))
          }
          options={GIFT_CATALOG_STATUSES.map((value) => ({
            value,
            label: GIFT_CATALOG_STATUS_LABELS[value],
          }))}
        />
        <Textarea
          label="Specification / Variant"
          rows={2}
          value={values.specification}
          onChange={(e) =>
            setValues((v) => ({ ...v, specification: e.target.value }))
          }
          className="sm:col-span-2"
        />
        <Textarea
          label="Description"
          rows={2}
          value={values.description}
          onChange={(e) =>
            setValues((v) => ({ ...v, description: e.target.value }))
          }
          className="sm:col-span-2"
        />
        <Textarea
          label="Notes"
          rows={2}
          value={values.notes}
          onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
          className="sm:col-span-2"
        />
      </div>

      {error ? <p className="mt-3 text-sm text-fti-red">{error}</p> : null}

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={saving} onClick={() => onSave(values)}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </Modal>
  );
}
