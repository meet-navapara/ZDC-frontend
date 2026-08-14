"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import { saveAuth, type AuthUser } from "@/lib/auth";
import { LIMITS } from "@/lib/limits";

type AuthResponse = { token: string; user: AuthUser };

export default function AdminLoginPage() {
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
      if (res.user.role !== "admin") {
        setError("This login is for platform administrators only.");
        setLoading(false);
        return;
      }
      saveAuth(res.token, res.user);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-ink px-4 py-10 sm:px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sage">
            <span className="h-4 w-4 rounded-full bg-paper" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold text-paper">
            Zimji HQ
          </h1>
          <p className="mt-1 text-sm text-paper/60">Super Admin Console</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
        >
          {error && (
            <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-paper/80">
              Email
            </label>
            <input
              type="email"
              required
              maxLength={LIMITS.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-ink/40 px-4 py-3 text-paper outline-none transition placeholder:text-paper/30 focus:border-sage"
              placeholder="admin@zimji.app"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-paper/80">
              Password
            </label>
            <input
              type="password"
              required
              maxLength={LIMITS.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-ink/40 px-4 py-3 text-paper outline-none transition placeholder:text-paper/30 focus:border-sage"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-sage py-3 font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
