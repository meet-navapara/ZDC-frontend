"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getOverview,
  getAnalytics,
  type AdminOverview,
  type PlatformStats,
} from "@/lib/admin";
import { ChartPanel, useLiveRefresh } from "@/components/MiniBarChart";
import { PageLoader } from "@/components/PageLoader";

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
      className={`card rounded-2xl p-5 ${accent ? "bg-sage/10 border-sage/30" : ""}`}
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

function fmt(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [analytics, setAnalytics] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { tick, updatedAt, markUpdated } = useLiveRefresh(20000);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getOverview().catch(() => null),
      getAnalytics(14).catch(() => null),
    ])
      .then(([o, a]) => {
        if (cancelled) return;
        if (o) setData(o.overview);
        if (a) setAnalytics(a.stats);
        markUpdated();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  if (loading && !data) {
    return <PageLoader label="Loading overview…" />;
  }

  const u = data?.users;
  const cur = analytics?.revenue.currency || "KES";

  return (
    <div className="mx-auto max-w-5xl">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">
          Overview
        </h1>
        <p className="mt-1 text-ink-muted">
          Platform pulse — today&apos;s revenue and try-ons update live.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total users" value={u?.total ?? 0} />
        <StatCard label="Consumers (B2C)" value={u?.b2c ?? 0} />
        <StatCard label="Businesses (B2B)" value={u?.b2b ?? 0} />
        <StatCard
          label="Pending approval"
          value={u?.pendingB2B ?? 0}
          hint="B2B awaiting review"
          accent={(u?.pendingB2B ?? 0) > 0}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Revenue today"
          value={money(analytics?.revenue.today ?? 0, cur)}
          hint={`${money(analytics?.revenue.total ?? 0, cur)} all-time`}
          accent
        />
        <StatCard
          label="Revenue (7d)"
          value={money(analytics?.revenue.last7 ?? 0, cur)}
        />
        <StatCard
          label="Try-ons today"
          value={data?.tryons.today ?? 0}
          hint={`${data?.tryons.total ?? 0} all-time`}
        />
        <StatCard
          label="New users today"
          value={analytics?.users.newToday ?? 0}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ChartPanel
          title="Revenue (14d)"
          subtitle="Real paid volume — B2C try-ons + B2B credits"
          data={analytics?.series.revenue || []}
          valueKey="amount"
          chart="line"
          formatValue={(n) => money(n, cur)}
          loading={false}
          updatedAt={updatedAt}
          emptyHint="Revenue bars fill when payments succeed."
        />
        <ChartPanel
          title="Try-ons (14d)"
          subtitle="B2C vs B2B — today’s total is highlighted"
          data={analytics?.series.tryons || []}
          dual
          formatValue={(n) => fmt(n)}
          loading={false}
          updatedAt={updatedAt}
          emptyHint="Try-on jobs appear here as soon as they are created."
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/admin/analytics"
          className="rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-sage-dark"
        >
          Open full analytics →
        </Link>
        <Link
          href="/admin/users?status=pending&role=b2b"
          className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/30"
        >
          Review pending businesses
        </Link>
        <Link
          href="/admin/users"
          className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/30"
        >
          Manage all users
        </Link>
      </div>
    </div>
  );
}
