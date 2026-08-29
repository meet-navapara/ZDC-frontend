"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CustomSelect } from "@/components/CustomSelect";
import { PhoneInput } from "@/components/PhoneInput";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AddressAutocomplete, type AddressParts } from "@/components/AddressAutocomplete";
import { apiPost } from "@/lib/api";
import { saveAuth, homeForRole, type AuthUser } from "@/lib/auth";
import { track } from "@/lib/analytics";
import { LIMITS } from "@/lib/limits";
import { toast } from "@/lib/toast";
import {
  BUSINESS_TYPE_FIELD_LABEL,
  businessCategoryDescription,
  BUSINESS_CATEGORY_SELECT_OPTIONS,
} from "@/lib/businessCategories";
import {
  CURRENCIES,
  countrySelectOptions,
  matchCountry,
  currencyForCountry,
  paymentHintForCurrency,
  parsePhoneNumber,
  dialCodeForCountry,
} from "@/lib/countries";

type AccountKind = "b2c" | "b2b";
type AuthResponse = {
  token: string;
  user: AuthUser;
  referral?: { redeemed?: boolean; rewardReferee?: number };
};

const HAS_MAPS = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
const inputClass =
  "w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink outline-none transition focus:border-sage dark:border-white/15 dark:bg-[#12100e]";

