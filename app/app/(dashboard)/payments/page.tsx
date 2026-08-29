"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
import { listMyPayments, type B2cPayment } from "@/lib/b2c";
import { PageLoader } from "@/components/PageLoader";

const PAGE_SIZE = 10;

function money(n: number, currency = "KES") {
  return `${currency} ${new Intl.NumberFormat("en-US").format(n)}`;
}

export default function ConsumerPaymentsPage() {
  const [payments, setPayments] = useState<B2cPayment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listMyPayments({ page, limit: PAGE_SIZE })
      .then((r) => {
        if (cancelled) return;
        setPayments(r.payments);
        setTotal(r.total);
        setPages(r.pages || 1);
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load payments");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  if (loading && payments.length === 0) {
    return <PageLoader label="Loading payments…" />;
  }

  const spentByCurrency = payments
    .filter((p) => p.status === "paid")
    .reduce<Record<string, number>>((acc, p) => {
      const cur = p.currency || "KES";
      acc[cur] = (acc[cur] || 0) + p.amount;
      return acc;
    }, {});
  const spentLines = Object.entries(spentByCurrency);

  return (
    <div className="mx-auto max-w-4xl">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">
          Payments
        </h1>
        <p className="mt-1 text-ink-muted">
          Pack purchases and spend history for your try-ons.
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="card rounded-2xl p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Spent (this page)
          </div>
          <div className="mt-2 font-display text-3xl font-semibold text-ink">
            {spentLines.length === 0 ? (
              "—"
            ) : spentLines.length === 1 ? (
              money(spentLines[0][1], spentLines[0][0])
            ) : (
              <span className="text-2xl">
                {spentLines.map(([cur, amt]) => money(amt, cur)).join(" · ")}
              </span>
            )}
          </div>
        </div>
        <div className="card rounded-2xl border-sage/30 bg-sage/10 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Payments
          </div>
          <div className="mt-2 font-display text-3xl font-semibold text-ink">
            {total}
          </div>
        </div>
      </div>

      <div className="card mt-6 overflow-hidden rounded-2xl">
        <div className="border-b border-ink/10 px-4 py-3 text-sm font-semibold text-ink dark:border-white/10">
          History
        </div>
        {payments.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-ink-muted">
            No payments yet.{" "}
            <Link href="/app/try-on" className="font-semibold text-sage">
              Start a try-on
            </Link>
          </div>
        ) : (
          <ul
            className={`divide-y divide-ink/10 dark:divide-white/10 ${
              loading ? "opacity-60" : ""
            }`}
          >
            {payments.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-ink/5 dark:bg-white/5">
                  {p.job?.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={apiUrl(p.job.thumbnail)}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink">
                    {p.job?.pack
                      ? `${p.job.pack} pack`
                      : "Try-on pack"}{" "}
                    <span className="font-normal capitalize text-ink-muted">
                      · {p.status}
                    </span>
                  </div>
                  <div className="text-xs text-ink-muted">
                    {new Date(p.createdAt).toLocaleString()}
                    {p.reference ? ` · ${p.reference}` : ""}
                  </div>
                </div>
                <div className="text-sm font-semibold text-ink">
                  {money(p.amount, p.currency)}
                </div>
                {p.job?.id && (
                  <Link
                    href={`/app/history?job=${p.job.id}`}
                    className="text-xs font-semibold text-sage hover:text-sage-dark"
                  >
                    View
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {total > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-muted">
          <span>
            {total} {total === 1 ? "transaction" : "transactions"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="min-h-11 rounded-lg border border-ink/15 px-4 py-2 font-semibold text-ink transition hover:border-ink/30 disabled:opacity-40 dark:border-white/15 dark:text-[#e8e2d8]"
            >
              Prev
            </button>
            <span className="min-w-[5.5rem] text-center">
              Page {page} / {pages || 1}
            </span>
            <button
              type="button"
              disabled={page >= pages || loading}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="min-h-11 rounded-lg border border-ink/15 px-4 py-2 font-semibold text-ink transition hover:border-ink/30 disabled:opacity-40 dark:border-white/15 dark:text-[#e8e2d8]"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
