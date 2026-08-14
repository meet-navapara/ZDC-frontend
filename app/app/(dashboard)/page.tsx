"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { getMyReferral, getMyStats, type B2cJob, type B2cStats } from "@/lib/b2c";
import { getUser } from "@/lib/auth";

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`card rounded-2xl p-5 ${accent ? "border-sage/30 bg-sage/10" : ""}`}
    >
      <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
        {label}
      </div>
      <div className="mt-2 font-display text-3xl font-semibold text-ink">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-ink-muted">{hint}</div>}
    </div>
  );
}

function money(n: number, currency = "KES") {
  return `${currency} ${new Intl.NumberFormat("en-US").format(n)}`;
}

export default function ConsumerOverviewPage() {
  const [stats, setStats] = useState<B2cStats | null>(null);
  const [recent, setRecent] = useState<B2cJob[]>([]);
  const [freeTryons, setFreeTryons] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = getUser();
  const firstName = user?.firstName || "there";

  useEffect(() => {
    Promise.all([
      getMyStats(),
      getMyReferral().catch(() => null),
    ])
      .then(([r, ref]) => {
        setStats(r.stats);
        setRecent(r.recent);
        if (ref) setFreeTryons(ref.referral.freeTryons);
        else setFreeTryons(user?.freeTryons || 0);
        setError(null);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load overview")
      )
      .finally(() => setLoading(false));
  }, [user?.freeTryons]);

  const dash = "—";

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Hi, {firstName}
          </h1>
          <p className="mt-1 text-ink-muted">
            Your try-ons, spend, and looks — all in one place.
          </p>
        </div>
        <Link
          href="/app/try-on"
          className="rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-sage-dark"
        >
          ✦ New try-on
        </Link>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total try-ons"
          value={loading ? dash : stats?.total ?? 0}
          accent
        />
        <StatCard
          label="Completed looks"
          value={loading ? dash : stats?.completed ?? 0}
        />
        <StatCard
          label="Free try-ons"
          value={loading ? dash : freeTryons}
          hint="From referrals"
        />
        <StatCard
          label="Total spent"
          value={
            loading
              ? dash
              : money(stats?.spentTotal ?? 0, stats?.currency || "KES")
          }
        />
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            Recent looks
          </h2>
          <Link
            href="/app/history"
            className="text-sm font-semibold text-sage hover:text-sage-dark"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-ink/5" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="card mt-4 rounded-2xl px-6 py-12 text-center">
            <p className="text-ink-muted">
              No looks yet. Start your first try-on to see results here.
            </p>
            <Link
              href="/app/try-on"
              className="mt-4 inline-flex rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-sage-dark"
            >
              Try on now
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((job) => {
              const thumb = job.resultImageUrls[0];
              return (
                <Link
                  key={job.id}
                  href={`/app/history?job=${job.id}`}
                  className="card group overflow-hidden rounded-2xl transition hover:border-sage/40"
                >
                  <div className="relative aspect-[3/4] bg-ink/5">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={apiUrl(thumb)}
                        alt="Try-on result"
                        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-ink-muted">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-semibold capitalize text-ink">
                      {job.pack || "Try-on"}
                    </div>
                    <div className="mt-0.5 text-xs text-ink-muted">
                      {job.createdAt
                        ? new Date(job.createdAt).toLocaleString()
                        : ""}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
