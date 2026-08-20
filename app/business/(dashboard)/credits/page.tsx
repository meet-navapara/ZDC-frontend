"use client";

import { useEffect, useState } from "react";
import {
  getBalance,
  getCreditPacks,
  getLedger,
  purchaseCredits,
  type CreditPack,
  type LedgerEntry,
} from "@/lib/b2b";
import { listPaymentMethods } from "@/lib/b2c";

const LEDGER_LABEL: Record<LedgerEntry["type"], string> = {
  purchase: "Purchase",
  consume: "Try-on",
  adjust: "Adjustment",
};

export default function CreditsPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);

  async function refresh() {
    const [b, l] = await Promise.all([
      getBalance().catch(() => ({ balance: 0 })),
      getLedger(50).catch(() => ({ ledger: [] })),
    ]);
    setBalance(b.balance);
    setLedger(l.ledger);
  }

  useEffect(() => {
    getCreditPacks()
      .then((r) => setPacks(r.packs))
      .catch(() => setPacks([]));
    listPaymentMethods()
      .then((r) => setPaymentNotice(r.paymentNotice || null))
      .catch(() => {});
    refresh();
  }, []);

  async function buy(pack: CreditPack) {
    setError("");
    setNotice("");
    setBuying(pack.id);
    try {
      const res = await purchaseCredits(pack.id, "stub");
      setNotice(
        `Added ${res.credited} credits. New balance: ${res.balance}. Invoice downloaded.`
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setBuying(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="card flex flex-col gap-1 rounded-2xl bg-sage/5 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-sage-dark">
            Current balance
          </div>
          <div className="mt-1 font-display text-4xl font-semibold text-ink sm:text-5xl">
            {balance ?? "—"}
          </div>
        </div>
        <p className="text-sm text-ink-muted">1 credit = 1 try-on render</p>
      </div>

      {paymentNotice && (
        <div className="mt-4 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100">
          {paymentNotice}
        </div>
      )}
      {notice && (
        <div className="mt-4 rounded-xl border border-sage/40 bg-sage/10 px-4 py-3 text-sm text-sage-dark">
          {notice}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <h2 className="mt-8 font-display text-xl font-semibold text-ink sm:text-2xl">
        Choose a pack
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {packs.length === 0 && (
          <>
            <div className="h-48 animate-pulse rounded-2xl bg-ink/5" />
            <div className="h-48 animate-pulse rounded-2xl bg-ink/5" />
            <div className="h-48 animate-pulse rounded-2xl bg-ink/5" />
          </>
        )}
        {packs.map((p, i) => {
          const perCredit = (p.amount / p.credits).toFixed(1);
          const best = i === 1;
          return (
            <div
              key={p.id}
              className={`card relative flex flex-col rounded-2xl p-5 ${
                best ? "ring-2 ring-sage" : ""
              }`}
            >
              {best && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sage px-3 py-1 text-xs font-semibold text-paper">
                  Best value
                </span>
              )}
              <div className="font-display text-xl font-semibold text-ink">
                {p.label}
              </div>
              <div className="mt-2 font-display text-4xl font-semibold text-sage-dark">
                {p.credits}
                <span className="ml-1 text-base font-normal text-ink-muted">
                  credits
                </span>
              </div>
              <div className="mt-1 text-sm text-ink-muted">
                {p.currency} {p.amount} · ~{p.currency} {perCredit}/credit
              </div>
              <button
                onClick={() => buy(p)}
                disabled={!!buying}
                className="mt-5 w-full rounded-full bg-sage py-3 font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-60"
              >
                {buying === p.id ? "Processing…" : "Buy"}
              </button>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-ink-muted">
        Demo mode: payment completes instantly. Live card/M-Pesa will return with a new provider.
      </p>

      <h2 className="mt-10 font-display text-xl font-semibold text-ink sm:text-2xl">
        Transaction history
      </h2>

      {ledger.length === 0 ? (
        <div className="card mt-4 rounded-2xl px-5 py-6 text-sm text-ink-muted">
          No transactions yet.
        </div>
      ) : (
        <>
          <ul className="mt-4 space-y-3 md:hidden">
            {ledger.map((e) => (
              <li key={e.id} className="card rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      e.delta > 0
                        ? "bg-sage/15 text-sage-dark"
                        : "bg-ink/5 text-ink-muted"
                    }`}
                  >
                    {LEDGER_LABEL[e.type] || e.type}
                  </span>
                  <span
                    className={`font-semibold ${
                      e.delta > 0 ? "text-sage-dark" : "text-ink"
                    }`}
                  >
                    {e.delta > 0 ? "+" : ""}
                    {e.delta}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink-muted">
                  {e.note || "—"}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {new Date(e.createdAt).toLocaleString()} · balance {e.balanceAfter}
                </p>
              </li>
            ))}
          </ul>

          <div className="card mt-4 hidden overflow-hidden rounded-2xl md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/10 bg-ink/[0.02] text-xs uppercase tracking-wider text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Change</th>
                  <th className="px-4 py-3 font-semibold">Balance</th>
                  <th className="px-4 py-3 font-semibold">Note</th>
                  <th className="px-4 py-3 font-semibold">When</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((e) => (
                  <tr key={e.id} className="border-b border-ink/5 last:border-0">
                    <td className="px-4 py-3">{LEDGER_LABEL[e.type] || e.type}</td>
                    <td className="px-4 py-3 font-medium">
                      {e.delta > 0 ? "+" : ""}
                      {e.delta}
                    </td>
                    <td className="px-4 py-3">{e.balanceAfter}</td>
                    <td className="px-4 py-3 text-ink-muted">{e.note || "—"}</td>
                    <td className="px-4 py-3 text-ink-muted">
                      {new Date(e.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
