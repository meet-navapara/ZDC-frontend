"use client";

import { useState } from "react";
import { validateCheckoutCoupon, type CouponQuote } from "@/lib/coupons";
import { toast } from "@/lib/toast";

type Props = {
  packId: string | undefined;
  amount: number | undefined;
  currency: string;
  quote: CouponQuote | null;
  onQuote: (quote: CouponQuote | null, code: string) => void;
};

export function CheckoutCoupon({ packId, amount, currency, quote, onQuote }: Props) {
  const [code, setCode] = useState(quote?.coupon.code || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function apply() {
    setError("");
    if (!packId || amount == null) {
      setError("Select a pack first.");
      return;
    }
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Enter a coupon code.");
      return;
    }
    setBusy(true);
    try {
      const result = await validateCheckoutCoupon({
        code: trimmed,
        packId,
        amount,
        currency,
      });
      onQuote(result, trimmed);
      toast.success("Coupon applied successfully.");
    } catch (e) {
      onQuote(null, "");
      const msg =
        e instanceof Error ? e.message : "Coupon is invalid or expired.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  function remove() {
    setCode("");
    setError("");
    onQuote(null, "");
  }

  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-ink">Have a coupon?</p>
      {quote ? (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-sage/25 bg-sage/10 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-sage-dark">{quote.coupon.code}</p>
            <p className="text-xs text-ink-muted">Coupon applied successfully.</p>
          </div>
          <button
            type="button"
            onClick={remove}
            className="shrink-0 text-xs font-semibold text-ink-muted underline-offset-2 hover:text-ink hover:underline"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="mt-2 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="SAVE20"
            maxLength={32}
            className="min-w-0 flex-1 rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm font-semibold tracking-wide text-ink outline-none focus:border-sage dark:border-white/15 dark:bg-[#12100e]"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                apply();
              }
            }}
          />
          <button
            type="button"
            onClick={apply}
            disabled={busy}
            className="rounded-xl border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-sage/40 hover:bg-sage/5 disabled:opacity-50"
          >
            {busy ? "Applying…" : "Apply"}
          </button>
        </div>
      )}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
