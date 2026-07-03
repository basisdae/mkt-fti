"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createSupplierContact } from "@/lib/supplier-builder";
import {
  addSupplierContact,
  createSupplier,
  deleteSupplier as deleteSupplierRecord,
  listSuppliers,
  setSupplierPrimaryContact,
  updateSupplier as updateSupplierRecord,
  updateSupplierContact,
} from "@/lib/services/suppliers";
import type {
  Supplier,
  SupplierContact,
  SupplierContactInput,
} from "@/types/supplier";

interface SupplierStoreValue {
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
  /** True after the initial Supabase fetch attempt completes. */
  hydrated: boolean;
  getSupplier: (id: string) => Supplier | undefined;
  addSupplier: (supplier: Supplier) => Promise<void>;
  updateSupplier: (supplierId: string, patch: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (supplierId: string) => Promise<void>;
  updateContact: (
    supplierId: string,
    contactId: string,
    input: SupplierContactInput,
  ) => Promise<void>;
  setPrimaryContact: (supplierId: string, contactId: string) => Promise<void>;
  addContact: (supplierId: string, input: SupplierContactInput) => Promise<void>;
  clearError: () => void;
}

const SupplierStoreContext = createContext<SupplierStoreValue | null>(null);

function touchSupplier(supplier: Supplier): Supplier {
  return { ...supplier, updatedAt: new Date().toISOString() };
}

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function SupplierStoreProvider({ children }: { children: ReactNode }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await listSuppliers();
        if (!cancelled) {
          setSuppliers(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(toErrorMessage(err, "Failed to load suppliers"));
          setSuppliers([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setHydrated(true);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getSupplier = useCallback(
    (id: string) => suppliers.find((s) => s.id === id),
    [suppliers],
  );

  const addSupplier = useCallback(async (supplier: Supplier) => {
    setSuppliers((prev) => [supplier, ...prev]);

    try {
      await createSupplier(supplier);
      setError(null);
    } catch (err) {
      setSuppliers((prev) => prev.filter((s) => s.id !== supplier.id));
      const message = toErrorMessage(err, "Failed to save supplier");
      setError(message);
      throw new Error(message);
    }
  }, []);

  const updateSupplier = useCallback(
    async (supplierId: string, patch: Partial<Supplier>) => {
      let snapshot: Supplier[] = [];

      setSuppliers((prev) => {
        snapshot = prev;
        return prev.map((supplier) =>
          supplier.id === supplierId
            ? touchSupplier({ ...supplier, ...patch })
            : supplier,
        );
      });

      try {
        await updateSupplierRecord(supplierId, patch);
        setError(null);
      } catch (err) {
        setSuppliers(snapshot);
        setError(toErrorMessage(err, "Failed to update supplier"));
      }
    },
    [],
  );

  const deleteSupplier = useCallback(async (supplierId: string) => {
    let snapshot: Supplier[] = [];

    setSuppliers((prev) => {
      snapshot = prev;
      return prev.filter((supplier) => supplier.id !== supplierId);
    });

    try {
      await deleteSupplierRecord(supplierId);
      setError(null);
    } catch (err) {
      setSuppliers(snapshot);
      setError(toErrorMessage(err, "Failed to delete supplier"));
    }
  }, []);

  const updateContact = useCallback(
    async (
      supplierId: string,
      contactId: string,
      input: SupplierContactInput,
    ) => {
      let snapshot: Supplier[] = [];

      setSuppliers((prev) => {
        snapshot = prev;
        return prev.map((supplier) => {
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
        });
      });

      try {
        await updateSupplierContact(supplierId, contactId, input);
        setError(null);
      } catch (err) {
        setSuppliers(snapshot);
        setError(toErrorMessage(err, "Failed to update contact"));
      }
    },
    [],
  );

  const setPrimaryContact = useCallback(
    async (supplierId: string, contactId: string) => {
      let snapshot: Supplier[] = [];

      setSuppliers((prev) => {
        snapshot = prev;
        return prev.map((supplier) => {
          if (supplier.id !== supplierId) return supplier;
          return touchSupplier({
            ...supplier,
            contacts: supplier.contacts.map((contact) => ({
              ...contact,
              isPrimary: contact.id === contactId,
            })),
          });
        });
      });

      try {
        await setSupplierPrimaryContact(supplierId, contactId);
        setError(null);
      } catch (err) {
        setSuppliers(snapshot);
        setError(toErrorMessage(err, "Failed to set primary contact"));
      }
    },
    [],
  );

  const addContact = useCallback(
    async (supplierId: string, input: SupplierContactInput) => {
      const newId = `${supplierId}-contact-${Date.now()}`;
      const contact = createSupplierContact(newId, input);
      let snapshot: Supplier[] = [];

      setSuppliers((prev) => {
        snapshot = prev;
        return prev.map((supplier) => {
          if (supplier.id !== supplierId) return supplier;
          const contacts = input.isPrimary
            ? supplier.contacts.map((c) => ({ ...c, isPrimary: false }))
            : [...supplier.contacts];
          return touchSupplier({
            ...supplier,
            contacts: [...contacts, contact],
          });
        });
      });

      try {
        await addSupplierContact(supplierId, newId, input);
        setError(null);
      } catch (err) {
        setSuppliers(snapshot);
        setError(toErrorMessage(err, "Failed to add contact"));
      }
    },
    [],
  );

  const value = useMemo(
    (): SupplierStoreValue => ({
      suppliers,
      loading,
      error,
      hydrated,
      getSupplier,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      updateContact,
      setPrimaryContact,
      addContact,
      clearError,
    }),
    [
      suppliers,
      loading,
      error,
      hydrated,
      getSupplier,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      updateContact,
      setPrimaryContact,
      addContact,
      clearError,
    ],
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
