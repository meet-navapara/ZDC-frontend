"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import {
  getStats,
  getLedger,
  downloadReport,
  type BusinessStats,
  type LedgerEntry,
} from "@/lib/b2b";
import { ChartPanel, useLiveRefresh } from "@/components/MiniBarChart";
import { PageLoader } from "@/components/PageLoader";
import { toast } from "@/lib/toast";

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

const LEDGER_LABEL: Record<LedgerEntry["type"], string> = {
  purchase: "Purchase",
  consume: "Try-on",
  adjust: "Adjustment",
};

export default function OverviewPage() {
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tick, updatedAt, markUpdated } = useLiveRefresh(20000);

  useEffect(() => {
    let cancelled = false;
    const first = loading;
    Promise.all([
      getStats().catch(() => null),
      getLedger(6).catch(() => ({ ledger: [] })),
    ])
      .then(([s, l]) => {
        if (cancelled) return;
        if (s) setStats(s.stats);
        setLedger(l.ledger);
        markUpdated();
      })
      .finally(() => {
        if (!cancelled && first) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  async function onExport() {
    setExporting(true);
    setError(null);
    try {
      await downloadReport();
      toast.success("Report downloaded");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Export failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  }

  if (loading && !stats) {
    return <PageLoader label="Loading overview…" />;
  }

  const cur = stats?.finance?.currency || "KES";
  const tryonSeries = stats?.charts?.tryons || stats?.series || [];
  const spendSeries = stats?.charts?.spend || [];
  const creditSeries = stats?.charts?.creditsUsed || [];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Overview
          </h1>
          <p className="mt-1 text-ink-muted">
            Live studio activity — charts refresh automatically with the latest
            numbers.
          </p>
        </div>
        <button
          onClick={onExport}
          disabled={exporting || loading}
          className="inline-flex items-center gap-2 rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-sage disabled:opacity-50 dark:border-white/12 dark:bg-[#1b1713] dark:text-[#f4efe7] dark:hover:border-sage/50"
        >
          {exporting ? "Preparing…" : "⤓ Export report (Excel)"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI grid */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Catalogue items"
          value={stats?.catalog.activeProducts ?? 0}
          hint="active products"
        />
        <StatCard
          label="Credits balance"
          value={stats?.credits.balance ?? 0}
          hint="1 credit = 1 render"
        />
        <StatCard
          label="Credits utilized"
          value={stats?.credits.consumed ?? 0}
          hint="all-time"
        />
        <StatCard
          label="Try-ons this week"
          value={stats?.tryons.last7 ?? 0}
          hint={`${stats?.tryons.today ?? 0} today`}
        />
      </div>

      {/* Finance + engagement */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Spend (all-time)"
          value={money(stats?.finance?.spentTotal ?? 0, cur)}
          hint={`${money(stats?.finance?.spentLast30 ?? 0, cur)} last 30d`}
          accent
        />
        <StatCard
          label="Render success"
          value={`${stats?.tryons.successRate ?? 0}%`}
          hint="completed / total"
        />
        <Link
          href="/business/branches"
          className="card block rounded-2xl p-5 transition hover:border-sage"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Branches
          </div>
          <div className="mt-2 font-display text-3xl font-semibold text-ink">
            {stats?.branches?.count ?? 0}
          </div>
          <div className="mt-1 text-xs text-ink-muted">
            Manage locations · Add branch
          </div>
        </Link>
        <Link
          href="/business/credits"
          className="card block rounded-2xl bg-sage/10 p-5 transition hover:border-sage"
        >
          <div className="text-2xl">＋</div>
          <div className="mt-2 font-display text-lg font-semibold text-ink">
            Buy credits
          </div>
          <div className="text-sm text-ink-muted">Top up to keep rendering.</div>
        </Link>
      </div>

      {/* Live charts — big “today/latest” numbers + day list for easy reading */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ChartPanel
          title="Credit spend"
          subtitle={`Pack purchases in ${cur} · last ${spendSeries.length || 14} days`}
          data={spendSeries}
          valueKey="amount"
          chart="line"
          formatValue={(n) => money(n, cur)}
          loading={false}
          updatedAt={updatedAt}
          emptyHint="Buy a credit pack to see spend appear here day by day."
        />
        <ChartPanel
          title="Try-on activity"
          subtitle={`Renders per day · last ${tryonSeries.length || 14} days`}
          data={tryonSeries}
          valueKey="count"
          chart="bar"
          loading={false}
          updatedAt={updatedAt}
          emptyHint="Run a try-on from the Try-On page — today’s bar updates live."
        />
      </div>

      <div className="mt-6">
        <ChartPanel
          title="Credits used"
          subtitle="Credits consumed by try-ons each day"
          data={creditSeries}
          valueKey="count"
          chart="bar"
          loading={false}
          updatedAt={updatedAt}
          emptyHint="Credits used show up here after completed renders."
        />
      </div>

      {/* Popular styles + recent activity */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card rounded-2xl p-5">
          <h2 className="font-display text-xl font-semibold text-ink">
            Popular styles
          </h2>
          <p className="text-xs text-ink-muted">Top 5 most tried products</p>
          {stats && stats.popular.length > 0 ? (
            <ol className="mt-4 space-y-3">
              {stats.popular.map((p, i) => (
                <li key={p.productId} className="flex items-center gap-3">
                  <span className="w-4 text-sm font-semibold text-ink-muted">
                    {i + 1}
                  </span>
                  <div className="h-12 w-10 shrink-0 overflow-hidden rounded-lg border border-ink/10 bg-ink/5">
                    {p.imageUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={apiUrl(p.imageUrl)}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">
                      {p.name}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-sage-dark">
                    {p.count}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-ink-muted">
              No try-ons yet — your top styles will appear here.
            </p>
          )}
        </div>

        <div className="card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-ink">
              Recent activity
            </h2>
            <Link
              href="/business/credits"
              className="text-sm font-semibold text-sage hover:text-sage-dark"
            >
              View ledger →
            </Link>
          </div>

          {ledger.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">
              No activity yet. Buy credits and run your first try-on.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-ink/5">
              {ledger.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <div className="text-sm font-medium text-ink">
                      {LEDGER_LABEL[e.type]}
                    </div>
                    <div className="text-xs text-ink-muted">
                      {new Date(e.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      e.amount >= 0 ? "text-sage-dark" : "text-ink"
                    }`}
                  >
                    {e.amount >= 0 ? "+" : ""}
                    {e.amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
