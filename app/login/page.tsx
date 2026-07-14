"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AUTH_INPUT_CLASS, AUTH_LABEL_CLASS, AuthCard } from "@/components/auth-card";
import { getBrowserSupabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const { error } = await getBrowserSupabase().auth.signInWithPassword({
        email: String(formData.get("email") ?? "").trim(),
        password: String(formData.get("password") ?? ""),
      });
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/projects");
      router.refresh();
    });
  }

  return (
    <AuthCard kicker="RFI LOG · SIGN IN" title="Sign in to your log">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className={AUTH_LABEL_CLASS}>
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@firm.com"
            className={AUTH_INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="login-password" className={AUTH_LABEL_CLASS}>
            Password
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className={AUTH_INPUT_CLASS}
          />
        </div>
        {error && (
          <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-[12.5px] text-danger">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-blueprint-dim px-4 py-2.5 text-[13.5px] font-semibold text-white hover:brightness-110 disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in →"}
        </button>
        <p className="pt-1 text-center text-[12.5px] text-muted">
          No account?{" "}
          <Link href="/signup" className="text-blueprint hover:underline">
            Create one →
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
