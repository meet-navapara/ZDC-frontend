"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { apiPost } from "@/lib/api";
import { saveAuth, type AuthUser } from "@/lib/auth";
import { LIMITS } from "@/lib/limits";

type AuthResponse = { token: string; user: AuthUser };

export default function BusinessLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiPost<AuthResponse>("/api/auth/login", {
        email,
        password,
      });
      if (res.user.role !== "b2b") {
        setError(
          "This login is for business accounts. Use the main login instead."
        );
        setLoading(false);
        return;
      }
      saveAuth(res.token, res.user);
      router.push("/business");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh]">
      <AppHeader />
      <section className="mx-auto flex min-h-[100dvh] w-full max-w-6xl items-center px-4 pb-10 pt-24 sm:px-6 sm:pt-28">
        <div className="grid w-full items-center gap-10 md:grid-cols-2 md:gap-12">
          <div className="mx-auto w-full max-w-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sage">
              For Business
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
              Studio login
            </h1>
            <p className="mt-2 text-ink-muted">
              Manage your catalog, credits, and try-ons.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              {error && (
                <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
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
                  className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink outline-none transition focus:border-sage"
                  placeholder="studio@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">
                  Password
                </label>
                <input
                  type="password"
                  required
                  maxLength={LIMITS.password}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink outline-none transition focus:border-sage"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-sage py-3 font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-60"
              >
                {loading ? "Logging in…" : "Log in"}
              </button>
            </form>

            <p className="mt-6 text-sm text-ink-muted">
              New business?{" "}
              <Link
                href="/business/register"
                className="font-semibold text-sage hover:text-sage-dark"
              >
                Create an account
              </Link>
            </p>
          </div>

          <div className="card hidden overflow-hidden rounded-[2rem] md:block">
            <div className="relative aspect-[3/4] w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/streetwear.png"
                alt="ZDC for business"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
