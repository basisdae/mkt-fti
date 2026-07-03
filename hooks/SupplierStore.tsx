"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createSupplierContact } from "@/lib/supplier-builder";
import { SUPPLIER_SEEDS } from "@/lib/supplier-seed";
import type {
  Supplier,
  SupplierContact,
  SupplierContactInput,
} from "@/types/supplier";

interface SupplierStoreValue {
  suppliers: Supplier[];
  getSupplier: (id: string) => Supplier | undefined;
  updateContact: (
    supplierId: string,
    contactId: string,
    input: SupplierContactInput,
  ) => void;
  setPrimaryContact: (supplierId: string, contactId: string) => void;
  addContact: (supplierId: string, input: SupplierContactInput) => void;
}

const SupplierStoreContext = createContext<SupplierStoreValue | null>(null);

function touchSupplier(supplier: Supplier): Supplier {
  return { ...supplier, updatedAt: new Date().toISOString() };
}

export function SupplierStoreProvider({ children }: { children: ReactNode }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(() =>
    SUPPLIER_SEEDS.map((s) => ({ ...s, contacts: [...s.contacts] })),
  );

  const getSupplier = useCallback(
    (id: string) => suppliers.find((s) => s.id === id),
    [suppliers],
  );

  const updateContact = useCallback(
    (supplierId: string, contactId: string, input: SupplierContactInput) => {
      setSuppliers((prev) =>
        prev.map((supplier) => {
          if (supplier.id !== supplierId) return supplier;
          return touchSupplier({
            ...supplier,
            contacts: supplier.contacts.map((contact) =>
              contact.id === contactId
                ? {
                    ...contact,
                    contactName: input.contactName,
                    position: input.position,
                    salesRepCode: input.salesRepCode,
                    wechatId: input.wechatId,
                    whatsapp: input.whatsapp,
                    phone: input.phone,
                    email: input.email,
                    line: input.line,
                    isPrimary: input.isPrimary,
                    isActive: input.isActive,
                    notes: input.notes,
                  }
                : contact,
            ),
          });
        }),
      );
    },
    [],
  );

  const setPrimaryContact = useCallback(
    (supplierId: string, contactId: string) => {
      setSuppliers((prev) =>
        prev.map((supplier) => {
          if (supplier.id !== supplierId) return supplier;
          return touchSupplier({
            ...supplier,
            contacts: supplier.contacts.map((contact) => ({
              ...contact,
              isPrimary: contact.id === contactId,
            })),
          });
        }),
      );
    },
    [],
  );

  const addContact = useCallback(
    (supplierId: string, input: SupplierContactInput) => {
      setSuppliers((prev) =>
        prev.map((supplier) => {
          if (supplier.id !== supplierId) return supplier;
          const newId = `${supplierId}-contact-${Date.now()}`;
          const contact = createSupplierContact(newId, input);
          const contacts = input.isPrimary
            ? supplier.contacts.map((c) => ({ ...c, isPrimary: false }))
            : [...supplier.contacts];
          return touchSupplier({
            ...supplier,
            contacts: [...contacts, contact],
          });
        }),
      );
    },
    [],
  );

  const value = useMemo(
    (): SupplierStoreValue => ({
      suppliers,
      getSupplier,
      updateContact,
      setPrimaryContact,
      addContact,
    }),
    [suppliers, getSupplier, updateContact, setPrimaryContact, addContact],
  );

  return (
    <SupplierStoreContext.Provider value={value}>
      {children}
    </SupplierStoreContext.Provider>
  );
}

export function useSupplierStore(): SupplierStoreValue {
  const ctx = useContext(SupplierStoreContext);
  if (!ctx) {
    throw new Error("useSupplierStore must be used within SupplierStoreProvider");
  }
  return ctx;
}

export function contactToInput(contact: SupplierContact): SupplierContactInput {
  return {
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
  };
}
