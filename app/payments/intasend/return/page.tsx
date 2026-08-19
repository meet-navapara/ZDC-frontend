"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { cancelPayment, getPayment } from "@/lib/b2c";
import { getToken } from "@/lib/auth";

type FailReason = "not_paid" | "timeout" | "cancelled" | "auth" | null;

function ReturnBody() {
  const params = useSearchParams();
  const router = useRouter();
  const paymentId = params.get("p") || "";
  const invoiceId = params.get("invoice_id") || params.get("invoice") || undefined;
  const checkoutId = params.get("checkout_id") || undefined;
  const [message, setMessage] = useState("Checking payment…");
  const [state, setState] = useState<"wait" | "ok" | "fail">("wait");
  const [failReason, setFailReason] = useState<FailReason>(null);

  useEffect(() => {
    if (!paymentId) {
      setState("fail");
      setFailReason("auth");
      setMessage("Missing payment reference.");
      return;
    }
    if (!getToken()) {
      setState("fail");
      setFailReason("auth");
      setMessage("Please log in to see this payment.");
      return;
    }

    let stopped = false;
    let attempts = 0;

    function finish(payment: { purpose: string; job: string | null }) {
      const href =
        payment.purpose === "b2b_credits"
          ? "/business/credits?paid=1"
          : payment.job
            ? `/app/try-on?job=${payment.job}`
            : "/app/payments";
      setTimeout(() => router.replace(href), 800);
    }

    async function tick() {
      attempts += 1;
      try {
        const { payment } = await getPayment(paymentId, invoiceId, checkoutId);
        if (stopped) return;
        if (payment.status === "paid") {
          setState("ok");
          setMessage("Payment confirmed. Redirecting…");
          return finish(payment);
        }
        if (payment.status === "failed") {
          setState("fail");
          setFailReason("not_paid");
          setMessage("IntaSend marked this payment as failed. You have not been charged.");
          return;
        }
        if (payment.status === "cancelled") {
          setState("fail");
          setFailReason("cancelled");
          setMessage("Payment was cancelled.");
          return;
        }
        if (attempts < 40) {
          setMessage(`Confirming payment with IntaSend… (attempt ${attempts}/40)`);
          setTimeout(tick, 2000);
          return;
        }
        setState("fail");
        setFailReason("timeout");
        setMessage(
          "IntaSend did not confirm payment after 80 seconds."
        );
      } catch (err) {
        if (stopped) return;
        setState("fail");
        setFailReason("not_paid");
        setMessage(err instanceof Error ? err.message : "Could not verify payment.");
      }
    }

    tick();
    return () => {
      stopped = true;
    };
  }, [paymentId, invoiceId, router]);

  return (
    <section className="mx-auto w-full max-w-lg rounded-2xl border border-ink/10 bg-white/50 p-6 dark:border-white/10 dark:bg-[#14120f] sm:p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sage">
        IntaSend
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
        {state === "ok"
          ? "Payment complete"
          : state === "fail"
            ? "Payment not complete"
            : "Please wait"}
      </h1>

      {state === "wait" && (
        <div className="mt-4 flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-sage/20 border-t-sage" />
          <p className="text-sm text-ink-muted">{message}</p>
        </div>
      )}

      {state === "ok" && (
        <p className="mt-3 text-sm text-ink-muted">{message}</p>
      )}

      {state === "fail" && (
        <div className="mt-4 rounded-xl border border-red-300/60 bg-red-50 px-4 py-4 dark:border-red-500/30 dark:bg-red-950/40">
          <p className="text-sm font-semibold text-red-800 dark:text-red-200">
            {failReason === "timeout" ? "Payment confirmation timed out" : "Payment did not complete"}
          </p>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">{message}</p>

          {failReason === "timeout" && (
            <div className="mt-3 text-sm text-red-700 dark:text-red-300">
              <p className="font-medium">Common reasons:</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                <li>Card 3DS OTP was not entered on IntaSend&apos;s page</li>
                <li>M-Pesa STK push was not accepted on the phone</li>
                <li>The IntaSend tab was closed before completing payment</li>
              </ul>
              <p className="mt-3 font-medium">For sandbox testing:</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                <li>Use <strong>M-Pesa</strong> with number <code className="rounded bg-red-100 px-1 dark:bg-red-900">254708374149</code></li>
                <li>For card, use <code className="rounded bg-red-100 px-1 dark:bg-red-900">4456 5300 0000 1096</code> — set country to <strong>Kenya</strong></li>
              </ul>
              <p className="mt-3 text-xs text-red-600 dark:text-red-400">
                If you did pay successfully, your order will be confirmed automatically when IntaSend sends a webhook. Check <Link href="/app/payments" className="underline">your payments</Link> in a few minutes.
              </p>
            </div>
          )}

          {failReason === "cancelled" && (
            <p className="mt-2 text-sm text-red-700 dark:text-red-300">
              You cancelled the payment on IntaSend&apos;s page. No charge was made. Go back to try again.
            </p>
          )}

          {failReason === "not_paid" && (
            <p className="mt-2 text-sm text-red-700 dark:text-red-300">
              IntaSend could not process the payment. Check that your card details or M-Pesa number are correct and try again.
            </p>
          )}
        </div>
      )}

      {state !== "wait" && (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink dark:border-white/15 dark:text-[#e8e2d8]"
          >
            Home
          </Link>
          <Link
            href="/app/payments"
            className="rounded-full bg-sage px-4 py-2 text-sm font-semibold text-paper"
          >
            View payments
          </Link>
          {state === "fail" && paymentId && (
            <button
              type="button"
              onClick={() => cancelPayment(paymentId).catch(() => {})}
              className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink dark:border-white/15"
            >
              Cancel this checkout
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export default function IntasendReturnPage() {
  return (
    <main className="flex min-h-screen flex-col bg-paper dark:bg-[#0c0b09]">
      <AppHeader />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-12 pt-24 sm:px-6 sm:pt-28">
        <Suspense fallback={<p className="text-sm text-ink-muted">Loading payment status…</p>}>
          <ReturnBody />
        </Suspense>
      </div>
    </main>
  );
}
