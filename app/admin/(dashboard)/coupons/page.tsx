"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CustomSelect } from "@/components/CustomSelect";
import { PageLoader } from "@/components/PageLoader";
import { toast } from "@/lib/toast";
import {
  listCoupons,
  createCoupon,
  updateCoupon,
  enableCoupon,
  disableCoupon,
  deleteCoupon,
  getPricing,
  type AdminCoupon,
  type CouponPayload,
  type CouponStats,
  type CouponDiscountType,
  type CouponScope,
} from "@/lib/admin";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-sage/15 text-sage-dark",
  inactive: "bg-ink/10 text-ink-muted",
  expired: "bg-amber-100 text-amber-800",
};

const emptyForm = (): CouponPayload & { packIds: string[] } => ({
  code: "",
  discountType: "percentage",
  discountValue: 20,
  discountValueInr: null,
  scope: "all",
  packIds: [],
  minimumPurchase: null,
  minimumPurchaseInr: null,
  maximumDiscount: null,
  maximumDiscountInr: null,
  usageLimit: 100,
  perUserLimit: 1,
  newUserOnly: false,
  startsAt: null,
  expiresAt: null,
  isActive: true,
});

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(v: string) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function numOrNull(v: string) {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function formatDiscount(c: AdminCoupon) {
  if (c.discountType === "percentage") {
    const cap =
      c.maximumDiscount != null
        ? ` (max KES ${c.maximumDiscount}${c.maximumDiscountInr != null ? ` / ₹${c.maximumDiscountInr}` : ""})`
        : "";
    return `${c.discountValue}%${cap}`;
  }
  return `KES ${c.discountValue}${c.discountValueInr != null ? ` / ₹${c.discountValueInr}` : ""}`;
}

function formatMoney(amount: number, currency: string) {
  if (currency === "INR") return `₹${amount}`;
  return `${currency} ${amount}`;
}

export default function AdminCouponsPage() {
  const [rows, setRows] = useState<AdminCoupon[]>([]);
  const [stats, setStats] = useState<CouponStats | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editor, setEditor] = useState<"create" | AdminCoupon | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [packOptions, setPackOptions] = useState<
    { id: string; label: string; group: string }[]
  >([]);

  const load = useCallback(() => {
    setLoading(true);
    listCoupons({ q, status, page, limit: 20 })
      .then((r) => {
        setRows(r.coupons);
        setPages(r.pages);
        setStats(r.stats);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [q, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getPricing()
      .then((r) => {
        const b2c = (r.pricing.b2cPacks || []).map((p) => ({
          id: p.id,
          label: p.label,
          group: "Try-on packs",
        }));
        const b2b = (r.pricing.creditPacks || []).map((p) => ({
          id: p.id,
          label: p.label,
          group: "Credit packs",
        }));
        setPackOptions([...b2c, ...b2b]);
      })
      .catch(() => {});
  }, []);

  function openCreate() {
    setForm(emptyForm());
    setEditor("create");
  }

  function openEdit(c: AdminCoupon) {
    setForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      discountValueInr: c.discountValueInr,
      scope: c.scope,
      packIds: c.packIds || [],
      minimumPurchase: c.minimumPurchase,
      minimumPurchaseInr: c.minimumPurchaseInr,
      maximumDiscount: c.maximumDiscount,
      maximumDiscountInr: c.maximumDiscountInr,
      usageLimit: c.usageLimit,
      perUserLimit: c.perUserLimit,
      newUserOnly: Boolean(c.newUserOnly),
      startsAt: c.startsAt,
      expiresAt: c.expiresAt,
      isActive: c.isActive,
    });
    setEditor(c);
  }

  async function save() {
    setSaving(true);
    try {
      const body: CouponPayload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        packIds: form.scope === "selected" ? form.packIds : [],
        startsAt: form.startsAt,
        expiresAt: form.expiresAt,
      };
      if (editor === "create") {
        await createCoupon(body);
        toast.success("Coupon created");
      } else if (editor && typeof editor === "object") {
        await updateCoupon(editor.id, body);
        toast.success("Coupon updated");
      }
      setEditor(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(c: AdminCoupon) {
    setBusyId(c.id);
    try {
      if (c.isActive && c.status === "active") {
        await disableCoupon(c.id);
        toast.success(`${c.code} disabled`);
      } else {
        await enableCoupon(c.id);
        toast.success(`${c.code} enabled`);
      }
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(c: AdminCoupon) {
    const ok = window.confirm(
      c.usageCount > 0
        ? `${c.code} has been used ${c.usageCount} time(s). It will be disabled instead of permanently deleted. Continue?`
        : `Delete coupon ${c.code}?`
    );
    if (!ok) return;
    setBusyId(c.id);
    try {
      const r = await deleteCoupon(c.id);
      toast.success(r.message || "Coupon deleted");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  const groupedPacks = useMemo(() => {
    const groups: Record<string, { id: string; label: string }[]> = {};
    for (const p of packOptions) {
      (groups[p.group] ||= []).push(p);
    }
    return groups;
  }, [packOptions]);

  const inputCls =
    "w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-sage dark:border-white/15 dark:bg-[#12100e]";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Coupons</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Create discount codes for try-on packs and credit purchases. Amounts are always calculated on the server.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-paper hover:bg-sage-dark"
        >
          + Create Coupon
        </button>
      </div>

      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Total", stats.totalCoupons],
            ["Active", stats.activeCoupons],
            ["Expired", stats.expiredCoupons],
            ["Uses", stats.totalUses],
            [
              "Discount given",
              stats.discountByCurrency.length
                ? stats.discountByCurrency
                    .map((d) => formatMoney(d.amount, d.currency))
                    .join(" · ")
                : "—",
            ],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-ink/10 bg-white p-4 dark:bg-[#14120f]">
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                {label}
              </div>
              <div className="mt-1 font-display text-2xl font-semibold text-ink">{value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-ink-muted">Search code</span>
          <input
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value.toUpperCase());
            }}
            className={inputCls}
            placeholder="SAVE20"
          />
        </label>
        <div className="w-44">
          <span className="mb-1 block text-sm text-ink-muted">Status</span>
          <CustomSelect
            size="sm"
            value={status}
            onChange={(v) => {
              setPage(1);
              setStatus(v);
            }}
            options={[
              { value: "", label: "All" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "expired", label: "Expired" },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white dark:bg-[#14120f]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-paper-100 text-xs uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Discount</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Scope</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Usage</th>
                <th className="px-4 py-3 font-semibold">Expiry</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-ink-muted">
                    No coupons yet.
                  </td>
                </tr>
              )}
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-semibold tracking-wide text-ink">
                    {c.code}
                    {c.newUserOnly && (
                      <span className="ml-2 inline-block rounded-full bg-sage/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sage-dark">
                        Welcome
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink">{formatDiscount(c)}</td>
                  <td className="px-4 py-3 capitalize text-ink-muted">{c.discountType}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {c.scope === "all" ? "All packs" : (c.packIds || []).join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        STATUS_STYLES[c.status] || "bg-ink/10"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink">
                    {c.usageCount}
                    {c.usageLimit != null ? ` / ${c.usageLimit}` : ""}
                    {c.totalDiscountKes || c.totalDiscountInr ? (
                      <div className="text-[11px] text-ink-muted">
                        {c.totalDiscountKes ? `KES ${c.totalDiscountKes}` : ""}
                        {c.totalDiscountKes && c.totalDiscountInr ? " · " : ""}
                        {c.totalDiscountInr ? `₹${c.totalDiscountInr}` : ""}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "None"}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="text-xs font-semibold text-sage-dark hover:underline"
                        onClick={() => openEdit(c)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busyId === c.id}
                        className="text-xs font-semibold text-ink-muted hover:underline"
                        onClick={() => toggle(c)}
                      >
                        {c.isActive && c.status !== "expired" ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === c.id}
                        className="text-xs font-semibold text-red-600 hover:underline"
                        onClick={() => onDelete(c)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-4 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-ink/15 px-3 py-1.5 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-ink-muted">
            Page {page} / {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-ink/15 px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {editor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="coupon-editor-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditor(null);
          }}
        >
          <div className="flex max-h-[min(92vh,52rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-ink/10 bg-paper shadow-xl dark:border-white/10 dark:bg-[#14120f]">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-ink/10 px-5 py-4 sm:px-6">
              <h2
                id="coupon-editor-title"
                className="font-display text-xl font-semibold text-ink sm:text-2xl"
              >
                {editor === "create" ? "Create coupon" : `Edit ${form.code || "coupon"}`}
              </h2>
              <button
                type="button"
                onClick={() => setEditor(null)}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/15 text-lg leading-none text-ink transition hover:bg-ink/5"
              >
                ×
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm sm:col-span-2">
                  <span className="mb-1 block font-medium text-ink">Coupon code</span>
                  <input
                    value={form.code}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""),
                      }))
                    }
                    className={inputCls}
                    placeholder="SAVE20"
                    maxLength={32}
                  />
                </label>
                <div>
                  <span className="mb-1 block text-sm font-medium text-ink">Discount type</span>
                  <CustomSelect
                    value={form.discountType}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, discountType: v as CouponDiscountType }))
                    }
                    options={[
                      { value: "percentage", label: "Percentage" },
                      { value: "fixed", label: "Fixed amount" },
                    ]}
                  />
                </div>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink">
                    {form.discountType === "percentage" ? "Percent (1–100)" : "Amount (KES)"}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={form.discountValue}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, discountValue: Number(e.target.value) }))
                    }
                    className={inputCls}
                  />
                </label>
                {form.discountType === "fixed" && (
                  <label className="text-sm">
                    <span className="mb-1 block font-medium text-ink">Amount (INR, optional)</span>
                    <input
                      type="number"
                      min={0}
                      value={form.discountValueInr ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, discountValueInr: numOrNull(e.target.value) }))
                      }
                      className={inputCls}
                    />
                  </label>
                )}
                <div>
                  <span className="mb-1 block text-sm font-medium text-ink">Applies to</span>
                  <CustomSelect
                    value={form.scope}
                    onChange={(v) => setForm((f) => ({ ...f, scope: v as CouponScope }))}
                    options={[
                      { value: "all", label: "All packs" },
                      { value: "selected", label: "Selected packs" },
                    ]}
                  />
                </div>
                {form.discountType === "percentage" && (
                  <>
                    <label className="text-sm">
                      <span className="mb-1 block font-medium text-ink">Max discount (KES)</span>
                      <input
                        type="number"
                        min={0}
                        value={form.maximumDiscount ?? ""}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, maximumDiscount: numOrNull(e.target.value) }))
                        }
                        className={inputCls}
                      />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block font-medium text-ink">Max discount (INR)</span>
                      <input
                        type="number"
                        min={0}
                        value={form.maximumDiscountInr ?? ""}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            maximumDiscountInr: numOrNull(e.target.value),
                          }))
                        }
                        className={inputCls}
                      />
                    </label>
                  </>
                )}
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink">Minimum purchase (KES)</span>
                  <input
                    type="number"
                    min={0}
                    value={form.minimumPurchase ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, minimumPurchase: numOrNull(e.target.value) }))
                    }
                    className={inputCls}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink">Minimum purchase (INR)</span>
                  <input
                    type="number"
                    min={0}
                    value={form.minimumPurchaseInr ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, minimumPurchaseInr: numOrNull(e.target.value) }))
                    }
                    className={inputCls}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink">Total usage limit</span>
                  <input
                    type="number"
                    min={1}
                    value={form.usageLimit ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, usageLimit: numOrNull(e.target.value) }))
                    }
                    className={inputCls}
                    placeholder="Unlimited"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink">Per user limit</span>
                  <input
                    type="number"
                    min={1}
                    value={form.perUserLimit ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, perUserLimit: numOrNull(e.target.value) }))
                    }
                    className={inputCls}
                    placeholder="Unlimited"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink">Start date</span>
                  <input
                    type="datetime-local"
                    value={toLocalInput(form.startsAt)}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, startsAt: fromLocalInput(e.target.value) }))
                    }
                    className={inputCls}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink">Expiry date</span>
                  <input
                    type="datetime-local"
                    value={toLocalInput(form.expiresAt)}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, expiresAt: fromLocalInput(e.target.value) }))
                    }
                    className={inputCls}
                  />
                </label>
                <label className="flex items-start gap-2 text-sm text-ink sm:col-span-2">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={Boolean(form.newUserOnly)}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, newUserOnly: e.target.checked }))
                    }
                  />
                  <span>
                    <span className="font-medium">New users / first try-on only</span>
                    <span className="mt-0.5 block text-xs text-ink-muted">
                      Only B2C shoppers with no prior paid try-on can use this coupon
                      (welcome offers).
                    </span>
                  </span>
                </label>
                <label className="flex items-center gap-2 text-sm text-ink sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.isActive !== false}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  />
                  Active
                </label>
                {form.scope === "selected" && (
                  <div className="sm:col-span-2">
                    <p className="mb-2 text-sm font-medium text-ink">Selected packs</p>
                    {Object.entries(groupedPacks).map(([group, list]) => (
                      <div key={group} className="mb-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                          {group}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {list.map((p) => {
                            const on = form.packIds.includes(p.id);
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() =>
                                  setForm((f) => ({
                                    ...f,
                                    packIds: on
                                      ? f.packIds.filter((id) => id !== p.id)
                                      : [...f.packIds, p.id],
                                  }))
                                }
                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                  on
                                    ? "border-sage bg-sage/15 text-sage-dark"
                                    : "border-ink/15 text-ink-muted"
                                }`}
                              >
                                {p.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-ink/10 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => setEditor(null)}
                className="rounded-full border border-ink/15 px-5 py-2 text-sm font-semibold text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={save}
                className="rounded-full bg-sage px-5 py-2 text-sm font-semibold text-paper hover:bg-sage-dark disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save coupon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
