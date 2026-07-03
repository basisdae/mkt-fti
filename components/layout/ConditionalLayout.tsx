"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "./AppShell";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
