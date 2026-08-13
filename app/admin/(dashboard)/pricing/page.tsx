"use client";

import { useEffect, useState } from "react";
import {
  getPricing,
  updatePricing,
  type B2cPack,
  type CreditPack,
} from "@/lib/admin";
import { LIMITS } from "@/lib/limits";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-ink-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-sage";

export default function AdminPricingPage() {
  const [b2c, setB2c] = useState<B2cPack[]>([]);
  const [credits, setCredits] = useState<CreditPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    getPricing()
      .then((r) => {
        setB2c(r.pricing.b2cPacks);
        setCredits(r.pricing.creditPacks);
      })
      .catch((e) =>
        setMsg({ ok: false, text: e instanceof Error ? e.message : "Load failed" })
      )
      .finally(() => setLoading(false));
  }, []);

  function updateB2c(i: number, patch: Partial<B2cPack>) {
    setB2c((arr) => arr.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  function updateCredit(i: number, patch: Partial<CreditPack>) {
    setCredits((arr) => arr.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  function addB2c() {
    setB2c((a) => [
      ...a,
      { id: `pack${a.length + 1}`, label: "New pack", images: 1, amount: 0, currency: "KES" },
    ]);
  }
  function addCredit() {
    setCredits((a) => [
      ...a,
      { id: `bundle${a.length + 1}`, label: "New bundle", credits: 10, amount: 0, currency: "KES" },
    ]);
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const r = await updatePricing({ b2cPacks: b2c, creditPacks: credits });
      setB2c(r.pricing.b2cPacks);
      setCredits(r.pricing.creditPacks);
      setMsg({ ok: true, text: "Pricing saved" });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  if (loading) {
    return <div className="p-8 text-ink-muted">Loading pricing…</div>;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-end gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      {msg && (
        <div
          className={`mt-4 rounded-xl px-4 py-2.5 text-sm ${
            msg.ok
              ? "border border-sage/30 bg-sage/10 text-sage-dark"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* B2C packs */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">
            B2C — pay per image
          </h2>
          <button
            onClick={addB2c}
            className="rounded-lg border border-ink/15 px-3 py-1.5 text-sm font-semibold text-ink transition hover:border-sage"
          >
            + Add pack
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {b2c.map((p, i) => (
            <div
              key={i}
              className="grid grid-cols-2 gap-3 rounded-2xl border border-ink/10 bg-white p-4 md:grid-cols-6"
            >
              <Field label="ID">
                <input
                  className={inputCls}
                  maxLength={40}
                  value={p.id}
                  onChange={(e) => updateB2c(i, { id: e.target.value })}
                />
              </Field>
              <Field label="Label">
                <input
                  className={inputCls}
                  maxLength={LIMITS.packLabel}
                  value={p.label}
                  onChange={(e) => updateB2c(i, { label: e.target.value })}
                />
              </Field>
              <Field label="Images">
                <input
                  type="number"
                  min={1}
                  className={inputCls}
                  value={p.images}
                  onChange={(e) =>
                    updateB2c(i, { images: parseInt(e.target.value || "0", 10) })
                  }
                />
              </Field>
              <Field label="Amount">
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={p.amount}
                  onChange={(e) =>
                    updateB2c(i, { amount: parseFloat(e.target.value || "0") })
                  }
                />
              </Field>
              <Field label="Currency">
                <input
                  className={inputCls}
                  maxLength={LIMITS.currency}
                  value={p.currency}
                  onChange={(e) => updateB2c(i, { currency: e.target.value })}
                />
              </Field>
              <div className="flex items-end">
                <button
                  onClick={() => setB2c((a) => a.filter((_, idx) => idx !== i))}
                  className="rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink-muted transition hover:border-red-300 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Credit bundles */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">
            B2B — credit bundles
          </h2>
          <button
            onClick={addCredit}
            className="rounded-lg border border-ink/15 px-3 py-1.5 text-sm font-semibold text-ink transition hover:border-sage"
          >
            + Add bundle
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {credits.map((p, i) => (
            <div
              key={i}
              className="grid grid-cols-2 gap-3 rounded-2xl border border-ink/10 bg-white p-4 md:grid-cols-6"
            >
              <Field label="ID">
                <input
                  className={inputCls}
                  maxLength={40}
                  value={p.id}
                  onChange={(e) => updateCredit(i, { id: e.target.value })}
                />
              </Field>
              <Field label="Label">
                <input
                  className={inputCls}
                  maxLength={LIMITS.packLabel}
                  value={p.label}
                  onChange={(e) => updateCredit(i, { label: e.target.value })}
                />
              </Field>
              <Field label="Credits">
                <input
                  type="number"
                  min={1}
                  className={inputCls}
                  value={p.credits}
                  onChange={(e) =>
                    updateCredit(i, { credits: parseInt(e.target.value || "0", 10) })
                  }
                />
              </Field>
              <Field label="Amount">
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={p.amount}
                  onChange={(e) =>
                    updateCredit(i, { amount: parseFloat(e.target.value || "0") })
                  }
                />
              </Field>
              <Field label="Currency">
                <input
                  className={inputCls}
                  maxLength={LIMITS.currency}
                  value={p.currency}
                  onChange={(e) => updateCredit(i, { currency: e.target.value })}
                />
              </Field>
              <div className="flex items-end">
                <button
                  onClick={() =>
                    setCredits((a) => a.filter((_, idx) => idx !== i))
                  }
                  className="rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink-muted transition hover:border-red-300 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
