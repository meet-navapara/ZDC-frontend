"use client";

import { useEffect, useState } from "react";
import { CustomSelect } from "@/components/CustomSelect";
import { AddressAutocomplete, type AddressParts } from "@/components/AddressAutocomplete";
import { BranchManager } from "@/components/BranchManager";
import { getProfile, updateProfile } from "@/lib/b2b";
import { getUser, saveAuth, getToken } from "@/lib/auth";
import { LIMITS } from "@/lib/limits";
import {
  COUNTRIES,
  CURRENCIES,
  CURRENCY_CODES,
  matchCountry,
  currencyForCountry,
  paymentHintForCurrency,
} from "@/lib/countries";
import { toast } from "@/lib/toast";

const CATEGORIES = [
  { id: "salon", label: "Salon" },
  { id: "boutique", label: "Boutique" },
  { id: "other", label: "Others" },
];

const HAS_MAPS = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

const selectClass =
  "w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink outline-none transition focus:border-sage";
const inputClass =
  "w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink outline-none transition focus:border-sage";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [branchRefreshKey, setBranchRefreshKey] = useState(0);
  const [form, setForm] = useState({
    businessName: "",
    category: "boutique",
    phone: "",
    whatsapp: "",
    line1: "",
    city: "",
    country: "",
    currency: "KES",
  });
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });

  useEffect(() => {
    getProfile()
      .then((r) => {
        const u = r.user;
        setEmail(u.email);
        const country =
          matchCountry(u.business?.address?.country) ||
          u.business?.address?.country ||
          "";
        setForm({
          businessName: u.business?.name || "",
          category: u.business?.category || "boutique",
          phone: u.phone || "",
          whatsapp: u.business?.whatsapp || "",
          line1: u.business?.address?.line1 || "",
          city: u.business?.address?.city || "",
          country,
          currency:
            u.business?.currency || currencyForCountry(country) || "KES",
        });
        setCoords({
          lat: u.business?.address?.lat ?? null,
          lng: u.business?.address?.lng ?? null,
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => {
      if (key === "country") {
        return {
          ...f,
          country: value,
          currency: currencyForCountry(value),
        };
      }
      return { ...f, [key]: value };
    });
  }

  function onAddress(parts: Partial<AddressParts>) {
    setForm((f) => {
      const nextCountry = parts.country
        ? matchCountry(parts.country) || f.country
        : f.country;
      return {
        ...f,
        ...(parts.line1 !== undefined ? { line1: parts.line1 } : {}),
        ...(parts.city ? { city: parts.city } : {}),
        ...(parts.country ? { country: nextCountry } : {}),
        ...(parts.country
          ? { currency: currencyForCountry(nextCountry) }
          : {}),
      };
    });
    if (parts.lat != null && parts.lng != null) {
      setCoords({ lat: parts.lat, lng: parts.lng });
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const res = await updateProfile({
        phone: form.phone,
        business: {
          name: form.businessName,
          category: form.category as "boutique" | "salon" | "other",
          whatsapp: form.whatsapp.trim() || null,
          currency: form.currency,
          address: {
            line1: form.line1,
            city: form.city,
            country: form.country,
            ...(coords.lat != null && coords.lng != null
              ? { lat: coords.lat, lng: coords.lng }
              : {}),
          },
        },
      });
      const current = getUser();
      const token = getToken();
      if (current && token) {
        saveAuth(token, { ...current, ...res.user });
      }
      setNotice("Profile updated.");
      toast.success("Profile updated");
      setBranchRefreshKey((k) => k + 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {loading ? (
        <div className="space-y-3">
          <div className="h-12 animate-pulse rounded-xl bg-ink/5" />
          <div className="h-12 animate-pulse rounded-xl bg-ink/5" />
          <div className="h-12 animate-pulse rounded-xl bg-ink/5" />
        </div>
      ) : (
        <>
        <form onSubmit={onSubmit} className="card space-y-4 rounded-2xl p-6">
          {notice && (
            <div className="rounded-xl border border-sage/40 bg-sage/10 px-4 py-3 text-sm text-sage-dark">
              {notice}
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">
              Email
            </label>
            <input
              value={email}
              disabled
              className="w-full rounded-xl border border-ink/10 bg-ink/5 px-4 py-3 text-ink-muted"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">
              Business name
            </label>
            <input
              maxLength={LIMITS.businessName}
              value={form.businessName}
              onChange={(e) => set("businessName", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">
              Business category
            </label>
            <CustomSelect
              value={form.category}
              onChange={(v) => set("category", v)}
              options={CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
            />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">
                Phone
              </label>
            <input
              maxLength={LIMITS.phone}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={inputClass}
              placeholder="+254…"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">
              WhatsApp number
            </label>
            <input
              maxLength={LIMITS.phone}
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              className={inputClass}
              placeholder="+254…"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">
              Location
            </label>
            <AddressAutocomplete
              value={form.line1}
              onChange={onAddress}
              placeholder={
                HAS_MAPS
                  ? "Start typing — Google Maps will fill city & coordinates"
                  : "Street address / location"
              }
              className={inputClass}
            />
            {coords.lat != null && coords.lng != null ? (
              <p className="mt-1.5 text-xs font-medium text-sage-dark">
                Lat/Long: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </p>
            ) : (
              <p className="mt-1 text-xs text-ink-muted">
                {HAS_MAPS
                  ? "Pick a suggestion to auto-fetch latitude & longitude."
                  : "Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for Maps autocomplete + Lat/Long."}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">
                City / Town
              </label>
              <input
                maxLength={LIMITS.city}
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">
                Country
              </label>
              <CustomSelect
                value={form.country}
                onChange={(v) => set("country", v)}
                placeholder="Select country"
                options={[
                  ...COUNTRIES.map((c) => ({ value: c, label: c })),
                  ...(form.country && !(COUNTRIES as readonly string[]).includes(form.country)
                    ? [{ value: form.country, label: form.country }]
                    : []),
                ]}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">
              Currency
            </label>
            <CustomSelect
              value={form.currency}
              onChange={(v) => set("currency", v)}
              options={[
                ...CURRENCIES.map((c) => ({ value: c.code, label: c.label })),
                ...(form.currency && !(CURRENCY_CODES as readonly string[]).includes(form.currency)
                  ? [{ value: form.currency, label: form.currency }]
                  : []),
              ]}
            />
            <p className="mt-1.5 text-xs text-ink-muted">
              Payments use{" "}
              <span className="font-semibold text-ink">
                {paymentHintForCurrency(form.currency)}
              </span>{" "}
              ({form.currency}). Follows country by default; you can override.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-sage px-6 py-2.5 font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>

        <section className="card space-y-4 rounded-2xl p-6">
          <BranchManager compact refreshKey={branchRefreshKey} />
        </section>
        </>
      )}
    </div>
  );
}
