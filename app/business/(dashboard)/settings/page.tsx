"use client";

import { useEffect, useState } from "react";
import { CustomSelect } from "@/components/CustomSelect";
import { PhoneInput } from "@/components/PhoneInput";
import { AddressAutocomplete, type AddressParts } from "@/components/AddressAutocomplete";
import { BranchManager } from "@/components/BranchManager";
import { getProfile, updateProfile, tryOnFeatureLabel } from "@/lib/b2b";
import {
  BUSINESS_TYPE_FIELD_LABEL,
  businessCategoryLabel,
  normalizeBusinessCategory,
} from "@/lib/businessCategories";
import { getUser, saveAuth, getToken } from "@/lib/auth";
import { apiPatch } from "@/lib/api";
import { LIMITS } from "@/lib/limits";
import {
  CURRENCIES,
  CURRENCY_CODES,
  countrySelectOptions,
  getCountryByName,
  matchCountry,
  currencyForCountry,
  paymentHintForCurrency,
  parsePhoneNumber,
  dialCodeForCountry,
} from "@/lib/countries";
import { toast } from "@/lib/toast";
import { PageLoader } from "@/components/PageLoader";

const HAS_MAPS = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

const selectClass =
  "w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink outline-none transition focus:border-sage";
const inputClass =
  "w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink outline-none transition focus:border-sage";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [branchRefreshKey, setBranchRefreshKey] = useState(0);
  const [pwd, setPwd] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
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
        const rawCategory = normalizeBusinessCategory(u.business?.category);
        setForm({
          businessName: u.business?.name || "",
          category: rawCategory,
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
        const dial = dialCodeForCountry(value);
        const phoneParsed = parsePhoneNumber(f.phone, value);
        const waParsed = parsePhoneNumber(f.whatsapp, value);
        return {
          ...f,
          country: value,
          currency: currencyForCountry(value),
          phone: phoneParsed.national ? `${dial}${phoneParsed.national}` : f.phone,
          whatsapp: waParsed.national ? `${dial}${waParsed.national}` : f.whatsapp,
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

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (pwd.newPassword.length < 8) {
      const msg = "New password must be at least 8 characters.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (pwd.newPassword !== pwd.confirm) {
      const msg = "New passwords do not match.";
      setError(msg);
      toast.error(msg);
      return;
    }
    setPwdSaving(true);
    try {
      const token = getToken();
      await apiPatch(
        "/api/auth/me",
        {
          currentPassword: pwd.currentPassword,
          newPassword: pwd.newPassword,
        },
        token || undefined
      );
      setPwd({ currentPassword: "", newPassword: "", confirm: "" });
      setNotice("Password updated.");
      toast.success("Password updated");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not update password";
      setError(msg);
      toast.error(msg);
    } finally {
      setPwdSaving(false);
    }
  }

  if (loading) {
    return <PageLoader label="Loading settings…" />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {notice && (
        <div className="rounded-xl border border-sage/40 bg-sage/10 px-4 py-3 text-sm text-sage-dark dark:border-sage/30 dark:bg-sage/15 dark:text-[#d7e8dc]">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

        <form onSubmit={onSubmit} className="card space-y-4 rounded-2xl p-6">
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
              {BUSINESS_TYPE_FIELD_LABEL}
            </label>
            <input
              value={businessCategoryLabel(form.category)}
              disabled
              className="w-full rounded-xl border border-ink/10 bg-ink/5 px-4 py-3 text-ink-muted"
            />
            <p className="mt-1.5 text-xs text-ink-muted">
              {form.category === "salon"
                ? `Salon Catalog: upload hairstyles only. ${tryOnFeatureLabel("haircolor")} & ${tryOnFeatureLabel("beard")} are built-in on Try-On.`
                : `Boutique unlocks ${tryOnFeatureLabel("cloth")} in Catalog.`}{" "}
              Set at signup and cannot be changed here.
            </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">
                Phone
              </label>
            <PhoneInput
              value={form.phone}
              onChange={(v) => set("phone", v)}
              country={form.country || "Kenya"}
              onCountryDetected={(name) => {
                setForm((f) => ({
                  ...f,
                  country: name,
                  currency: currencyForCountry(name),
                }));
              }}
              placeholder="712 345 678"
              aria-label="Business phone"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">
              WhatsApp number
            </label>
            <PhoneInput
              value={form.whatsapp}
              onChange={(v) => set("whatsapp", v)}
              country={form.country || "Kenya"}
              onCountryDetected={(name) => {
                setForm((f) => ({
                  ...f,
                  country: name,
                  currency: currencyForCountry(name),
                }));
              }}
              placeholder="712 345 678"
              aria-label="WhatsApp number"
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
                searchable
                searchPlaceholder="Type country name…"
                options={countrySelectOptions(
                  form.country && !getCountryByName(form.country)
                    ? [{ value: form.country, label: form.country }]
                    : undefined
                )}
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

        <form
          onSubmit={savePassword}
          className="card space-y-5 rounded-2xl p-6"
        >
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">
              Security
            </h3>
            <p className="mt-0.5 text-sm text-ink-muted">
              Change your password to keep your business account secure.
            </p>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Current password
            </span>
            <input
              type="password"
              maxLength={LIMITS.password}
              value={pwd.currentPassword}
              onChange={(e) =>
                setPwd((p) => ({ ...p, currentPassword: e.target.value }))
              }
              className={inputClass}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                New password
              </span>
              <input
                type="password"
                maxLength={LIMITS.password}
                value={pwd.newPassword}
                onChange={(e) =>
                  setPwd((p) => ({ ...p, newPassword: e.target.value }))
                }
                className={inputClass}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Confirm new
              </span>
              <input
                type="password"
                maxLength={LIMITS.password}
                value={pwd.confirm}
                onChange={(e) =>
                  setPwd((p) => ({ ...p, confirm: e.target.value }))
                }
                className={inputClass}
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
            </label>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={
                pwdSaving ||
                !pwd.currentPassword ||
                !pwd.newPassword ||
                !pwd.confirm
              }
              className="rounded-full border border-ink/15 bg-white px-6 py-2.5 text-sm font-semibold text-ink transition hover:border-sage disabled:opacity-50 dark:border-white/15 dark:bg-[#181511] dark:text-[#e8e2d8]"
            >
              {pwdSaving ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>

        <section className="card space-y-4 rounded-2xl p-6">
          <BranchManager compact refreshKey={branchRefreshKey} />
        </section>
    </div>
  );
}
