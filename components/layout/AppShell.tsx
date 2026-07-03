"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import { AppFooter } from "./AppFooter";
import { PipelineStoreProvider } from "@/hooks/PipelineStore";
import { IdeaStoreProvider } from "@/hooks/IdeaStore";
import { ProductNotesStoreProvider } from "@/hooks/ProductNotesStore";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <PipelineStoreProvider>
      <IdeaStoreProvider>
      <ProductNotesStoreProvider>
      <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopHeader onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
        <AppFooter />
      </div>
    </div>
      </ProductNotesStoreProvider>
      </IdeaStoreProvider>
    </PipelineStoreProvider>
  );
}
