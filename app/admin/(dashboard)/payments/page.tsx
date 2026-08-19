"use client";

import { useCallback, useEffect, useState } from "react";
import { CustomSelect } from "@/components/CustomSelect";
import {
  listPayments,
  type PaymentRow,
  type PaymentSummary,
} from "@/lib/admin";

const STATUS_TONE: Record<string, string> = {
  paid: "bg-sage/10 text-sage-dark border-sage/30",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-red-50 text-red-700 border-red-200",
};

const PURPOSE_LABEL: Record<string, string> = {
  b2c_tryon: "B2C try-on",
  b2b_credits: "B2B credits",
};

function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] || "bg-ink/5 text-ink border-ink/15";
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${tone}`}
    >
      {status}
    </span>
  );
}

function money(amount: number, currency = "KES") {
  return `${currency} ${amount.toLocaleString()}`;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString();
}

function SummaryCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-ink-muted">
        {label}
      </div>
      <div className={`mt-2 font-display text-2xl font-semibold ${tone}`}>
        {value}
      </div>
      <div className="mt-1 text-sm text-ink-muted">{sub}</div>
    </div>
  );
}

export default function AdminPaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [gateways, setGateways] = useState<string[]>([]);
  const [purposes, setPurposes] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [gateway, setGateway] = useState("");
  const [purpose, setPurpose] = useState("");
  const [days, setDays] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listPayments({
      page,
      status: status || undefined,
      gateway: gateway || undefined,
      purpose: purpose || undefined,
      days: days ? Number(days) : undefined,
      q: q || undefined,
    })
      .then((r) => {
        setRows(r.payments);
        setSummary(r.summary);
        setStatuses(r.statuses);
        setGateways(r.gateways);
        setPurposes(r.purposes);
        setPages(r.pages);
        setTotal(r.total);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [page, status, gateway, purpose, days, q]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl">
      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Collected"
            value={money(summary.paid.amount, summary.currency)}
            sub={`${summary.paid.count} paid`}
            tone="text-sage-dark"
          />
          <SummaryCard
            label="Pending"
            value={money(summary.pending.amount, summary.currency)}
            sub={`${summary.pending.count} awaiting`}
            tone="text-amber-600"
          />
          <SummaryCard
            label="Failed"
            value={money(summary.failed.amount, summary.currency)}
            sub={`${summary.failed.count} failed`}
            tone="text-red-600"
          />
        </div>
      )}

      {/* Filters */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          load();
        }}
        className="mt-6 flex flex-wrap items-end gap-3"
      >
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            Search
          </span>
          <input
            value={q}
            maxLength={100}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Reference, email or shop…"
            className="w-56 rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-sage"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            Status
          </span>
          <CustomSelect
            size="sm"
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            options={[{ value: "", label: "All" }, ...statuses.map((s) => ({ value: s, label: s }))]}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            Purpose
          </span>
          <CustomSelect
            size="sm"
            value={purpose}
            onChange={(v) => { setPurpose(v); setPage(1); }}
            options={[{ value: "", label: "All" }, ...purposes.map((p) => ({ value: p, label: PURPOSE_LABEL[p] || p }))]}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            Gateway
          </span>
          <CustomSelect
            size="sm"
            value={gateway}
            onChange={(v) => { setGateway(v); setPage(1); }}
            options={[{ value: "", label: "All" }, ...gateways.map((g) => ({ value: g, label: g }))]}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            Period
          </span>
          <CustomSelect
            size="sm"
            value={days}
            onChange={(v) => { setDays(v); setPage(1); }}
            options={[
              { value: "", label: "All time" },
              { value: "7", label: "Last 7 days" },
              { value: "30", label: "Last 30 days" },
              { value: "90", label: "Last 90 days" },
            ]}
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-sage px-4 py-2 text-sm font-semibold text-paper transition hover:bg-sage-dark"
        >
          Apply
        </button>
      </form>

      {/* Table */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-ink-muted">
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Purpose</th>
              <th className="px-4 py-3">Gateway</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Reference</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-muted">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-muted">
                  No payments match these filters.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="border-t border-ink/10 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                    {fmtTime(p.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-ink">
                    {p.user ? (
                      <div>
                        <div>{p.user.businessName || p.user.email}</div>
                        {p.user.businessName && (
                          <div className="text-xs text-ink-muted">
                            {p.user.email}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-ink-muted">Guest</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink">
                    {PURPOSE_LABEL[p.purpose] || p.purpose}
                  </td>
                  <td className="px-4 py-3 capitalize text-ink-muted">
                    {p.gateway}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-ink">
                    {money(p.amount, p.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                    {p.reference || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm text-ink-muted">
        <span>
          {total} {total === 1 ? "transaction" : "transactions"}
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-ink/15 px-3 py-1.5 disabled:opacity-40"
          >
            Prev
          </button>
          <span>
            Page {page} / {pages || 1}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            className="rounded-lg border border-ink/15 px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
