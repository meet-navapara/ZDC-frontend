"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
import { listMyPayments, type B2cPayment } from "@/lib/b2c";

function money(n: number, currency = "KES") {
  return `${currency} ${new Intl.NumberFormat("en-US").format(n)}`;
}

export default function ConsumerPaymentsPage() {
  const [payments, setPayments] = useState<B2cPayment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listMyPayments({ limit: 50 })
      .then((r) => {
        setPayments(r.payments);
        setTotal(r.total);
        setError(null);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load payments")
      )
      .finally(() => setLoading(false));
  }, []);

  const spent = payments
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount, 0);
  const currency = payments[0]?.currency || "KES";

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
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="card rounded-2xl p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Total spent
          </div>
          <div className="mt-2 font-display text-3xl font-semibold text-ink">
            {loading ? "—" : money(spent, currency)}
          </div>
        </div>
        <div className="card rounded-2xl border-sage/30 bg-sage/10 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Payments
          </div>
          <div className="mt-2 font-display text-3xl font-semibold text-ink">
            {loading ? "—" : total}
          </div>
        </div>
      </div>

      <div className="card mt-6 overflow-hidden rounded-2xl">
        <div className="border-b border-ink/10 px-4 py-3 text-sm font-semibold text-ink">
          History
        </div>
        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-ink/5" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-ink-muted">
            No payments yet.{" "}
            <Link href="/app/try-on" className="font-semibold text-sage">
              Start a try-on
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-ink/10">
            {payments.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-ink/5">
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
    </div>
  );
}
