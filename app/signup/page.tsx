"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AUTH_INPUT_CLASS, AUTH_LABEL_CLASS, AuthCard } from "@/components/auth-card";
import { getBrowserSupabase } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const { data, error } = await getBrowserSupabase().auth.signUp({
        email: String(formData.get("email") ?? "").trim(),
        password: String(formData.get("password") ?? ""),
      });
      if (error) {
        setError(error.message);
        return;
      }
      // With email confirmation enabled, signUp returns no session — the user
      // must confirm before signing in. With it disabled, go straight in.
      if (data.session) {
        router.push("/projects");
        router.refresh();
      } else {
        setConfirmEmail(true);
      }
    });
  }

  return (
    <AuthCard kicker="RFI LOG · CREATE ACCOUNT" title="Create your account">
      {confirmEmail ? (
        <div>
          <p className="rounded-md border border-success/40 bg-success/10 px-3 py-2.5 text-[13px] leading-relaxed text-success">
            Account created. Check your email to confirm it, then sign in.
          </p>
          <Link
            href="/login"
            className="mt-4 block w-full rounded-md bg-blueprint-dim px-4 py-2.5 text-center text-[13.5px] font-semibold text-white hover:brightness-110"
          >
            Go to sign in →
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="signup-email" className={AUTH_LABEL_CLASS}>
              Email
            </label>
            <input
              id="signup-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@firm.com"
              className={AUTH_INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="signup-password" className={AUTH_LABEL_CLASS}>
              Password
            </label>
            <input
              id="signup-password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="At least 6 characters"
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
            {pending ? "Creating account…" : "Create account →"}
          </button>
          <p className="pt-1 text-center text-[12.5px] text-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-blueprint hover:underline">
              Sign in →
            </Link>
          </p>
        </form>
      )}
    </AuthCard>
  );
}
