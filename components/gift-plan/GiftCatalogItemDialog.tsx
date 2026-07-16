"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";
import {
  GiftCatalogImageUpload,
  createEmptyGiftCatalogImageValue,
  createGiftCatalogImageValueFromRow,
  type GiftCatalogImageValue,
} from "@/components/gift-plan/GiftCatalogImageUpload";
import { GiftCatalogReferenceLink } from "@/components/gift-plan/GiftCatalogReferenceLink";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import {
  GIFT_ITEM_CATEGORY_LABELS,
  GIFT_ITEM_SOURCE_LABELS,
} from "@/lib/gift-plan-format";
import {
  GIFT_CATALOG_STATUS_LABELS,
  GIFT_CATALOG_OPERATIONAL_LABELS,
  GIFT_CATALOG_UNIT_OTHER,
  GIFT_CATALOG_UNIT_PRESETS,
} from "@/lib/gift-catalog-format";
import { isValidReferenceUrl } from "@/lib/gift-catalog-url";
import { resolveGiftCatalogImageUrl } from "@/lib/gift-catalog-display";
import {
  GIFT_ITEM_CATEGORIES,
  GIFT_ITEM_SOURCES,
} from "@/types/gift-plan";
import { GIFT_CATALOG_STATUSES, GIFT_CATALOG_OPERATIONAL_STATUSES } from "@/types/gift-catalog";
import type { GiftCatalogInput, GiftCatalogRow } from "@/types/gift-catalog";

export type GiftCatalogSavePayload = {
  values: GiftCatalogInput;
  image: GiftCatalogImageValue;
};

interface GiftCatalogItemDialogProps {
  open: boolean;
  initial?: GiftCatalogRow | null;
  saving?: boolean;
  uploadingImage?: boolean;
  error?: string | null;
  onCancel: () => void;
  onSave: (payload: GiftCatalogSavePayload) => void;
}

const emptyValues: GiftCatalogInput = {
  gift_name: "",
  internal_code: null,
  category: "other",
  source: "other",
  description: "",
  image_url: null,
  image_path: null,
  unit: "piece",
  default_actual_cost: 0,
  default_estimated_gift_value: 0,
  supplier_name: null,
  specification: "",
  notes: "",
  status: "active",
  reference_url: null,
  operational_status: "interested",
};

function isPresetUnit(unit: string): boolean {
  return GIFT_CATALOG_UNIT_PRESETS.some(
    (p) => p.value !== GIFT_CATALOG_UNIT_OTHER && p.value === unit,
  );
}

