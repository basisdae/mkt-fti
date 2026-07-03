"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  filterNotesByType,
  type ProductNoteTypeFilter,
} from "@/lib/product-notes";
import { generateId } from "@/lib/generate-id";
import { localNoteRepository } from "@/lib/repositories";
import type { ProductNote, ProductNoteAttachment } from "@/types/product";

interface AddProductNoteInput {
  productId: string;
  type: ProductNote["type"];
  title: string;
  body: string;
  author?: string;
  attachments?: ProductNoteAttachment[];
}

interface ProductNotesStoreValue {
  notes: ProductNote[];
  getNotesForProduct: (
    productId: string,
    typeFilter?: ProductNoteTypeFilter,
  ) => ProductNote[];
  addNote: (input: AddProductNoteInput) => ProductNote;
  noteCountForProduct: (productId: string) => number;
}

const ProductNotesStoreContext = createContext<ProductNotesStoreValue | null>(
  null,
);

export function ProductNotesStoreProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<ProductNote[]>(() =>
    localNoteRepository.listInitial(),
  );

  const getNotesForProduct = useCallback(
    (productId: string, typeFilter: ProductNoteTypeFilter = "all") => {
      const productNotes = notes.filter((n) => n.productId === productId);
      return filterNotesByType(productNotes, typeFilter).sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    },
    [notes],
  );

  const noteCountForProduct = useCallback(
    (productId: string) => notes.filter((n) => n.productId === productId).length,
    [notes],
  );

  const addNote = useCallback((input: AddProductNoteInput): ProductNote => {
    const now = new Date().toISOString();
    const note: ProductNote = {
      id: generateId(),
      productId: input.productId,
      type: input.type,
      title: input.title.trim(),
      body: input.body.trim(),
      author: input.author ?? "You",
      createdAt: now,
      updatedAt: now,
      attachments: input.attachments ?? [],
    };

    setNotes((prev) => [note, ...prev]);
    return note;
  }, []);

  const value = useMemo(
    (): ProductNotesStoreValue => ({
      notes,
      getNotesForProduct,
      addNote,
      noteCountForProduct,
    }),
    [notes, getNotesForProduct, addNote, noteCountForProduct],
  );

  return (
    <ProductNotesStoreContext.Provider value={value}>
      {children}
    </ProductNotesStoreContext.Provider>
  );
}

export function useProductNotesStore(): ProductNotesStoreValue {
  const ctx = useContext(ProductNotesStoreContext);
  if (!ctx) {
    throw new Error(
      "useProductNotesStore must be used within ProductNotesStoreProvider",
    );
  }
  return ctx;
}
