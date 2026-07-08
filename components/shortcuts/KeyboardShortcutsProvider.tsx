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
import { usePathname, useRouter } from "next/navigation";
import { ShortcutHelpDialog } from "@/components/shortcuts/ShortcutHelpDialog";
import { useAuth } from "@/hooks/AuthStore";
import { useLiveProducts } from "@/hooks/PipelineStore";
import { canCreateProducts } from "@/lib/auth/permissions";
import { isModKey, isTypingTarget } from "@/lib/keyboard-shortcuts";

interface KeyboardShortcutsContextValue {
  openPalette: boolean;
  setOpenPalette: (open: boolean) => void;
  openHelp: boolean;
  setOpenHelp: (open: boolean) => void;
}

const KeyboardShortcutsContext =
  createContext<KeyboardShortcutsContextValue | null>(null);

export function useKeyboardShortcuts(): KeyboardShortcutsContextValue {
  const ctx = useContext(KeyboardShortcutsContext);
  if (!ctx) {
    throw new Error(
      "useKeyboardShortcuts must be used within KeyboardShortcutsProvider",
    );
  }
  return ctx;
}

/** Optional hook when provider may be absent (e.g. login). */
export function useKeyboardShortcutsOptional(): KeyboardShortcutsContextValue | null {
  return useContext(KeyboardShortcutsContext);
}

interface KeyboardShortcutsProviderProps {
  children: ReactNode;
}

export function KeyboardShortcutsProvider({
  children,
}: KeyboardShortcutsProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const products = useLiveProducts();
  const [openPalette, setOpenPalette] = useState(false);
  const [openHelp, setOpenHelp] = useState(false);

  const productNav = useMemo(() => {
    const match = pathname.match(/^\/products\/([^/]+)(?:\/(edit|spec))?\/?$/);
    if (!match) return null;
    const currentId = match[1]!;
    if (currentId === "new" || currentId === "import") return null;
    const index = products.findIndex((product) => product.id === currentId);
    if (index < 0) return null;
    const suffix = match[2] ? `/${match[2]}` : "";
    return {
      prevId: products[index - 1]?.id ?? null,
      nextId: products[index + 1]?.id ?? null,
      suffix,
    };
  }, [pathname, products]);

  const closeTopDialog = useCallback(() => {
    if (openHelp) {
      setOpenHelp(false);
      return true;
    }
    if (openPalette) {
      setOpenPalette(false);
      return true;
    }
    // Close any dialog that exposes a cancel/close control
    const dialogs = document.querySelectorAll<HTMLElement>(
      '[role="dialog"][aria-modal="true"]',
    );
    const top = dialogs[dialogs.length - 1];
    if (!top) return false;
    const closer =
      top.querySelector<HTMLElement>("[data-shortcut-close]") ||
      top.querySelector<HTMLElement>('button[aria-label="Close"]') ||
      Array.from(top.querySelectorAll("button")).find((button) =>
        /^(cancel|close|ปิด|ยกเลิก)$/i.test(
          (button.textContent ?? "").trim(),
        ),
      );
    if (closer) {
      closer.click();
      return true;
    }
    return false;
  }, [openHelp, openPalette]);

  useEffect(() => {
    if (pathname === "/login") return;

    function onKeyDown(event: KeyboardEvent) {
      const key = event.key;

      if ((event.metaKey || event.ctrlKey) && key.toLowerCase() === "k") {
        event.preventDefault();
        setOpenPalette(true);
        setOpenHelp(false);
        return;
      }

      if (key === "Escape") {
        if (closeTopDialog()) {
          event.preventDefault();
        }
        return;
      }

      // Palette / help own their own keys; don't fire page shortcuts underneath.
      if (openHelp || openPalette) return;

      if (isTypingTarget(event.target) || isModKey(event)) return;

      if (key === "?" || (event.shiftKey && key === "/")) {
        event.preventDefault();
        setOpenHelp(true);
        return;
      }

      if (
        key.toLowerCase() === "n" &&
        !event.shiftKey &&
        canCreateProducts(user)
      ) {
        event.preventDefault();
        router.push("/products/new");
        return;
      }

      if (key.toLowerCase() === "s" && !event.shiftKey) {
        const form = document.getElementById(
          "create-product-form",
        ) as HTMLFormElement | null;
        if (form) {
          event.preventDefault();
          window.dispatchEvent(new Event("mkt-hq:shortcut-save"));
          if (typeof form.requestSubmit === "function") {
            form.requestSubmit();
          } else {
            form.dispatchEvent(
              new Event("submit", { bubbles: true, cancelable: true }),
            );
          }
        }
        return;
      }

      if (key === "ArrowLeft" && productNav?.prevId) {
        event.preventDefault();
        router.push(`/products/${productNav.prevId}${productNav.suffix}`);
        return;
      }

      if (key === "ArrowRight" && productNav?.nextId) {
        event.preventDefault();
        router.push(`/products/${productNav.nextId}${productNav.suffix}`);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    pathname,
    user,
    router,
    productNav,
    closeTopDialog,
    openHelp,
    openPalette,
  ]);

  const value = useMemo(
    () => ({
      openPalette,
      setOpenPalette,
      openHelp,
      setOpenHelp,
    }),
    [openPalette, openHelp],
  );

  return (
    <KeyboardShortcutsContext.Provider value={value}>
      {children}
      <ShortcutHelpDialog
        open={openHelp}
        onClose={() => setOpenHelp(false)}
      />
    </KeyboardShortcutsContext.Provider>
  );
}
