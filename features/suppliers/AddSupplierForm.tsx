"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import { Textarea } from "@/components/forms/Textarea";
import { Checkbox } from "@/components/forms/Checkbox";
import { SupplierHighlightSection } from "@/components/supplier/SupplierHighlightSection";
import { DataStatusBanner } from "@/components/ui/DataStatus";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants";
import { buildSupplierFromForm } from "@/lib/services/supplier.service";
import { useSupplierStore } from "@/hooks/SupplierStore";
import {
  createEmptyContactInput,
  INITIAL_SUPPLIER_FORM,
  type NewSupplierFormData,
  type SupplierContactInput,
} from "@/types/supplier";

const categoryOptions = Object.entries(PRODUCT_CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label }),
);

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && (
          <p className="mt-1 text-xs text-gray-400">{description}</p>
        )}
      </div>
      {children}
    </Card>
  );
}

export function AddSupplierForm() {
  const { addSupplier } = useSupplierStore();
  const [form, setForm] = useState<NewSupplierFormData>(INITIAL_SUPPLIER_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [savedName, setSavedName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function updateField<K extends keyof NewSupplierFormData>(
    key: K,
    value: NewSupplierFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateContact(
    index: number,
    key: keyof SupplierContactInput,
    value: SupplierContactInput[keyof SupplierContactInput],
  ) {
    setForm((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c, i) =>
        i === index ? { ...c, [key]: value } : c,
      ),
    }));
  }

  function addContact() {
    setForm((prev) => ({
      ...prev,
      contacts: [
        ...prev.contacts.map((c) => ({ ...c, isPrimary: false })),
        createEmptyContactInput(),
      ],
    }));
  }

  function removeContact(index: number) {
    setForm((prev) => ({
      ...prev,
      contacts:
        prev.contacts.length > 1
          ? prev.contacts.filter((_, i) => i !== index)
          : prev.contacts,
    }));
  }

  function setPrimaryContact(index: number) {
    setForm((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c, i) => ({
        ...c,
        isPrimary: i === index,
      })),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const supplier = buildSupplierFromForm(form);
      await addSupplier(supplier);
      setSavedName(
        form.factoryName.trim() || form.displayName.trim() || "New Supplier",
      );
      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to save supplier",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="page-shell">
        <Card padding="lg" className="mx-auto max-w-lg text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <h1 className="mt-4 text-xl font-semibold text-gray-900">
            Supplier registered
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            <span className="font-medium text-gray-800">{savedName}</span> has
            been added to your supplier directory.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="secondary" onClick={() => setSubmitted(false)}>
              Register another
            </Button>
            <Link href="/suppliers">
              <Button>View suppliers</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-header-block">
        <Link
          href="/suppliers"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to suppliers
        </Link>
        <h1 className="page-title">Register Supplier / Factory</h1>
        <p className="page-description">
          Create a factory master record — link products to avoid duplicate supplier data
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
        <SupplierHighlightSection
          factoryName={form.factoryName}
          provinceRegion={form.provinceRegion}
          cityDistrict={form.cityDistrict}
          onFactoryNameChange={(v) => updateField("factoryName", v)}
          onProvinceChange={(v) => updateField("provinceRegion", v)}
          onCityChange={(v) => updateField("cityDistrict", v)}
        />

        <FormSection
          title="Factory Details"
          description="Additional factory information"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Display Name"
              placeholder="Short name for lists"
              value={form.displayName}
              onChange={(e) => updateField("displayName", e.target.value)}
            />
            <Input
              label="Country"
              value={form.country}
              onChange={(e) => updateField("country", e.target.value)}
            />
            <div className="sm:col-span-2">
              <Input
                label="Full Address"
                value={form.fullAddress}
                onChange={(e) => updateField("fullAddress", e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Factory Location Note"
                placeholder="e.g. Near Guangzhou South Station"
                value={form.locationNote}
                onChange={(e) => updateField("locationNote", e.target.value)}
              />
            </div>
            <Input
              label="Website"
              type="url"
              value={form.website}
              onChange={(e) => updateField("website", e.target.value)}
            />
            <Input
              label="Alibaba / 1688 / Made-in-China"
              type="url"
              value={form.alibabaLink}
              onChange={(e) => updateField("alibabaLink", e.target.value)}
            />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Main Product Category
              </label>
              <select
                value={form.mainProductCategory}
                onChange={(e) =>
                  updateField("mainProductCategory", e.target.value)
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select category</option>
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.label}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
                Factory image / logo placeholder
              </div>
            </div>
            <div className="sm:col-span-2">
              <Textarea
                label="Notes"
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Contacts"
          description="Multiple contacts per supplier — mark one as primary"
        >
          <div className="space-y-6">
            {form.contacts.map((contact, index) => (
              <div
                key={index}
                className="rounded-xl border border-gray-100 bg-gray-50/50 p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Contact {index + 1}
                  </h3>
                  {form.contacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContact(index)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-fti-red"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Contact Name"
                    value={contact.contactName}
                    onChange={(e) =>
                      updateContact(index, "contactName", e.target.value)
                    }
                  />
                  <Input
                    label="Position"
                    value={contact.position}
                    onChange={(e) =>
                      updateContact(index, "position", e.target.value)
                    }
                  />
                  <Input
                    label="Sales Rep / Employee Code"
                    value={contact.salesRepCode}
                    onChange={(e) =>
                      updateContact(index, "salesRepCode", e.target.value)
                    }
                  />
                  <Input
                    label="WeChat ID"
                    value={contact.wechatId}
                    onChange={(e) =>
                      updateContact(index, "wechatId", e.target.value)
                    }
                  />
                  <Input
                    label="WhatsApp"
                    value={contact.whatsapp}
                    onChange={(e) =>
                      updateContact(index, "whatsapp", e.target.value)
                    }
                  />
                  <Input
                    label="Phone"
                    value={contact.phone}
                    onChange={(e) =>
                      updateContact(index, "phone", e.target.value)
                    }
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={contact.email}
                    onChange={(e) =>
                      updateContact(index, "email", e.target.value)
                    }
                  />
                  <Input
                    label="LINE"
                    value={contact.line}
                    onChange={(e) =>
                      updateContact(index, "line", e.target.value)
                    }
                  />
                  <div className="sm:col-span-2 flex flex-wrap gap-4">
                    <Checkbox
                      label="Primary contact"
                      checked={contact.isPrimary}
                      onChange={(v) => v && setPrimaryContact(index)}
                    />
                    <Checkbox
                      label="Active"
                      checked={contact.isActive}
                      onChange={(v) => updateContact(index, "isActive", v)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-xs text-gray-400">
                      Photo
                    </div>
                    <Textarea
                      label="Contact Notes"
                      value={contact.notes}
                      onChange={(e) =>
                        updateContact(index, "notes", e.target.value)
                      }
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={addContact}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add contact
            </Button>
          </div>
        </FormSection>

        <DataStatusBanner error={submitError} />

        <div className="flex justify-end gap-3 pb-8">
          <Link href="/suppliers">
            <Button type="button" variant="ghost" disabled={submitting}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save supplier"}
          </Button>
        </div>
      </form>
    </div>
  );
}
