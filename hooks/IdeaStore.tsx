"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { buildProductFromIdea } from "@/lib/idea";
import { IDEA_SEEDS } from "@/lib/idea-seed";
import { usePipelineStore } from "@/hooks/PipelineStore";
import type { IdeaStatus, NewIdeaInput, ProductIdea } from "@/types/idea";

interface IdeaStoreValue {
  ideas: ProductIdea[];
  addIdea: (input: NewIdeaInput) => ProductIdea;
  updateIdeaStatus: (ideaId: string, status: IdeaStatus) => void;
  convertToProduct: (ideaId: string) => string | null;
}

const IdeaStoreContext = createContext<IdeaStoreValue | null>(null);

export function IdeaStoreProvider({ children }: { children: ReactNode }) {
  const { addProduct } = usePipelineStore();
  const [ideas, setIdeas] = useState<ProductIdea[]>(() =>
    [...IDEA_SEEDS].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    ),
  );

  const addIdea = useCallback((input: NewIdeaInput): ProductIdea => {
    const now = new Date().toISOString();
    const idea: ProductIdea = {
      id: `idea-${Date.now()}`,
      ...input,
      imageUrl: null,
      status: "interested",
      convertedProductId: null,
      createdAt: now,
      updatedAt: now,
    };
    setIdeas((prev) => [idea, ...prev]);
    return idea;
  }, []);

  const updateIdeaStatus = useCallback((ideaId: string, status: IdeaStatus) => {
    const now = new Date().toISOString();
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === ideaId && idea.status !== "converted"
          ? { ...idea, status, updatedAt: now }
          : idea,
      ),
    );
  }, []);

  const convertToProduct = useCallback(
    (ideaId: string): string | null => {
      const idea = ideas.find((i) => i.id === ideaId);
      if (!idea || idea.status === "converted") return null;

      const bundle = buildProductFromIdea(idea);
      const productId = addProduct(bundle);
      const now = new Date().toISOString();

      setIdeas((prev) =>
        prev.map((i) =>
          i.id === ideaId
            ? {
                ...i,
                status: "converted" as const,
                convertedProductId: productId,
                updatedAt: now,
              }
            : i,
        ),
      );

      return productId;
    },
    [ideas, addProduct],
  );

  const value = useMemo(
    (): IdeaStoreValue => ({
      ideas,
      addIdea,
      updateIdeaStatus,
      convertToProduct,
    }),
    [ideas, addIdea, updateIdeaStatus, convertToProduct],
  );

  return (
    <IdeaStoreContext.Provider value={value}>
      {children}
    </IdeaStoreContext.Provider>
  );
}

export function useIdeaStore(): IdeaStoreValue {
  const ctx = useContext(IdeaStoreContext);
  if (!ctx) {
    throw new Error("useIdeaStore must be used within IdeaStoreProvider");
  }
  return ctx;
}
