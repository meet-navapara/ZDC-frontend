"use client";

import { useEffect, useState } from "react";
import { getAnalytics, type PlatformStats } from "@/lib/admin";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}
function money(n: number, currency = "KES") {
  return `${currency} ${new Intl.NumberFormat("en-US").format(n)}`;
}

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
    <div className={`card rounded-2xl p-5 ${accent ? "border-sage/30 bg-sage/10" : ""}`}>
      <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
        {label}
      </div>
      <div className="mt-2 font-display text-3xl font-semibold text-ink">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-muted">{hint}</div>}
    </div>
  );
}

const RANGES = [
  { days: 7, label: "7d" },
  { days: 30, label: "30d" },
  { days: 90, label: "90d" },
];

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getAnalytics(days)
      .then((r) => {
        setStats(r.stats);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [days]);

  const cur = stats?.revenue.currency || "KES";

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-end gap-4">
        <div className="inline-flex rounded-full border border-ink/15 p-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                days === r.days
                  ? "bg-sage text-paper"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Headline KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Revenue (all-time)"
          value={loading ? "—" : money(stats?.revenue.total ?? 0, cur)}
          hint={loading ? "" : `${money(stats?.revenue.last30 ?? 0, cur)} last 30d`}
          accent
        />
        <StatCard
          label="Try-ons (all-time)"
          value={loading ? "—" : fmt(stats?.tryons.total ?? 0)}
          hint={loading ? "" : `${fmt(stats?.tryons.last30 ?? 0)} last 30d`}
        />
        <StatCard
          label="Total users"
          value={loading ? "—" : fmt(stats?.users.total ?? 0)}
          hint={loading ? "" : `+${fmt(stats?.users.new30 ?? 0)} last 30d`}
        />
        <StatCard
          label="Render success"
          value={loading ? "—" : `${stats?.tryons.successRate ?? 0}%`}
          hint="completed / all try-ons"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Revenue today"
          value={loading ? "—" : money(stats?.revenue.today ?? 0, cur)}
        />
        <StatCard
          label="Try-ons today"
          value={loading ? "—" : fmt(stats?.tryons.today ?? 0)}
        />
        <StatCard
          label="New users today"
          value={loading ? "—" : fmt(stats?.users.newToday ?? 0)}
        />
        <StatCard
          label="Pending B2B"
          value={loading ? "—" : fmt(stats?.users.pendingB2B ?? 0)}
          accent={!loading && (stats?.users.pendingB2B ?? 0) > 0}
        />
      </div>

      {/* Top businesses */}
      <div className="mt-8 card rounded-2xl p-5">
        <h2 className="font-display text-lg font-semibold text-ink">
          Top businesses by try-ons
        </h2>
        {stats && stats.topBusinesses.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-ink-muted">
                  <th className="pb-2">Business</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2 text-right">Try-ons</th>
                  <th className="pb-2 text-right">Completed</th>
                </tr>
              </thead>
              <tbody>
                {stats.topBusinesses.map((b) => (
                  <tr key={b.userId} className="border-t border-ink/10">
                    <td className="py-2.5 font-medium text-ink">{b.name}</td>
                    <td className="py-2.5 capitalize text-ink-muted">
                      {b.category || "—"}
                    </td>
                    <td className="py-2.5 text-right text-ink">{fmt(b.tryons)}</td>
                    <td className="py-2.5 text-right text-ink-muted">
                      {fmt(b.completed)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink-muted">No business try-ons yet.</p>
        )}
      </div>
    </div>
  );
}
