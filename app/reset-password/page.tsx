"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { resetPasswordWithCode } from "@/lib/auth";
import { LIMITS } from "@/lib/limits";
import { toast } from "@/lib/toast";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await resetPasswordWithCode({ email, code, password });
      toast.success(res.message);
      router.push("/login");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Reset failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[100dvh] w-full max-w-md items-center px-4 pb-10 pt-24">
      <div className="w-full">
        <h1 className="font-display text-3xl font-semibold text-ink">
          Reset password
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Enter the code from your email and choose a new password.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">
              Email
            </label>
            <input
              type="email"
              required
              maxLength={LIMITS.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink outline-none transition focus:border-sage dark:border-white/15 dark:bg-[#12100e]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">
              Reset code
            </label>
            <input
              type="text"
              required
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 font-mono tracking-widest text-ink outline-none transition focus:border-sage dark:border-white/15 dark:bg-[#12100e]"
              placeholder="6-digit code"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">
              New password
            </label>
            <input
              type="password"
              required
              minLength={8}
              maxLength={LIMITS.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink outline-none transition focus:border-sage dark:border-white/15 dark:bg-[#12100e]"
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">
              Confirm password
            </label>
            <input
              type="password"
              required
              maxLength={LIMITS.password}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink outline-none transition focus:border-sage dark:border-white/15 dark:bg-[#12100e]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-sage py-3 font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-60"
          >
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-ink-muted">
          <Link
            href="/forgot-password"
            className="font-semibold text-sage hover:text-sage-dark"
          >
            Request a new code
          </Link>
          {" · "}
          <Link href="/login" className="font-semibold text-sage hover:text-sage-dark">
            Login
          </Link>
        </p>
      </div>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-[100dvh]">
      <AppHeader />
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </main>
  );
}
