"use client";

import { useEffect, useMemo, useState } from "react";
import { getMyReferral, type ReferralStats } from "@/lib/b2c";
import { getUser, saveAuth, getToken } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import type { AuthUser } from "@/lib/auth";

export default function ReferralsPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      getMyReferral(),
      apiGet<{ user: AuthUser }>("/api/auth/me", getToken() || undefined).catch(
        () => null
      ),
    ])
      .then(([r, me]) => {
        setStats(r.referral);
        if (me?.user) {
          const token = getToken();
          if (token) saveAuth(token, me.user);
        }
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load referrals")
      )
      .finally(() => setLoading(false));
  }, []);

  const shareUrl = useMemo(() => {
    if (!stats?.referralCode || typeof window === "undefined") return "";
    return `${window.location.origin}/register?ref=${stats.referralCode}`;
  }, [stats?.referralCode]);

  async function copyCode() {
    if (!stats?.referralCode) return;
    try {
      await navigator.clipboard.writeText(stats.referralCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  function shareWhatsApp() {
    const text = `Join zimji with my code ${stats?.referralCode} and get a free try-on: ${shareUrl}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  const user = getUser();

  return (
    <div className="mx-auto max-w-3xl">
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="h-36 animate-pulse rounded-2xl bg-ink/5" />
          <div className="h-28 animate-pulse rounded-2xl bg-ink/5" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card rounded-2xl border-sage/30 bg-sage/10 p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Free try-ons
              </div>
              <div className="mt-2 font-display text-3xl font-semibold text-ink">
                {stats?.freeTryons ?? user?.freeTryons ?? 0}
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                Use on a Single pack in Try-On
              </p>
            </div>
            <div className="card rounded-2xl p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Friends joined
              </div>
              <div className="mt-2 font-display text-3xl font-semibold text-ink">
                {stats?.invites ?? 0}
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                +{stats?.rewardPerInvite ?? 1} free try-on each
              </p>
            </div>
            <div className="card rounded-2xl p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Your reward
              </div>
              <div className="mt-2 font-display text-3xl font-semibold text-ink">
                {stats?.rewardPerInvite ?? 1}
              </div>
              <p className="mt-1 text-xs text-ink-muted">Per successful invite</p>
            </div>
          </div>

          <section className="card mt-6 rounded-2xl p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold text-ink">
              Your referral code
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Friends enter this at signup — or open your link.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-ink/10 bg-paper-100 px-5 py-4 font-mono text-2xl font-semibold tracking-[0.2em] text-ink">
                {stats?.referralCode || "—"}
              </div>
              <button
                type="button"
                onClick={copyCode}
                className="rounded-full border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-sage"
              >
                {copied ? "Copied!" : "Copy code"}
              </button>
            </div>

            <div className="mt-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Invite link
              </div>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  readOnly
                  value={shareUrl}
                  className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink-muted outline-none"
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="shrink-0 rounded-full bg-sage px-5 py-3 text-sm font-semibold text-paper transition hover:bg-sage-dark"
                >
                  Copy link
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={shareWhatsApp}
              className="mt-4 rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-sage"
            >
              Share on WhatsApp
            </button>
          </section>

          <section className="card mt-4 rounded-2xl p-5 sm:p-6">
            <h3 className="font-display text-lg font-semibold text-ink">
              How it works
            </h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink-muted">
              <li>Share your code or invite link with a friend.</li>
              <li>
                They sign up and enter the code — they get{" "}
                {stats?.rewardOnJoin ?? 1} free try-on automatically.
              </li>
              <li>
                You get {stats?.rewardPerInvite ?? 1} free try-on when they
                join.
              </li>
              <li>
                Redeem free try-ons on the Single pack from your Try-On page.
              </li>
            </ol>
          </section>
        </>
      )}
    </div>
  );
}
