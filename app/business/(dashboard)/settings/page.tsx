"use client";

import { useEffect, useState } from "react";
import { AddressAutocomplete, type AddressParts } from "@/components/AddressAutocomplete";
import { getProfile, updateProfile } from "@/lib/b2b";
import { getUser, saveAuth, getToken } from "@/lib/auth";
import { LIMITS, MAX_BRANCH_COUNT } from "@/lib/limits";
import { COUNTRIES, matchCountry } from "@/lib/countries";

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
  const [form, setForm] = useState({
    businessName: "",
    category: "boutique",
    phone: "",
    whatsapp: "",
    line1: "",
    city: "",
    country: "",
    branchCount: "1",
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
        setForm({
          businessName: u.business?.name || "",
          category: u.business?.category || "boutique",
          phone: u.phone || "",
          whatsapp: u.business?.whatsapp || "",
          line1: u.business?.address?.line1 || "",
          city: u.business?.address?.city || "",
          country: matchCountry(u.business?.address?.country) || u.business?.address?.country || "",
          branchCount: String(u.business?.branchCount ?? 1),
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
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onAddress(parts: Partial<AddressParts>) {
    setForm((f) => ({
      ...f,
      ...(parts.line1 !== undefined ? { line1: parts.line1 } : {}),
      ...(parts.city ? { city: parts.city } : {}),
      ...(parts.country
        ? { country: matchCountry(parts.country) || f.country }
        : {}),
    }));
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
          branchCount: Math.max(
            1,
            Math.min(MAX_BRANCH_COUNT, Number(form.branchCount) || 1)
          ),
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {loading ? (
        <div className="space-y-3">
          <div className="h-12 animate-pulse rounded-xl bg-ink/5" />
          <div className="h-12 animate-pulse rounded-xl bg-ink/5" />
          <div className="h-12 animate-pulse rounded-xl bg-ink/5" />
        </div>
      ) : (
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
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className={selectClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">
              Number of branches
            </label>
            <input
              type="number"
              min={1}
              max={MAX_BRANCH_COUNT}
              value={form.branchCount}
              onChange={(e) => set("branchCount", e.target.value)}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-ink-muted">
              Cap for locations you can create under Branches (1–
              {MAX_BRANCH_COUNT}).
            </p>
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
              <select
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                className={selectClass}
              >
                <option value="" disabled>
                  Select country
                </option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                {/* Preserve legacy free-text countries not in the list */}
                {form.country &&
                  !(COUNTRIES as readonly string[]).includes(form.country) && (
                    <option value={form.country}>{form.country}</option>
                  )}
              </select>
            </div>
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
      )}
    </div>
  );
}
