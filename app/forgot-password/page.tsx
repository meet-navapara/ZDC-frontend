"use client";

import Link from "next/link";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { requestPasswordReset } from "@/lib/auth";
import { LIMITS } from "@/lib/limits";
import { toast } from "@/lib/toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mockOtp, setMockOtp] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await requestPasswordReset(email);
      setSent(true);
      setMockOtp(res.devOtp || res.mockOtp || null);
      toast.success(res.message);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh]">
      <AppHeader />
      <section className="mx-auto flex min-h-[100dvh] w-full max-w-md items-center px-4 pb-10 pt-24">
        <div className="w-full">
          <h1 className="font-display text-3xl font-semibold text-ink">
            Forgot password
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Enter your email and we&apos;ll send a 6-digit reset code.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </div>
            )}
            {sent && (
              <div className="rounded-xl border border-sage/30 bg-sage/10 px-4 py-3 text-sm text-sage-dark">
                If an account exists for that email, a reset code has been sent.
                {mockOtp && (
                  <p className="mt-2 font-mono text-xs">
                    Test mode code: <strong>{mockOtp}</strong>
                  </p>
                )}
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
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-sage py-3 font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-60"
            >
              {loading ? "Sending…" : sent ? "Resend code" : "Send reset code"}
            </button>
          </form>

          {sent && (
            <Link
              href={`/reset-password?email=${encodeURIComponent(email)}`}
              className="mt-6 block text-center text-sm font-semibold text-sage hover:text-sage-dark"
            >
              Enter reset code →
            </Link>
          )}

          <p className="mt-8 text-center text-sm text-ink-muted">
            <Link href="/login" className="font-semibold text-sage hover:text-sage-dark">
              Back to login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
