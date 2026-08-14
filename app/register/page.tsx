"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { apiPost } from "@/lib/api";
import { saveAuth, type AuthUser } from "@/lib/auth";
import { LIMITS } from "@/lib/limits";

type AuthResponse = {
  token: string;
  user: AuthUser;
  referral?: { redeemed?: boolean; rewardReferee?: number };
};

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) setReferralCode(ref.trim().toUpperCase());
  }, []);

  async function requestOtp() {
    const res = await apiPost<{
      ok: boolean;
      message?: string;
      email: string;
      mock?: boolean;
      mockOtp?: string;
      devOtp?: string;
    }>("/api/auth/register/otp/request", {
      firstName,
      email,
      password,
      role: "b2c",
      referralCode: referralCode.trim() || undefined,
    });
    const code = res.mockOtp || res.devOtp || "";
    setDevOtp(code);
    if (code) setOtp(code);
    setNotice(
      res.mock
        ? `Mock OTP mode — use code ${code}.`
        : res.message ||
            `We sent a verification code to ${email}. Enter it below.`
    );
    setStep("otp");
    if (!code) setOtp("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      await requestOtp();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const res = await apiPost<AuthResponse>("/api/auth/register/otp/verify", {
        email,
        code: otp.trim(),
      });
      saveAuth(res.token, res.user);
      router.push("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    setError("");
    setLoading(true);
    try {
      await requestOtp();
      setNotice("A new code was sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh]">
      <AppHeader />
      <section className="mx-auto flex min-h-[100dvh] w-full max-w-6xl items-center px-4 pb-10 pt-24 sm:px-6 sm:pt-28">
        <div className="grid w-full items-center gap-10 md:grid-cols-2 md:gap-12">
          <div className="card hidden overflow-hidden rounded-[2rem] md:block">
            <div className="relative aspect-[3/4] w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/model-print.png"
                alt="zimji try-on"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="mx-auto w-full max-w-sm">
            <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
              {step === "otp" ? "Verify your email" : "Create your account"}
            </h1>
            <p className="mt-2 text-ink-muted">
              {step === "otp"
                ? devOtp
                  ? "Mock OTP is enabled — the code is pre-filled below."
                  : `Enter the 6-digit code sent to ${email}.`
                : "Start trying on outfits and hairstyles in seconds."}
            </p>

            {step === "otp" ? (
              <form onSubmit={onVerifyOtp} className="mt-8 space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep("form");
                    setOtp("");
                    setDevOtp("");
                    setError("");
                    setNotice("");
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-sage transition hover:text-sage-dark"
                >
                  <span aria-hidden>←</span>
                  Edit details
                </button>
                {notice && (
                  <div className="rounded-xl border border-sage/40 bg-sage/10 px-4 py-3 text-sm text-sage-dark">
                    {notice}
                    {devOtp ? (
                      <p className="mt-2 font-mono text-base font-bold tracking-widest">
                        {devOtp}
                      </p>
                    ) : null}
                  </div>
                )}
                {error && (
                  <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700">
                    Verification code <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink outline-none transition focus:border-sage"
                    placeholder="6-digit code"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full rounded-full bg-sage py-3 font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-60"
                >
                  {loading ? "Verifying…" : "Verify & create account"}
                </button>
                <div className="flex justify-end text-sm">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={resendOtp}
                    className="font-semibold text-sage hover:text-sage-dark disabled:opacity-60"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={onSubmit} className="mt-8 space-y-4">
                {error && (
                  <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700">
                    First name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={LIMITS.name}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink outline-none transition focus:border-sage"
                    placeholder="Amara"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    maxLength={LIMITS.email}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink outline-none transition focus:border-sage"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    maxLength={LIMITS.password}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink outline-none transition focus:border-sage"
                    placeholder="At least 8 characters"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700">
                    Referral code{" "}
                    <span className="font-normal text-ink-muted">(optional)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={referralCode}
                    onChange={(e) =>
                      setReferralCode(e.target.value.toUpperCase())
                    }
                    className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 uppercase tracking-wider text-ink outline-none transition focus:border-sage"
                    placeholder="e.g. AMARA8K2"
                    autoCapitalize="characters"
                  />
                  <p className="mt-1.5 text-xs text-ink-muted">
                    Have a friend’s code? Enter it to unlock a free try-on when
                    you join.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-sage py-3 font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-60"
                >
                  {loading ? "Sending code…" : "Continue — verify email"}
                </button>
              </form>
            )}

            <p className="mt-6 text-sm text-ink-muted">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-sage hover:text-sage-dark"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
