"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/AuthStore";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated && !isLoginPage) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [ready, isAuthenticated, isLoginPage, pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated && !isLoginPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-gray-500">
        Redirecting to login…
      </div>
    );
  }

  return <>{children}</>;
}