export function GiftCatalogItemDialog({
  open,
  initial,
  saving,
  uploadingImage,
  error,
  onCancel,
  onSave,
}: GiftCatalogItemDialogProps) {
  const [values, setValues] = useState<GiftCatalogInput>(emptyValues);
  const [image, setImage] = useState<GiftCatalogImageValue>(
    createEmptyGiftCatalogImageValue(),
  );
  const [unitPreset, setUnitPreset] = useState("piece");
  const [customUnit, setCustomUnit] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      const unit = initial.unit || "piece";
      const preset = isPresetUnit(unit) ? unit : GIFT_CATALOG_UNIT_OTHER;
      setValues({
        gift_name: initial.gift_name,
        internal_code: initial.internal_code,
        category: initial.category,
        source: initial.source,
        description: initial.description,
        image_url: initial.image_url,
        image_path: initial.image_path,
        unit,
        default_actual_cost: Number(initial.default_actual_cost),
        default_estimated_gift_value: Number(initial.default_estimated_gift_value),
        supplier_name: initial.supplier_name,
        specification: initial.specification,
        notes: initial.notes,
        status: initial.status,
        reference_url: initial.reference_url,
        operational_status: initial.operational_status ?? "interested",
      });
      setUnitPreset(preset);
      setCustomUnit(preset === GIFT_CATALOG_UNIT_OTHER ? unit : "");
      setImage(
        createGiftCatalogImageValueFromRow(resolveGiftCatalogImageUrl(initial)),
      );
    } else {
      setValues(emptyValues);
      setUnitPreset("piece");
      setCustomUnit("");
      setImage(createEmptyGiftCatalogImageValue());
    }
  }, [open, initial]);

  function resolvedUnit(): string {
    if (unitPreset === GIFT_CATALOG_UNIT_OTHER) {
      return customUnit.trim() || "other";
    }
    return unitPreset;
  }

  function handleSaveClick() {
    if (!isValidReferenceUrl(values.reference_url)) {
      setUrlError(t.referenceUrlInvalid);
      return;
    }
    setUrlError(null);
    onSave({
      values: { ...values, unit: resolvedUnit() },
      image,
    });
  }

  const busy = saving || uploadingImage;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={initial ? t.editCatalogItem : t.addCatalogItem}
      className="max-w-2xl"
    >
      <div className="space-y-5">
        <GiftCatalogImageUpload
          value={image}
          onChange={setImage}
          uploading={uploadingImage}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label={t.giftName}
            value={values.gift_name}
            onChange={(e) =>
              setValues((v) => ({ ...v, gift_name: e.target.value }))
            }
            className="sm:col-span-2"
          />
          <Input
            label={t.internalCode}
            value={values.internal_code ?? ""}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                internal_code: e.target.value || null,
              }))
            }
          />
          <Select
            label={t.category}
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
            label={t.source}
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
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t.sectionPricing}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label={t.unit}
              value={unitPreset}
              onChange={(e) => setUnitPreset(e.target.value)}
              options={GIFT_CATALOG_UNIT_PRESETS.map((u) => ({
                value: u.value,
                label: u.label,
              }))}
            />
            {unitPreset === GIFT_CATALOG_UNIT_OTHER ? (
              <Input
                label={t.unitOther}
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
              />
            ) : (
              <div className="hidden sm:block" />
            )}
            <div>
              <Input
                label={t.defaultActualCost}
                type="number"
                value={String(values.default_actual_cost)}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    default_actual_cost: Number(e.target.value) || 0,
                  }))
                }
              />
              <p className="mt-1 text-[11px] text-gray-500">
                {t.defaultActualCostHint}
              </p>
            </div>
            <div>
              <Input
                label={t.defaultEstValue}
                type="number"
                value={String(values.default_estimated_gift_value)}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    default_estimated_gift_value: Number(e.target.value) || 0,
                  }))
                }
              />
              <p className="mt-1 text-[11px] text-gray-500">
                {t.defaultEstValueHint}
              </p>
            </div>
            <Input
              label={t.supplierName}
              value={values.supplier_name ?? ""}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  supplier_name: e.target.value || null,
                }))
              }
              className="sm:col-span-2"
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t.sectionDetails}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label={t.referenceUrl}
              value={values.reference_url ?? ""}
              placeholder={t.referenceUrlPlaceholder}
              onChange={(e) => {
                setUrlError(null);
                setValues((v) => ({
                  ...v,
                  reference_url: e.target.value || null,
                }));
              }}
              className="sm:col-span-2"
            />
            <p className="sm:col-span-2 -mt-1 text-[11px] text-gray-500">
              {t.referenceUrlHint}
            </p>
            {urlError ? (
              <p className="sm:col-span-2 text-xs text-fti-red">{urlError}</p>
            ) : null}
            {values.reference_url?.trim() ? (
              <div className="sm:col-span-2">
                <GiftCatalogReferenceLink url={values.reference_url} />
              </div>
            ) : null}
            <Textarea
              label={t.specification}
              rows={2}
              value={values.specification}
              onChange={(e) =>
                setValues((v) => ({ ...v, specification: e.target.value }))
              }
              className="sm:col-span-2"
            />
            <Textarea
              label={t.description}
              rows={2}
              value={values.description}
              onChange={(e) =>
                setValues((v) => ({ ...v, description: e.target.value }))
              }
              className="sm:col-span-2"
            />
            <Textarea
              label={t.notes}
              rows={2}
              value={values.notes}
              onChange={(e) =>
                setValues((v) => ({ ...v, notes: e.target.value }))
              }
              className="sm:col-span-2"
            />
            <Select
              label={t.recordStatus}
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
            <Select
              label={t.operationalStatus}
              value={values.operational_status}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  operational_status: e.target
                    .value as GiftCatalogInput["operational_status"],
                }))
              }
              options={GIFT_CATALOG_OPERATIONAL_STATUSES.map((value) => ({
                value,
                label: GIFT_CATALOG_OPERATIONAL_LABELS[value],
              }))}
            />
          </div>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-fti-red">{error}</p> : null}

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          {t.cancel}
        </Button>
        <Button disabled={busy} onClick={handleSaveClick}>
          {busy ? t.saving : t.save}
        </Button>
      </div>
    </Modal>
  );
}
