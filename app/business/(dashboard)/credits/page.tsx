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
import { PageLoader } from "@/components/PageLoader";
import { CheckoutCoupon } from "@/components/CheckoutCoupon";
import type { CouponQuote } from "@/lib/coupons";

const LEDGER_LABEL: Record<LedgerEntry["type"], string> = {
  purchase: "Purchase",
  consume: "Try-on",
  adjust: "Adjustment",
};

const CREDIT_BENEFITS = [
  {
    icon: "✦",
    title: "Instant renders",
    desc: "1 credit powers one full virtual try-on for your customers.",
  },
  {
    icon: "∞",
    title: "Never expire",
    desc: "Credits stay on your account until you use them — no rush.",
  },
  {
    icon: "↓",
    title: "Invoice included",
    desc: "A PDF receipt downloads automatically after every purchase.",
  },
] as const;

const LEDGER_PAGE_SIZE = 10;

export default function CreditsPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [ledgerTotalPages, setLedgerTotalPages] = useState(1);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [defaultGateway, setDefaultGateway] = useState("stub");
  const [mpesaEnabled, setMpesaEnabled] = useState(false);
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [allowGatewayChoice, setAllowGatewayChoice] = useState(false);
  const [dualPrices, setDualPrices] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<
    "mpesa" | "razorpay" | "stub" | "auto"
  >("auto");
  const [sandboxAutoPaid, setSandboxAutoPaid] = useState(false);
  const [mpesaSandbox, setMpesaSandbox] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState(
    () => getUser()?.phone || getUser()?.business?.whatsapp || ""
  );
  const [awaitingPay, setAwaitingPay] = useState<
    null | "mpesa" | "razorpay"
  >(null);
  const [payHint, setPayHint] = useState("");
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [couponQuote, setCouponQuote] = useState<CouponQuote | null>(null);
  const [couponCode, setCouponCode] = useState("");

  const selectedPack =
    packs.find((p) => p.id === selectedPackId) ?? packs[1] ?? packs[0] ?? null;

  const payGateway =
    selectedGateway === "auto" ? defaultGateway : selectedGateway;
  const payWithMpesa = payGateway === "mpesa";
  const payWithRazorpay = payGateway === "razorpay";

  function packDisplay(p: CreditPack) {
    if (payGateway === "razorpay") {
      return {
        amount:
          p.amountInr ?? p.prices?.INR?.amount ?? p.amount,
        currency: "INR",
      };
    }
    if (payGateway === "mpesa") {
      return {
        amount:
          p.amountKes ?? p.prices?.KES?.amount ?? p.amount,
        currency: "KES",
      };
    }
    return { amount: p.amount, currency: p.currency };
  }

  const selectedDisplay = selectedPack ? packDisplay(selectedPack) : null;
  const displayAmount = selectedDisplay?.amount ?? 0;
  const displayCurrency = selectedDisplay?.currency ?? "KES";
  const payableAmount =
    couponQuote &&
    couponQuote.currency === displayCurrency &&
    couponQuote.subtotal === Number(displayAmount)
      ? couponQuote.finalAmount
      : displayAmount;

  useEffect(() => {
    setCouponQuote(null);
    setCouponCode("");
  }, [selectedPack?.id, displayCurrency, displayAmount]);
  const perCredit =
    selectedPack && selectedDisplay
      ? (selectedDisplay.amount / selectedPack.credits).toFixed(1)
      : null;
  const canPay =
    !!selectedPack &&
    !buying &&
    (!payWithMpesa || mpesaPhone.trim().length >= 9);

  const payButtonLabel = buying
    ? payWithRazorpay
      ? "Opening Razorpay…"
      : payWithMpesa
        ? "Sending STK prompt…"
        : "Processing…"
    : selectedPack
      ? payWithMpesa
        ? `Pay with M-Pesa · ${displayCurrency} ${payableAmount}`
        : payWithRazorpay
          ? `Pay with Razorpay · ${displayCurrency} ${payableAmount}`
          : `Pay ${displayCurrency} ${payableAmount}`
      : "Select a pack";

  const shortPayLabel = buying
    ? "Processing…"
    : selectedPack
      ? `Pay · ${displayCurrency} ${payableAmount}`
      : "Select pack";

  const showGatewayPicker =
    allowGatewayChoice || (mpesaEnabled && razorpayEnabled);

  async function fetchLedger(page: number) {
    setLedgerLoading(true);
    try {
      const r = await getLedger({ page, limit: LEDGER_PAGE_SIZE });
      setLedger(r.ledger);
      setLedgerTotal(r.total);
      setLedgerTotalPages(r.totalPages);
      setLedgerPage(r.page);
    } catch {
      setLedger([]);
      setLedgerTotal(0);
      setLedgerTotalPages(1);
    } finally {
      setLedgerLoading(false);
    }
  }

  async function refresh() {
    const b = await getBalance().catch(() => ({ balance: 0 }));
    setBalance(b.balance);
    if (ledgerPage !== 1) {
      setLedgerPage(1);
    } else {
      await fetchLedger(1);
    }
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getCreditPacks()
        .then((r) => {
          if (!cancelled) {
            setPacks(r.packs);
            setDualPrices(Boolean(r.dualPrices));
            if (r.packs.length) {
              setSelectedPackId((prev) => {
                if (prev && r.packs.some((p) => p.id === prev)) return prev;
                return r.packs[1]?.id ?? r.packs[0]?.id ?? null;
              });
            }
          }
        })
        .catch(() => {
          if (!cancelled) setPacks([]);
        }),
      listPaymentMethods()
        .then((r) => {
          if (cancelled) return;
          setPaymentNotice(r.paymentNotice || null);
          const def = r.defaultGateway || "stub";
          setDefaultGateway(def);
          setMpesaEnabled(Boolean(r.mpesaEnabled));
          setRazorpayEnabled(Boolean(r.razorpayEnabled));
          setAllowGatewayChoice(Boolean(r.allowGatewayChoice));
          setSandboxAutoPaid(Boolean(r.sandboxAutoPaid));
          setMpesaSandbox(Boolean(r.mpesaSandbox));
          const gateway =
            def === "mpesa" || def === "razorpay" || def === "stub" || def === "auto"
              ? def
              : "stub";
          setSelectedGateway(
            r.allowGatewayChoice
              ? gateway === "razorpay" || gateway === "mpesa"
                ? gateway
                : r.mpesaEnabled
                  ? "mpesa"
                  : "razorpay"
              : gateway
          );
        })
        .catch(() => {}),
      getBalance()
        .then((b) => {
          if (!cancelled) setBalance(b.balance);
        })
        .catch(() => {
          if (!cancelled) setBalance(0);
        }),
    ]).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLedgerLoading(true);
    getLedger({ page: ledgerPage, limit: LEDGER_PAGE_SIZE })
      .then((r) => {
        if (cancelled) return;
        setLedger(r.ledger);
        setLedgerTotal(r.total);
        setLedgerTotalPages(r.totalPages);
      })
      .catch(() => {
        if (!cancelled) {
          setLedger([]);
          setLedgerTotal(0);
          setLedgerTotalPages(1);
        }
      })
      .finally(() => {
        if (!cancelled) setLedgerLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ledgerPage]);

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
        gateway:
          payGateway === "mpesa" || payGateway === "razorpay"
            ? payGateway
            : "auto",
        phone: mpesaPhone.trim() || undefined,
        couponCode: couponCode || undefined,
      });

      const { currency: chargeCurrency } = packDisplay(pack);

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
            currency: chargeCurrency,
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

  if (loading) {
    return <PageLoader label="Loading credits…" />;
  }

  const ledgerStart =
    ledgerTotal === 0 ? 0 : (ledgerPage - 1) * LEDGER_PAGE_SIZE + 1;
  const ledgerEnd = Math.min(ledgerPage * LEDGER_PAGE_SIZE, ledgerTotal);

  if (awaitingPay === "mpesa") {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="card mx-auto max-w-lg overflow-hidden rounded-2xl sm:rounded-3xl">
          <div className="border-b border-ink/8 bg-sage/5 px-6 py-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sage">
              Payment in progress
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
              Confirm on M-Pesa
            </h2>
          </div>
          <div className="px-6 py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sage/10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-sage/30 border-t-sage" />
            </div>
            <p className="mt-5 text-sm text-ink-muted">
              {payHint ||
                "Enter your PIN on the Safaricom prompt. This page updates when payment clears."}
            </p>
            <ul className="mt-6 space-y-2 rounded-xl bg-ink/[0.03] px-4 py-4 text-left text-xs text-ink-muted">
              <li>1. Keep this tab open.</li>
              <li>
                2. On your phone, open the M-Pesa STK prompt.
              </li>
              {mpesaSandbox && !sandboxAutoPaid && (
                <li>
                  3. Sandbox test PIN is often{" "}
                  <span className="font-semibold text-ink">174379</span>.
                </li>
              )}
              <li>
                {mpesaSandbox && !sandboxAutoPaid ? "4" : "3"}. Approve within
                ~30 seconds.
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (awaitingPay === "razorpay") {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="card mx-auto max-w-lg overflow-hidden rounded-2xl sm:rounded-3xl">
          <div className="border-b border-ink/8 bg-sage/5 px-6 py-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sage">
              Payment in progress
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
              Complete Razorpay payment
            </h2>
          </div>
          <div className="px-6 py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sage/10 text-2xl font-bold text-sage">
              ₹
            </div>
            <div className="mx-auto mt-4 h-8 w-8 animate-spin rounded-full border-2 border-sage/30 border-t-sage" />
            <p className="mt-5 text-sm text-ink-muted">
              {payHint ||
                "Finish UPI / card payment in the Razorpay window. This page continues when it succeeds."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl pb-28 lg:pb-0">
      <div className="card flex flex-col gap-1 rounded-2xl bg-sage/5 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-sage-dark">
            Current balance
          </div>
          <div className="mt-1 font-display text-4xl font-semibold text-ink sm:text-5xl">
            {balance ?? 0}
          </div>
        </div>
        <p className="text-sm text-ink-muted">1 credit = 1 try-on render</p>
      </div>

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

      <div className="mt-8 flex flex-col gap-10">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sage">
                Step 1
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold text-ink sm:text-2xl">
                Choose a credit pack
              </h2>
            </div>
            {dualPrices && (
              <p className="text-xs text-ink-muted">
                Prices shown in {displayCurrency}
              </p>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {packs.map((p, i) => {
              const { amount, currency } = packDisplay(p);
              const unit = (amount / p.credits).toFixed(1);
              const selected = selectedPack?.id === p.id;
              const best = i === 1;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPackId(p.id)}
                  className={`relative flex flex-col rounded-2xl border p-5 text-left transition ${
                    selected
                      ? "border-sage bg-sage/5 shadow-md ring-2 ring-sage/25 dark:bg-sage/10"
                      : "border-ink/10 bg-white/80 hover:border-sage/40 hover:shadow-md dark:border-white/10 dark:bg-[#181511]"
                  }`}
                >
                  {best && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sage px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-paper">
                      Best value
                    </span>
                  )}
                  {selected && (
                    <span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-sage text-sm font-bold text-paper">
                      ✓
                    </span>
                  )}
                  <span className="text-xs font-semibold uppercase tracking-[0.15em] text-sage">
                    {p.label}
                  </span>
                  <span className="mt-3 font-display text-3xl font-semibold text-ink">
                    {p.credits}
                    <span className="ml-1.5 text-base font-normal text-ink-muted">
                      credits
                    </span>
                  </span>
                  <span className="mt-2 font-display text-xl font-semibold text-sage-dark">
                    {currency} {amount}
                  </span>
                  <span className="mt-1 text-sm text-ink-muted">
                    ~{currency} {unit}/credit
                  </span>
                  {dualPrices && p.amountKes != null && p.amountInr != null && (
                    <span className="mt-2 text-xs text-ink-muted/80">
                      KES {p.amountKes} · ₹{p.amountInr}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="space-y-5">
          <div className="card overflow-hidden rounded-2xl sm:rounded-3xl">
            <div className="border-b border-ink/8 bg-sage/5 px-5 py-4 sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sage">
                Step 2
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold text-ink sm:text-xl">
                Complete payment
              </h3>
              <p className="mt-1 text-sm text-ink-muted">
                Secure checkout — credits land instantly after payment clears.
              </p>
            </div>

            <div className="space-y-5 p-5 sm:p-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8 lg:space-y-0">
              <div className="space-y-5">
              {paymentNotice && (
                <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100">
                  {paymentNotice}
                </div>
              )}

              {showGatewayPicker && (
                <div className="space-y-3">
                  <span className="text-sm font-semibold text-ink">
                    Pay with
                  </span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {mpesaEnabled && (
                      <button
                        type="button"
                        onClick={() => setSelectedGateway("mpesa")}
                        className={`flex items-center gap-4 rounded-2xl border-2 px-4 py-4 text-left transition ${
                          payGateway === "mpesa"
                            ? "border-sage bg-sage/10 shadow-sm ring-2 ring-sage/20"
                            : "border-ink/12 bg-white hover:border-sage/40 dark:border-white/12 dark:bg-[#12100e]"
                        }`}
                      >
                        <span
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                            payGateway === "mpesa"
                              ? "bg-sage text-paper"
                              : "bg-ink/5 text-ink-muted"
                          }`}
                        >
                          M
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-base font-semibold text-ink">
                            M-Pesa
                          </span>
                          <span className="mt-0.5 block text-sm text-ink-muted">
                            Kenya · KES · STK push to your phone
                          </span>
                        </span>
                        {payGateway === "mpesa" && (
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage text-xs font-bold text-paper">
                            ✓
                          </span>
                        )}
                      </button>
                    )}
                    {razorpayEnabled && (
                      <button
                        type="button"
                        onClick={() => setSelectedGateway("razorpay")}
                        className={`flex items-center gap-4 rounded-2xl border-2 px-4 py-4 text-left transition ${
                          payGateway === "razorpay"
                            ? "border-sage bg-sage/10 shadow-sm ring-2 ring-sage/20"
                            : "border-ink/12 bg-white hover:border-sage/40 dark:border-white/12 dark:bg-[#12100e]"
                        }`}
                      >
                        <span
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                            payGateway === "razorpay"
                              ? "bg-sage text-paper"
                              : "bg-ink/5 text-ink-muted"
                          }`}
                        >
                          ₹
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-base font-semibold text-ink">
                            Razorpay
                          </span>
                          <span className="mt-0.5 block text-sm text-ink-muted">
                            India · INR · UPI, card, or netbanking
                          </span>
                        </span>
                        {payGateway === "razorpay" && (
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage text-xs font-bold text-paper">
                            ✓
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {payWithMpesa && (
                <label className="block text-sm">
                  <span className="font-semibold text-ink">M-Pesa phone</span>
                  <input
                    type="tel"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    placeholder="07XX XXX XXX or +254…"
                    className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-base text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 dark:border-white/15 dark:bg-[#12100e]"
                  />
                  <span className="mt-1.5 block text-xs text-ink-muted">
                    Safaricom number that will receive the STK PIN prompt
                  </span>
                </label>
              )}

              <button
                type="button"
                onClick={() => selectedPack && buy(selectedPack)}
                disabled={!canPay}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-sage py-4 text-base font-semibold text-paper shadow-lg shadow-sage/25 transition hover:bg-sage-dark hover:shadow-sage/35 disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none"
              >
                {buying && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper" />
                )}
                {payButtonLabel}
              </button>
              </div>

              <div className="space-y-5 lg:border-l lg:border-ink/10 lg:pl-8">
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-ink-muted">Pack</dt>
                  <dd className="font-medium text-ink">
                    {selectedPack?.label ?? "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-ink-muted">Credits</dt>
                  <dd className="font-medium text-ink">
                    {selectedPack?.credits ?? "—"}
                  </dd>
                </div>
                {perCredit && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-ink-muted">Rate</dt>
                    <dd className="font-medium text-ink">
                      {displayCurrency} {perCredit}/credit
                    </dd>
                  </div>
                )}
              </dl>

              <div className="flex items-end justify-between gap-4">
                <span className="text-sm font-semibold text-ink">
                  Total payable
                </span>
                <span className="font-display text-2xl font-semibold text-ink sm:text-3xl">
                  {selectedPack
                    ? `${displayCurrency} ${payableAmount}`
                    : "—"}
                </span>
              </div>
              {couponQuote && payableAmount !== displayAmount && (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-ink-muted">
                    <span>Subtotal</span>
                    <span>
                      {displayCurrency} {displayAmount}
                    </span>
                  </div>
                  <div className="flex justify-between text-sage-dark">
                    <span>Coupon: {couponQuote.coupon.code}</span>
                    <span>
                      −{displayCurrency} {couponQuote.discountAmount}
                    </span>
                  </div>
                </div>
              )}
              <CheckoutCoupon
                packId={selectedPack?.id}
                amount={displayAmount}
                currency={displayCurrency}
                quote={couponQuote}
                onQuote={(q, code) => {
                  setCouponQuote(q);
                  setCouponCode(code);
                }}
              />

              <p className="text-center text-xs leading-relaxed text-ink-muted lg:text-left">
                {allowGatewayChoice
                  ? "M-Pesa or Razorpay — not limited to your registration country."
                  : payWithRazorpay
                    ? "A Razorpay window opens for UPI, card, or netbanking."
                    : payWithMpesa
                      ? "You will receive an M-Pesa STK prompt on your phone."
                      : "Demo mode: payment completes instantly on this device."}
              </p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-sage/15 bg-gradient-to-br from-sage/[0.12] via-white to-[#faf8f4] shadow-sm dark:border-sage/20 dark:from-sage/10 dark:via-[#14120f] dark:to-[#12100e] sm:rounded-3xl">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-sage/20 blur-3xl dark:bg-sage/10"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-[#d4c4a8]/30 blur-3xl dark:bg-sage/5"
              aria-hidden
            />

            <div className="relative border-b border-sage/10 px-5 py-5 sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sage">
                Included with every pack
              </p>
              <h4 className="mt-1 font-display text-xl font-semibold text-ink sm:text-2xl">
                What you get
              </h4>
            </div>

            <ul className="relative grid gap-4 p-5 sm:grid-cols-3 sm:gap-5 sm:p-6">
              {CREDIT_BENEFITS.map((item) => (
                <li
                  key={item.title}
                  className="group flex flex-col rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_8px_30px_-18px_rgba(28,26,22,0.25)] transition duration-200 hover:-translate-y-0.5 hover:border-sage/35 hover:shadow-[0_16px_40px_-20px_rgba(92,122,104,0.35)] dark:border-white/10 dark:bg-[#181511]/90 dark:hover:border-sage/40"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage text-lg font-bold text-paper shadow-lg shadow-sage/30 transition group-hover:scale-105">
                    {item.icon}
                  </span>
                  <span className="mt-4 font-display text-base font-semibold text-ink">
                    {item.title}
                  </span>
                  <span className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                    {item.desc}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-paper/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-[#0c0b09]/95 lg:hidden">
        <div className="mx-auto max-w-5xl space-y-2">
          {showGatewayPicker && (
            <div className="flex gap-2">
              {mpesaEnabled && (
                <button
                  type="button"
                  onClick={() => setSelectedGateway("mpesa")}
                  className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition ${
                    payGateway === "mpesa"
                      ? "border-sage bg-sage/10 text-sage-dark"
                      : "border-ink/12 text-ink"
                  }`}
                >
                  M-Pesa · KES
                </button>
              )}
              {razorpayEnabled && (
                <button
                  type="button"
                  onClick={() => setSelectedGateway("razorpay")}
                  className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition ${
                    payGateway === "razorpay"
                      ? "border-sage bg-sage/10 text-sage-dark"
                      : "border-ink/12 text-ink"
                  }`}
                >
                  Razorpay · INR
                </button>
              )}
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-ink-muted">
                {selectedPack
                  ? `${selectedPack.label} · ${selectedPack.credits} credits`
                  : "Select a pack above"}
              </p>
              <p className="font-display text-lg font-semibold text-ink">
                {selectedPack
                  ? `${displayCurrency} ${payableAmount}`
                  : "—"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => selectedPack && buy(selectedPack)}
              disabled={!canPay}
              className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-sage px-5 py-3 text-sm font-semibold text-paper shadow-lg shadow-sage/25 transition hover:bg-sage-dark disabled:cursor-not-allowed disabled:opacity-55"
            >
              {buying && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-paper/40 border-t-paper" />
              )}
              {shortPayLabel}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">
          Transaction history
        </h2>
        {ledgerTotal > 0 && (
          <p className="text-sm text-ink-muted">
            {ledgerTotal} record{ledgerTotal === 1 ? "" : "s"} total
          </p>
        )}
      </div>

      {ledger.length === 0 && !ledgerLoading ? (
        <div className="card mt-4 rounded-2xl px-5 py-6 text-sm text-ink-muted">
          No transactions yet.
        </div>
      ) : (
        <>
          <ul className="mt-4 space-y-3 md:hidden">
            {ledger.map((e, i) => (
              <li key={e.id} className="card rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink/5 text-xs font-semibold text-ink-muted">
                      {ledgerStart + i}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        e.amount > 0
                          ? "bg-sage/15 text-sage-dark"
                          : "bg-ink/5 text-ink-muted"
                      }`}
                    >
                      {LEDGER_LABEL[e.type] || e.type}
                    </span>
                  </div>
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
                  {new Date(e.createdAt).toLocaleString()} · balance{" "}
                  {e.balanceAfter}
                </p>
              </li>
            ))}
          </ul>

          <div className="card mt-4 hidden overflow-hidden rounded-2xl md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-ink/10 bg-sage/[0.06] text-xs uppercase tracking-wider text-ink-muted">
                  <tr>
                    <th className="w-12 px-4 py-3.5 font-semibold">#</th>
                    <th className="px-4 py-3.5 font-semibold">Type</th>
                    <th className="px-4 py-3.5 font-semibold">Change</th>
                    <th className="px-4 py-3.5 font-semibold">Balance</th>
                    <th className="px-4 py-3.5 font-semibold">Note</th>
                    <th className="px-4 py-3.5 font-semibold">When</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-ink-muted"
                      >
                        <span className="inline-flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-sage/30 border-t-sage" />
                          Loading transactions…
                        </span>
                      </td>
                    </tr>
                  ) : (
                    ledger.map((e, i) => (
                      <tr
                        key={e.id}
                        className="border-b border-ink/5 transition last:border-0 even:bg-ink/[0.02] hover:bg-sage/[0.04]"
                      >
                        <td className="px-4 py-3.5 font-medium tabular-nums text-ink-muted">
                          {ledgerStart + i}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              e.amount > 0
                                ? "bg-sage/15 text-sage-dark"
                                : "bg-ink/5 text-ink-muted"
                            }`}
                          >
                            {LEDGER_LABEL[e.type] || e.type}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3.5 font-semibold tabular-nums ${
                            e.amount > 0 ? "text-sage-dark" : "text-ink"
                          }`}
                        >
                          {e.amount > 0 ? "+" : ""}
                          {e.amount}
                        </td>
                        <td className="px-4 py-3.5 tabular-nums">
                          {e.balanceAfter}
                        </td>
                        <td className="max-w-xs truncate px-4 py-3.5 text-ink-muted">
                          {e.note || "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-ink-muted">
                          {new Date(e.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {ledgerTotalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-ink/10 bg-ink/[0.02] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-ink-muted">
                  Showing{" "}
                  <span className="font-medium text-ink">
                    {ledgerStart}–{ledgerEnd}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-ink">{ledgerTotal}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
                    disabled={ledgerPage <= 1 || ledgerLoading}
                    className="rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-sage/40 hover:bg-sage/5 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-[#181511]"
                  >
                    Previous
                  </button>
                  <span className="min-w-[7rem] text-center text-sm text-ink-muted">
                    Page{" "}
                    <span className="font-semibold text-ink">{ledgerPage}</span>{" "}
                    of{" "}
                    <span className="font-semibold text-ink">
                      {ledgerTotalPages}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setLedgerPage((p) => Math.min(ledgerTotalPages, p + 1))
                    }
                    disabled={
                      ledgerPage >= ledgerTotalPages || ledgerLoading
                    }
                    className="rounded-full bg-sage px-4 py-2 text-sm font-semibold text-paper transition hover:bg-sage-dark disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {ledgerTotalPages > 1 && (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-ink/10 bg-ink/[0.02] px-4 py-3.5 md:hidden">
              <p className="text-center text-sm text-ink-muted">
                {ledgerStart}–{ledgerEnd} of {ledgerTotal}
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
                  disabled={ledgerPage <= 1 || ledgerLoading}
                  className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold disabled:opacity-45"
                >
                  Previous
                </button>
                <span className="text-sm text-ink-muted">
                  {ledgerPage} / {ledgerTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setLedgerPage((p) => Math.min(ledgerTotalPages, p + 1))
                  }
                  disabled={ledgerPage >= ledgerTotalPages || ledgerLoading}
                  className="rounded-full bg-sage px-4 py-2 text-sm font-semibold text-paper disabled:opacity-45"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
