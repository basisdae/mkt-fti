"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "./AppShell";
import { AuthGate } from "./AuthGate";
import { AuthStoreProvider } from "@/hooks/AuthStore";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <AuthStoreProvider>
      <AuthGate>
        {isLoginPage ? <>{children}</> : <AppShell>{children}</AppShell>}
      </AuthGate>
    </AuthStoreProvider>
  );
}
