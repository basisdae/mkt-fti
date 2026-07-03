"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import { Textarea } from "@/components/forms/Textarea";
import { Checkbox } from "@/components/forms/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { createEmptyContactInput } from "@/types/supplier";
import type { SupplierContact, SupplierContactInput } from "@/types/supplier";

interface EditContactModalProps {
  open: boolean;
  contact: SupplierContact | null;
  onClose: () => void;
  onSave: (input: SupplierContactInput) => void;
}

export function EditContactModal({
  open,
  contact,
  onClose,
  onSave,
}: EditContactModalProps) {
  const [form, setForm] = useState<SupplierContactInput>(createEmptyContactInput());

  useEffect(() => {
    if (!open) return;
    if (contact) {
      setForm({
        contactName: contact.contactName,
        position: contact.position,
        salesRepCode: contact.salesRepCode,
        wechatId: contact.wechatId,
        whatsapp: contact.whatsapp,
        phone: contact.phone,
        email: contact.email,
        line: contact.line,
        isPrimary: contact.isPrimary,
        isActive: contact.isActive,
        notes: contact.notes,
      });
    } else {
      setForm({ ...createEmptyContactInput(), isPrimary: false });
    }
  }, [contact, open]);

  function updateField<K extends keyof SupplierContactInput>(
    key: K,
    value: SupplierContactInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={contact ? "Edit Contact" : "Add Contact"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          value={form.contactName}
          onChange={(e) => updateField("contactName", e.target.value)}
          placeholder="Contact name"
        />
        <Input
          label="Position"
          value={form.position}
          onChange={(e) => updateField("position", e.target.value)}
          placeholder="e.g. Sales Manager"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="WeChat ID"
            value={form.wechatId}
            onChange={(e) => updateField("wechatId", e.target.value)}
          />
          <Input
            label="Employee Code"
            value={form.salesRepCode}
            onChange={(e) => updateField("salesRepCode", e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
        </div>
        <Textarea
          label="Notes"
          rows={3}
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
        />
        <Checkbox
          label="Active contact"
          description="Inactive contacts are hidden from primary selection"
          checked={form.isActive}
          onChange={(v) => updateField("isActive", v)}
        />
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </Modal>
  );
}
