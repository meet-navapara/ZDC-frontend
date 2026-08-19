"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { cancelPayment, getPayment } from "@/lib/b2c";
import { getToken } from "@/lib/auth";

function ReturnBody() {
  const params = useSearchParams();
  const router = useRouter();
  const paymentId = params.get("p") || "";
  const invoiceId = params.get("invoice_id") || undefined;
  const [message, setMessage] = useState("Checking payment…");
  const [state, setState] = useState<"wait" | "ok" | "fail">("wait");

  useEffect(() => {
    if (!paymentId) {
      setState("fail");
      setMessage("Missing payment reference.");
      return;
    }
    if (!getToken()) {
      setState("fail");
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
        const { payment } = await getPayment(paymentId, invoiceId);
        if (stopped) return;
        if (payment.status === "paid") {
          setState("ok");
          setMessage("Payment confirmed. Redirecting…");
          return finish(payment);
        }
        if (payment.status === "failed" || payment.status === "cancelled") {
          setState("fail");
          setMessage("Payment did not complete. You have not been charged.");
          return;
        }
        if (attempts < 20) {
          setMessage("Confirming payment with IntaSend…");
          setTimeout(tick, 1500);
          return;
        }
        setState("fail");
        setMessage(
          "We have not received confirmation yet. If you paid, check Payments in a moment — the webhook will still complete the order."
        );
      } catch (err) {
        if (stopped) return;
        setState("fail");
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
      <p className="mt-3 text-sm text-ink-muted">{message}</p>
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
