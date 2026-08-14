"use client";

import { useEffect, useState } from "react";
import { getAnalytics, type PlatformStats } from "@/lib/admin";
import { ChartPanel, useLiveRefresh } from "@/components/MiniBarChart";

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
  const { tick, updatedAt, markUpdated } = useLiveRefresh(20000);

  useEffect(() => {
    let cancelled = false;
    const firstLoad = loading && !stats;
    if (firstLoad) setLoading(true);
    getAnalytics(days)
      .then((r) => {
        if (cancelled) return;
        setStats(r.stats);
        setError(null);
        markUpdated();
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, tick]);

  const cur = stats?.revenue.currency || "KES";
  const revenueSeries = stats?.series.revenue || [];
  const tryonSeries = stats?.series.tryons || [];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Analytics
          </h1>
          <p className="mt-1 text-ink-muted">
            Live platform revenue and try-ons — today&apos;s numbers first, then
            the trend.
          </p>
        </div>
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

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Revenue (all-time)"
          value={loading && !stats ? "—" : money(stats?.revenue.total ?? 0, cur)}
          hint={`${money(stats?.revenue.today ?? 0, cur)} today`}
          accent
        />
        <StatCard
          label="Try-ons (all-time)"
          value={loading && !stats ? "—" : fmt(stats?.tryons.total ?? 0)}
          hint={`${fmt(stats?.tryons.today ?? 0)} today`}
        />
        <StatCard
          label="Total users"
          value={loading && !stats ? "—" : fmt(stats?.users.total ?? 0)}
          hint={`+${fmt(stats?.users.newToday ?? 0)} today`}
        />
        <StatCard
          label="Render success"
          value={loading && !stats ? "—" : `${stats?.tryons.successRate ?? 0}%`}
          hint="completed / all try-ons"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Revenue today"
          value={loading && !stats ? "—" : money(stats?.revenue.today ?? 0, cur)}
        />
        <StatCard
          label="Try-ons today"
          value={loading && !stats ? "—" : fmt(stats?.tryons.today ?? 0)}
        />
        <StatCard
          label="New users today"
          value={loading && !stats ? "—" : fmt(stats?.users.newToday ?? 0)}
        />
        <StatCard
          label="Pending B2B"
          value={loading && !stats ? "—" : fmt(stats?.users.pendingB2B ?? 0)}
          accent={(stats?.users.pendingB2B ?? 0) > 0}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ChartPanel
          title="Revenue trend"
          subtitle={`Paid amount per day (${cur}) · last ${days}d · B2C try-on + B2B credits`}
          data={revenueSeries}
          valueKey="amount"
          chart="line"
          formatValue={(n) => money(n, cur)}
          loading={loading && !stats}
          updatedAt={updatedAt}
          emptyHint="When customers pay for try-ons or businesses buy credits, daily revenue appears here."
        />
        <ChartPanel
          title="Try-ons by channel"
          subtitle={`B2C vs B2B stacked · last ${days}d`}
          data={tryonSeries}
          dual
          formatValue={(n) => fmt(n)}
          loading={loading && !stats}
          updatedAt={updatedAt}
          emptyHint="Try-ons from consumers and businesses show up here as soon as jobs are created."
        />
      </div>

      <div className="mt-6">
        <ChartPanel
          title="Total try-ons"
          subtitle="All channels combined"
          data={tryonSeries}
          valueKey="count"
          chart="bar"
          formatValue={(n) => fmt(n)}
          loading={loading && !stats}
          updatedAt={updatedAt}
        />
      </div>

      {!loading && stats && (
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-muted">
          <span>
            B2C try-on revenue:{" "}
            <strong className="text-ink">
              {money(stats.revenue.byPurpose.b2c_tryon || 0, cur)}
            </strong>
          </span>
          <span>
            B2B credits revenue:{" "}
            <strong className="text-ink">
              {money(stats.revenue.byPurpose.b2b_credits || 0, cur)}
            </strong>
          </span>
        </div>
      )}

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
                    <td className="py-2.5 text-right text-ink">
                      {fmt(b.tryons)}
                    </td>
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