function AccountSwitch({
  value,
  onChange,
  disabled,
}: {
  value: AccountKind;
  onChange: (next: AccountKind) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-5 grid grid-cols-2 rounded-full border border-ink/10 bg-white p-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("b2c")}
        className={`rounded-full py-2 text-sm font-semibold transition ${
          value === "b2c"
            ? "bg-sage text-paper"
            : "text-ink-muted hover:text-ink"
        }`}
      >
        Customer
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("b2b")}
        className={`rounded-full py-2 text-sm font-semibold transition ${
          value === "b2b"
            ? "bg-sage text-paper"
            : "text-ink-muted hover:text-ink"
        }`}
      >
        Business
      </button>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [kind, setKind] = useState<AccountKind>("b2c");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Kenya");
  const [currency, setCurrency] = useState("KES");
  const [line1, setLine1] = useState("");
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const as = (params.get("as") || params.get("account") || "").toLowerCase();
    if (as === "business" || as === "b2b") setKind("b2b");
    const ref = params.get("ref");
    if (ref) setReferralCode(ref.trim().toUpperCase());
  }, []);

  function switchKind(next: AccountKind) {
    if (next === kind || step === "otp") return;
    setKind(next);
    setError("");
    setNotice("");
    const url = new URL(window.location.href);
    if (next === "b2b") url.searchParams.set("as", "business");
    else url.searchParams.delete("as");
    window.history.replaceState({}, "", url.pathname + url.search);
  }

  function applyCountry(name: string) {
    setCountry(name);
    setCurrency(currencyForCountry(name));
    const dial = dialCodeForCountry(name);
    setPhone((prev) => {
      const { national } = parsePhoneNumber(prev, name);
      return national ? `${dial}${national}` : prev;
    });
    setWhatsapp((prev) => {
      const { national } = parsePhoneNumber(prev, name);
      return national ? `${dial}${national}` : prev;
    });
  }

  function onAddress(parts: Partial<AddressParts>) {
    if (parts.line1 !== undefined) setLine1(parts.line1);
    if (parts.city) setCity(parts.city);
    if (parts.country) {
      const nextCountry = matchCountry(parts.country) || country;
      applyCountry(nextCountry);
    }
    if (parts.lat != null && parts.lng != null) {
      setCoords({ lat: parts.lat, lng: parts.lng });
    }
  }

  function b2bPayload() {
    return {
      email,
      password,
      phone,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      business: {
        name: businessName,
        category,
        whatsapp: whatsapp.trim(),
        currency,
        address: {
          line1,
          city,
          country,
          ...(coords.lat != null && coords.lng != null
            ? { lat: coords.lat, lng: coords.lng }
            : {}),
        },
      },
    };
  }

  async function requestOtp() {
    if (kind === "b2b") {
      if (!category) throw new Error(`Please select a ${BUSINESS_TYPE_FIELD_LABEL.toLowerCase()}.`);
      if (!country) throw new Error("Please select a country.");
      if (!currency) throw new Error("Please select a currency.");
    }
    const path =
      kind === "b2b"
        ? "/api/b2b/register/otp/request"
        : "/api/auth/register/otp/request";
    const body =
      kind === "b2b"
        ? b2bPayload()
        : {
            firstName,
            email,
            password,
            role: "b2c",
            referralCode: referralCode.trim() || undefined,
          };
    const res = await apiPost<{
      ok: boolean;
      message?: string;
      email: string;
      mock?: boolean;
      mockOtp?: string;
      devOtp?: string;
    }>(path, body);
    const code = res.mockOtp || res.devOtp || "";
    setDevOtp(code);
    if (code) setOtp(code);
    const noticeText = res.mock
      ? `Mock OTP mode — use code ${code}.`
      : res.message || `We sent a verification code to ${email}. Enter it below.`;
    setNotice(noticeText);
    setStep("otp");
    if (!code) setOtp("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      await requestOtp();
      toast.success("OTP sent");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not send code";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const path =
        kind === "b2b"
          ? "/api/b2b/register/otp/verify"
          : "/api/auth/register/otp/verify";
      const res = await apiPost<AuthResponse>(path, {
        email,
        code: otp.trim(),
      });
      saveAuth(res.token, res.user);
      if (kind === "b2b") {
        track("business_registered", { category, currency });
      }
      toast.success("Account created");
      router.push(homeForRole(res.user.role));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    setError("");
    setLoading(true);
    try {
      await requestOtp();
      setNotice("A new code was sent.");
      toast.success("Code resent");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not resend code";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const isBusiness = kind === "b2b";

  return (
    <main className="min-h-[100dvh]">
      <AppHeader />
      <section className="mx-auto flex min-h-[100dvh] w-full max-w-6xl items-center px-4 pb-10 pt-24 sm:px-6 sm:pt-28">
        <div
          className={`flex w-full flex-col gap-6 md:grid md:grid-cols-2 md:items-stretch md:gap-12 ${
            isBusiness ? "lg:h-[min(820px,calc(100vh-8.5rem))]" : ""
          }`}
        >
          <div className="card hidden w-full shrink-0 overflow-hidden rounded-[2rem] md:block md:h-full">
            <div className="relative h-full min-h-[320px] w-full lg:min-h-[480px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={isBusiness ? "/images/boutique.png" : "/images/model-print.png"}
                alt={isBusiness ? "zimji for business" : "zimji try-on"}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>

          <div
            className={`min-h-0 w-full ${
              isBusiness
                ? "lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:pr-2 lg:[scrollbar-gutter:stable]"
                : ""
            }`}
          >
            <div className="mx-auto w-full max-w-md md:pb-2">
              {step === "otp" ? null : (
                <AccountSwitch value={kind} onChange={switchKind} />
              )}
              <h1 className="mt-5 font-display text-3xl font-semibold text-ink sm:text-4xl">
                {step === "otp"
                  ? "Verify your email"
                  : isBusiness
                    ? "Create your studio"
                    : "Create your account"}
              </h1>
              <p className="mt-2 text-ink-muted">
                {step === "otp"
                  ? `Enter the 6-digit code sent to ${email}.`
                  : isBusiness
                    ? "Onboard your boutique or salon and offer virtual try-ons."
                    : "Start trying on outfits and hairstyles in seconds."}
              </p>

              {step === "otp" ? (
                <form onSubmit={onVerifyOtp} className="mt-8 space-y-4">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("form");
                      setOtp("");
                      setDevOtp("");
                      setError("");
                      setNotice("");
                    }}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-sage transition hover:text-sage-dark"
                  >
                    <span aria-hidden>←</span>
                    Edit details
                  </button>
                  {notice && (
                    <div className="rounded-xl border border-sage/40 bg-sage/10 px-4 py-3 text-sm text-sage-dark">
                      {notice}
                      {devOtp ? (
                        <p className="mt-2 font-mono text-base font-bold tracking-widest">
                          {devOtp}
                        </p>
                      ) : null}
                    </div>
                  )}
                  {error && (
                    <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink-700">
                      Verification code <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      className={inputClass}
                      placeholder="6-digit code"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full rounded-full bg-sage py-3 font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-60"
                  >
                    {loading ? "Verifying…" : "Verify & create account"}
                  </button>
                  <div className="flex justify-end text-sm">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={resendOtp}
                      className="font-semibold text-sage hover:text-sage-dark disabled:opacity-60"
                    >
                      Resend code
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={onSubmit} className="mt-8 space-y-4">
                  {error && (
                    <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
                      {error}
                    </div>
                  )}

                  {isBusiness ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-ink-700">
                          First name <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          maxLength={LIMITS.name}
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
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
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className={inputClass}
                          placeholder="Okello"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-ink-700">
                        First name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={LIMITS.name}
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={inputClass}
                        placeholder="Amara"
                      />
                    </div>
                  )}

                  {isBusiness && (
                    <>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-ink-700">
                          Business name <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          maxLength={LIMITS.businessName}
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className={inputClass}
                          placeholder="Amara Atelier"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-ink-700">
                          {BUSINESS_TYPE_FIELD_LABEL}{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <CustomSelect
                          required
                          value={category}
                          onChange={setCategory}
                          placeholder="Select business type"
                          options={BUSINESS_CATEGORY_SELECT_OPTIONS}
                        />
                        {category ? (
                          <p className="mt-1.5 text-xs text-ink-muted">
                            {businessCategoryDescription(category)}
                          </p>
                        ) : null}
                      </div>
                    </>
                  )}

                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      maxLength={LIMITS.email}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      placeholder={
                        isBusiness ? "studio@example.com" : "you@example.com"
                      }
                    />
                  </div>

                  {isBusiness && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-ink-700">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <PhoneInput
                        required
                        value={phone}
                        onChange={setPhone}
                        country={country}
                        onCountryDetected={applyCountry}
                        placeholder="712 345 678"
                        aria-label="Business phone"
                      />
                    </div>
                  )}

                  {isBusiness && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-ink-700">
                        WhatsApp number <span className="text-red-500">*</span>
                      </label>
                      <PhoneInput
                        required
                        value={whatsapp}
                        onChange={setWhatsapp}
                        country={country}
                        onCountryDetected={applyCountry}
                        placeholder="712 345 678"
                        aria-label="WhatsApp number"
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink-700">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      maxLength={LIMITS.password}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputClass}
                      placeholder="At least 8 characters"
                    />
                  </div>

                  {isBusiness ? (
                    <>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-ink-700">
                          Location <span className="text-red-500">*</span>
                        </label>
                        <AddressAutocomplete
                          value={line1}
                          onChange={onAddress}
                          required
                          placeholder={
                            HAS_MAPS
                              ? "Start typing — Google Maps will fill city & coordinates"
                              : "Street address / location"
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-ink-700">
                            City / Town <span className="text-red-500">*</span>
                          </label>
                          <input
                            required
                            maxLength={LIMITS.city}
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className={inputClass}
                            placeholder="Nairobi"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-ink-700">
                            Country <span className="text-red-500">*</span>
                          </label>
                          <CustomSelect
                            required
                            value={country}
                            onChange={applyCountry}
                            placeholder="Select country"
                            searchable
                            searchPlaceholder="Type country name…"
                            options={countrySelectOptions()}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-ink-700">
                          Currency <span className="text-red-500">*</span>
                        </label>
                        <CustomSelect
                          required
                          value={currency}
                          onChange={setCurrency}
                          options={CURRENCIES.map((c) => ({ value: c.code, label: c.label }))}
                        />
                        <p className="mt-1.5 text-xs text-ink-muted">
                          Payments will use{" "}
                          <span className="font-semibold text-ink">
                            {paymentHintForCurrency(currency)}
                          </span>{" "}
                          ({currency}).
                        </p>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-ink-700">
                        Referral code{" "}
                        <span className="font-normal text-ink-muted">
                          (optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        maxLength={16}
                        value={referralCode}
                        onChange={(e) =>
                          setReferralCode(e.target.value.toUpperCase())
                        }
                        className={`${inputClass} uppercase tracking-wider`}
                        placeholder="e.g. AMARA8K2"
                        autoCapitalize="characters"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full bg-sage py-3 font-semibold text-paper transition hover:bg-sage-dark disabled:opacity-60"
                  >
                    {loading ? "Sending code…" : "Continue — verify email"}
                  </button>
                </form>
              )}

              <p className="mt-6 text-sm text-ink-muted">
                Already have an account?{" "}
                <Link
                  href="/login"
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
