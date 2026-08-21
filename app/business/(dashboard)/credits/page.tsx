"use client";

import { useEffect, useState } from "react";
import {
  getBalance,
  getCreditPacks,
  getLedger,
  purchaseCredits,
  downloadCreditInvoice,
  notifyCreditsChanged,
  type CreditPack,
  type LedgerEntry,
} from "@/lib/b2b";
import {
  listPaymentMethods,
  verifyRazorpayPayment,
  waitForPayment,
} from "@/lib/b2c";
import { getUser } from "@/lib/auth";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { toast } from "@/lib/toast";

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
  const [defaultGateway, setDefaultGateway] = useState("stub");
  const [mpesaPhone, setMpesaPhone] = useState(
    () => getUser()?.phone || getUser()?.business?.whatsapp || ""
  );
  const [awaitingPay, setAwaitingPay] = useState<
    null | "mpesa" | "razorpay"
  >(null);
  const [payHint, setPayHint] = useState("");

  const payWithMpesa = defaultGateway === "mpesa";
  const payWithRazorpay = defaultGateway === "razorpay";

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
      .then((r) => {
        setPaymentNotice(r.paymentNotice || null);
        setDefaultGateway(r.defaultGateway || "stub");
      })
      .catch(() => {});
    refresh();
  }, []);

  async function buy(pack: CreditPack) {
    setError("");
    setNotice("");
    setPayHint("");
    setBuying(pack.id);
    setAwaitingPay(null);
    try {
      if (payWithMpesa && mpesaPhone.trim().length < 9) {
        throw new Error("Enter your M-Pesa phone number (Safaricom).");
      }
      const res = await purchaseCredits(pack.id, {
        gateway: "auto",
        phone: mpesaPhone.trim() || undefined,
      });

      if (res.pending && res.payment?.id) {
        const rz = res.payment.razorpay;
        if (
          (res.payment.gateway === "razorpay" || payWithRazorpay) &&
          rz?.keyId &&
          rz?.orderId &&
          rz?.amountPaise
        ) {
          setPayHint(
            res.instructions || "Complete payment in the Razorpay window…"
          );
          setAwaitingPay("razorpay");
          await new Promise((r) => setTimeout(r, 150));
          const user = getUser();
          const checkout = await openRazorpayCheckout({
            key: rz.keyId,
            orderId: rz.orderId,
            amountPaise: rz.amountPaise,
            currency: pack.currency || "INR",
            description: `zimji credits — ${pack.label}`,
            prefill: {
              email: user?.email || undefined,
              contact:
                user?.phone || user?.business?.whatsapp || undefined,
              name: user?.business?.name || undefined,
            },
          });
          await verifyRazorpayPayment({
            paymentId: res.payment.id,
            razorpay_order_id: checkout.razorpay_order_id,
            razorpay_payment_id: checkout.razorpay_payment_id,
            razorpay_signature: checkout.razorpay_signature,
          });
          notifyCreditsChanged();
          try {
            await downloadCreditInvoice(res.payment.id);
          } catch {
            // optional
          }
          setAwaitingPay(null);
          setNotice(`Payment received. Credits added for ${pack.label}.`);
          toast.success(`Payment received — credits added for ${pack.label}`);
          await refresh();
          return;
        }

        setPayHint(
          res.instructions ||
            "Approve the M-Pesa prompt on your phone, then wait here."
        );
        setAwaitingPay("mpesa");
        await new Promise((r) => setTimeout(r, 150));
        await waitForPayment(res.payment.id, {
          timeoutMs: 90_000,
          intervalMs: 4000,
        });
        notifyCreditsChanged();
        try {
          await downloadCreditInvoice(res.payment.id);
        } catch {
          // optional
        }
        setAwaitingPay(null);
        setNotice(`Payment received. Credits added for ${pack.label}.`);
        toast.success(`Payment received — credits added for ${pack.label}`);
        await refresh();
        return;
      }

      setNotice(
        `Added ${res.credited} credits. New balance: ${res.balance}. Invoice downloaded.`
      );
      toast.success(
        `Added ${res.credited} credits — balance ${res.balance}`
      );
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Purchase failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setBuying(null);
      setAwaitingPay(null);
    }
  }

  if (awaitingPay === "mpesa") {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="card mx-auto max-w-lg rounded-2xl p-8 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-sage/30 border-t-sage" />
          <h2 className="mt-5 font-display text-2xl font-semibold text-ink">
            Confirm on M-Pesa
          </h2>
          <p className="mt-3 text-sm text-ink-muted">
            {payHint ||
              "Enter your PIN on the Safaricom prompt. This page updates when payment clears."}
          </p>
          <ul className="mt-5 space-y-2 text-left text-xs text-ink-muted">
            <li>1. Keep this tab open.</li>
            <li>
              2. On the phone (or Daraja STK simulator), open the M-Pesa prompt.
            </li>
            <li>
              3. Sandbox test PIN is often{" "}
              <span className="font-semibold text-ink">174379</span>.
            </li>
            <li>
              4. Approve within ~30 seconds or Safaricom returns “DS timeout”.
            </li>
          </ul>
        </div>
      </div>
    );
  }

  if (awaitingPay === "razorpay") {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="card mx-auto max-w-lg rounded-2xl p-8 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-sage/30 border-t-sage" />
          <h2 className="mt-5 font-display text-2xl font-semibold text-ink">
            Complete Razorpay payment
          </h2>
          <p className="mt-3 text-sm text-ink-muted">
            {payHint ||
              "Finish UPI / card payment in the Razorpay window. This page continues when it succeeds."}
          </p>
        </div>
      </div>
    );
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

      {payWithMpesa && (
        <label className="mt-4 block max-w-md text-sm">
          <span className="font-medium text-ink">M-Pesa phone</span>
          <input
            type="tel"
            value={mpesaPhone}
            onChange={(e) => setMpesaPhone(e.target.value)}
            placeholder="07XX XXX XXX"
            className="mt-1.5 w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-ink outline-none focus:border-sage dark:border-white/15 dark:bg-[#12100e]"
          />
        </label>
      )}

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
                {buying === p.id
                  ? awaitingPay
                    ? awaitingPay === "razorpay"
                      ? "Waiting for Razorpay…"
                      : "Waiting for M-Pesa…"
                    : "Processing…"
                  : payWithRazorpay
                    ? "Pay with Razorpay"
                    : payWithMpesa
                      ? "Pay with M-Pesa"
                      : "Buy"}
              </button>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-ink-muted">
        {payWithRazorpay
          ? "A Razorpay window will open for UPI, card, or netbanking."
          : payWithMpesa
            ? "You will receive an M-Pesa STK prompt on your phone to enter your PIN."
            : "Demo mode: payment completes instantly until a live gateway is enabled for your market."}
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
                      e.amount > 0
                        ? "bg-sage/15 text-sage-dark"
                        : "bg-ink/5 text-ink-muted"
                    }`}
                  >
                    {LEDGER_LABEL[e.type] || e.type}
                  </span>
                  <span
                    className={`font-semibold ${
                      e.amount > 0 ? "text-sage-dark" : "text-ink"
                    }`}
                  >
                    {e.amount > 0 ? "+" : ""}
                    {e.amount}
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
                      {e.amount > 0 ? "+" : ""}
                      {e.amount}
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
