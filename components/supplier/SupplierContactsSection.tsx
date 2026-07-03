"use client";

import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SupplierContactCard } from "@/components/supplier/SupplierContactCard";
import { EditContactModal } from "@/components/supplier/EditContactModal";
import { useSupplierStore } from "@/hooks/SupplierStore";
import { getPrimaryContact } from "@/lib/supplier";
import type { Supplier, SupplierContactInput } from "@/types/supplier";

interface SupplierContactsSectionProps {
  supplierId: string;
  initialContacts: Supplier["contacts"];
}

export function SupplierContactsSection({
  supplierId,
  initialContacts,
}: SupplierContactsSectionProps) {
  const { getSupplier, updateContact, setPrimaryContact, addContact } =
    useSupplierStore();
  const [addOpen, setAddOpen] = useState(false);

  const supplier = getSupplier(supplierId);
  const contacts = supplier?.contacts ?? initialContacts;
  const primary = supplier
    ? getPrimaryContact(supplier)
    : contacts.find((c) => c.isPrimary && c.isActive) ??
      contacts.find((c) => c.isActive);

  function handleEdit(contactId: string, input: SupplierContactInput) {
    updateContact(supplierId, contactId, input);
  }

  function handleAdd(input: SupplierContactInput) {
    addContact(supplierId, input);
    setAddOpen(false);
  }

  const sorted = [...contacts].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return a.contactName.localeCompare(b.contactName);
  });

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Contact List
            </h2>
            <p className="text-xs text-gray-500">
              {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
              {primary
                ? ` · Primary: ${primary.contactName}`
                : " · No primary set"}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-1.5"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add contact
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sorted.map((contact) => (
          <SupplierContactCard
            key={contact.id}
            contact={contact}
            onEdit={handleEdit}
            onSetPrimary={(id) => setPrimaryContact(supplierId, id)}
          />
        ))}
      </div>

      <EditContactModal
        open={addOpen}
        contact={null}
        onClose={() => setAddOpen(false)}
        onSave={handleAdd}
      />
    </section>
  );
}
