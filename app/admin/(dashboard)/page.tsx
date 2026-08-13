"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getOverview, type AdminOverview } from "@/lib/admin";

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

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOverview()
      .then((r) => setData(r.overview))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const dash = "—";
  const u = data?.users;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total users" value={loading ? dash : u?.total ?? 0} />
        <StatCard label="Consumers (B2C)" value={loading ? dash : u?.b2c ?? 0} />
        <StatCard label="Businesses (B2B)" value={loading ? dash : u?.b2b ?? 0} />
        <StatCard
          label="Pending approval"
          value={loading ? dash : u?.pendingB2B ?? 0}
          hint="B2B awaiting review"
          accent={!loading && (u?.pendingB2B ?? 0) > 0}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Suspended" value={loading ? dash : u?.suspended ?? 0} />
        <StatCard label="Admins" value={loading ? dash : u?.admins ?? 0} />
        <StatCard
          label="Try-ons (all-time)"
          value={loading ? dash : data?.tryons.total ?? 0}
        />
        <StatCard
          label="Try-ons today"
          value={loading ? dash : data?.tryons.today ?? 0}
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/admin/users?status=pending&role=b2b"
          className="rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-sage-dark"
        >
          Review pending businesses →
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
