"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/forms/Input";
import { useAuth } from "@/hooks/AuthStore";
import { APP_TAGLINE, APP_TITLE, APP_VERSION } from "@/lib/constants";

export function LoginForm() {
  const router = useRouter();
  const { login, isAuthenticated, ready } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && isAuthenticated) {
      router.replace("/");
    }
  }, [ready, isAuthenticated, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6">
      <Card className="w-full max-w-md" padding="lg" interactive>
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo.png"
            alt="MKT Headquarter"
            className="mx-auto mb-4 h-16 w-16 object-contain"
          />
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            {APP_TITLE}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{APP_TAGLINE}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            autoComplete="username"
            placeholder="you@fti.co.th"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <p className="text-sm font-medium text-fti-red">{error}</p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          No self-registration · Accounts are created by Admin
        </p>
      </Card>

      <p className="mt-6 text-center text-[11px] font-medium text-gray-400">
        {APP_VERSION}
      </p>
    </div>
  );
}
