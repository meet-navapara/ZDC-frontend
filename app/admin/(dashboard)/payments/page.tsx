"use client";

import { useCallback, useEffect, useState } from "react";
import { CustomSelect } from "@/components/CustomSelect";
import {
  listPayments,
  refundPayment,
  type PaymentRow,
  type PaymentSummary,
} from "@/lib/admin";
import { PageLoader } from "@/components/PageLoader";
import { toast } from "@/lib/toast";

const STATUS_TONE: Record<string, string> = {
  paid: "bg-sage/10 text-sage-dark border-sage/30",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-ink/5 text-ink-muted border-ink/15",
  refunded: "bg-violet-50 text-violet-700 border-violet-200",
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
  if (currency === "INR") {
    return `₹${amount.toLocaleString("en-IN")}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

function collectedSubline(kes: number, inr: number, kesCount: number, inrCount: number) {
  const parts: string[] = [];
  if (kesCount > 0) parts.push(`KES ${kes.toLocaleString()} (${kesCount})`);
  if (inrCount > 0) parts.push(`₹${inr.toLocaleString("en-IN")} (${inrCount})`);
  return parts.length ? parts.join(" · ") : "No payments";
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
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [refundTarget, setRefundTarget] = useState<PaymentRow | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundBusy, setRefundBusy] = useState(false);

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

  async function confirmRefund() {
    if (!refundTarget) return;
    setRefundBusy(true);
    setRefundingId(refundTarget.id);
    try {
      await refundPayment(refundTarget.id, {
        reason: refundReason.trim() || undefined,
        reverseCredits: refundTarget.purpose === "b2b_credits",
      });
      toast.success("Payment marked as refunded");
      setRefundTarget(null);
      setRefundReason("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Refund failed");
    } finally {
      setRefundBusy(false);
      setRefundingId(null);
    }
  }

  if (loading && rows.length === 0 && !summary) {
    return <PageLoader label="Loading payments…" />;
  }

  return (
    <div className="mx-auto max-w-6xl">
      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="mt-6 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
            Revenue by currency (current filters)
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <SummaryCard
              label="Collected (KES)"
              value={money(summary.paid.kes.amount, "KES")}
              sub={`${summary.paid.kes.count} paid via M-Pesa / KES`}
              tone="text-sage-dark"
            />
            <SummaryCard
              label="Collected (INR)"
              value={money(summary.paid.inr.amount, "INR")}
              sub={`${summary.paid.inr.count} paid via Razorpay / INR`}
              tone="text-sage-dark"
            />
            <SummaryCard
              label="Total collected"
              value={String(summary.paid.totalCount)}
              sub={collectedSubline(
                summary.paid.kes.amount,
                summary.paid.inr.amount,
                summary.paid.kes.count,
                summary.paid.inr.count
              )}
              tone="text-ink"
            />
            <SummaryCard
              label="Pending"
              value={`${summary.pending.totalCount}`}
              sub={collectedSubline(
                summary.pending.kes.amount,
                summary.pending.inr.amount,
                summary.pending.kes.count,
                summary.pending.inr.count
              )}
              tone="text-amber-600"
            />
            <SummaryCard
              label="Failed"
              value={`${summary.failed.totalCount}`}
              sub={collectedSubline(
                summary.failed.kes.amount,
                summary.failed.inr.amount,
                summary.failed.kes.count,
                summary.failed.inr.count
              )}
              tone="text-red-600"
            />
          </div>
          {summary.refunded && summary.refunded.totalCount > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <SummaryCard
                label="Refunded"
                value={`${summary.refunded.totalCount}`}
                sub={collectedSubline(
                  summary.refunded.kes.amount,
                  summary.refunded.inr.amount,
                  summary.refunded.kes.count,
                  summary.refunded.inr.count
                )}
                tone="text-violet-700"
              />
            </div>
          )}
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
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-ink-muted">
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
                  <td className="px-4 py-3">
                    {p.status === "paid" && (
                      <button
                        type="button"
                        disabled={refundingId === p.id}
                        onClick={() => {
                          setRefundTarget(p);
                          setRefundReason("");
                        }}
                        className="rounded-lg border border-violet-200 px-2.5 py-1 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 disabled:opacity-50"
                      >
                        Refund
                      </button>
                    )}
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

      {refundTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-display text-xl font-semibold text-ink">
              Refund payment
            </h3>
            <p className="mt-2 text-sm text-ink-muted">
              {money(refundTarget.amount, refundTarget.currency)} ·{" "}
              {PURPOSE_LABEL[refundTarget.purpose] || refundTarget.purpose} ·{" "}
              {refundTarget.gateway}
            </p>
            {refundTarget.purpose === "b2b_credits" && (
              <p className="mt-2 text-xs text-amber-700">
                Credits from this purchase will be deducted if the business still
                has enough balance.
              </p>
            )}
            <label className="mt-4 block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-muted">
                Reason (optional)
              </span>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink outline-none focus:border-sage"
                placeholder="Customer request, duplicate charge…"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={refundBusy}
                onClick={() => setRefundTarget(null)}
                className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-semibold text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={refundBusy}
                onClick={confirmRefund}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
              >
                {refundBusy ? "Refunding…" : "Confirm refund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
