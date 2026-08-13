"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AddressAutocomplete, type AddressParts } from "@/components/AddressAutocomplete";
import { apiPost } from "@/lib/api";
import { saveAuth, type AuthUser } from "@/lib/auth";
import { track } from "@/lib/analytics";
import { LIMITS, MAX_BRANCH_COUNT } from "@/lib/limits";
import { COUNTRIES, matchCountry } from "@/lib/countries";

type AuthResponse = { token: string; user: AuthUser };

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

export default function BusinessRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    businessName: "",
    category: "",
    email: "",
    password: "",
    phone: "",
    whatsapp: "",
    city: "",
    country: "Kenya",
    line1: "",
    branchCount: "1",
  });
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    if (!form.category) {
      setError("Please select a business category.");
      return;
    }
    if (!form.country) {
      setError("Please select a country.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost<AuthResponse>("/api/b2b/register", {
        email: form.email,
        password: form.password,
        phone: form.phone,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        business: {
          name: form.businessName,
          category: form.category,
          whatsapp: form.whatsapp.trim(),
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
      saveAuth(res.token, res.user);
      track("business_registered", { category: form.category });
      router.push("/business");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh]">
      <AppHeader />
      <section className="mx-auto flex min-h-[100dvh] w-full max-w-6xl items-center px-4 pb-10 pt-24 sm:px-6 sm:pt-28">
        <div className="flex w-full flex-col gap-6 md:grid md:h-[min(820px,calc(100vh-8.5rem))] md:grid-cols-2 md:items-stretch md:gap-12">
          {/* Desktop only */}
          <div className="card hidden w-full shrink-0 overflow-hidden rounded-[2rem] md:block md:h-full">
            <div className="relative h-full min-h-[480px] w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/boutique.png"
                alt="ZDC for business"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="min-h-0 w-full md:h-full md:overflow-y-auto md:overscroll-contain md:pr-2 [scrollbar-gutter:stable]">
            <div className="mx-auto w-full max-w-md md:pb-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sage">
                For Business
              </p>
              <h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
                Create your studio
              </h1>
              <p className="mt-2 text-ink-muted">
                Onboard your boutique or salon, buy credits, and offer virtual
                try-ons.
              </p>

              <form onSubmit={onSubmit} className="mt-8 space-y-4">
                {error && (
                  <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink-700">
                      First name <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      maxLength={LIMITS.name}
                      value={form.firstName}
                      onChange={(e) => set("firstName", e.target.value)}
                      className={inputClass}
                      placeholder="Amina"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink-700">
                      Last name <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      maxLength={LIMITS.name}
                      value={form.lastName}
                      onChange={(e) => set("lastName", e.target.value)}
                      className={inputClass}
                      placeholder="Okello"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700">
                    Business name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    maxLength={LIMITS.businessName}
                    value={form.businessName}
                    onChange={(e) => set("businessName", e.target.value)}
                    className={inputClass}
                    placeholder="Amara Atelier"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700">
                    Business category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    className={selectClass}
                  >
                    <option value="" disabled>
                      Select category
                    </option>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      maxLength={LIMITS.email}
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      className={inputClass}
                      placeholder="studio@example.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink-700">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      maxLength={LIMITS.phone}
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      className={inputClass}
                      placeholder="+254…"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700">
                    WhatsApp number <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    maxLength={LIMITS.phone}
                    value={form.whatsapp}
                    onChange={(e) => set("whatsapp", e.target.value)}
                    className={inputClass}
                    placeholder="+254…"
                  />
                  <p className="mt-1 text-xs text-ink-muted">
                    Used for try-on delivery and customer contact.
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    maxLength={LIMITS.password}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    className={inputClass}
                    placeholder="At least 8 characters"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700">
                    Number of branches <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={MAX_BRANCH_COUNT}
                    value={form.branchCount}
                    onChange={(e) => set("branchCount", e.target.value)}
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-ink-muted">
                    How many locations does your salon or boutique operate? (1–
                    {MAX_BRANCH_COUNT})
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <AddressAutocomplete
                    value={form.line1}
                    onChange={onAddress}
                    required
                    placeholder={
                      HAS_MAPS
                        ? "Start typing — Google Maps will fill city & coordinates"
                        : "Street address / location"
                    }
                    className={inputClass}
                  />
                  {coords.lat != null && coords.lng != null ? (
                    <p className="mt-1.5 text-xs font-medium text-sage-dark">
                      Lat/Long auto-fetched: {coords.lat.toFixed(5)},{" "}
                      {coords.lng.toFixed(5)}
                    </p>
                  ) : HAS_MAPS ? (
                    <p className="mt-1 text-xs text-ink-muted">
                      Pick a suggestion to auto-fetch latitude &amp; longitude.
                    </p>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink-700">
                      City / Town <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      maxLength={LIMITS.city}
                      value={form.city}
                      onChange={(e) => set("city", e.target.value)}
                      className={inputClass}
                      placeholder="Nairobi"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink-700">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
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
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-sage py-3 font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-60"
                >
                  {loading ? "Creating…" : "Create business account"}
                </button>
              </form>

              <p className="mt-6 text-sm text-ink-muted">
                Already registered?{" "}
                <Link
                  href="/business/login"
                  className="font-semibold text-sage hover:text-sage-dark"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
