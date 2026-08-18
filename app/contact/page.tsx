"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { apiPost } from "@/lib/api";

const INQUIRY_TYPES = [
  "General inquiry",
  "Try-on support",
  "Billing & payments",
  "Business / B2B",
  "Partnership",
  "Other",
];

const COUNTRY_CODES = [
  { code: "+254", label: "KE" },
  { code: "+91", label: "IN" },
  { code: "+1", label: "US" },
  { code: "+44", label: "UK" },
  { code: "+971", label: "AE" },
];

const fieldClass =
  "w-full rounded-xl border border-ink/10 bg-white/70 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-sage dark:border-white/10 dark:bg-white/[0.04] dark:text-[#f4efe7]";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+254");
  const [phone, setPhone] = useState("");
  const [inquiryType, setInquiryType] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await apiPost<{ ok: boolean }>("/api/contact", {
        name,
        email,
        countryCode,
        phone,
        inquiryType,
        message,
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-paper dark:bg-[#0c0b09]">
      <AppHeader />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-12 pt-24 sm:px-6 sm:pt-28">
        <section className="relative overflow-hidden rounded-[1.5rem] border border-ink/10 bg-white/50 p-5 shadow-sm dark:border-white/10 dark:bg-[#14120f] sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-sage/15 blur-3xl" />

          <p className="relative text-[11px] font-semibold uppercase tracking-[0.2em] text-sage">
            We&apos;d love to hear from you
          </p>
          <h1 className="relative mt-2 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Contact
          </h1>

          {sent ? (
            <div className="relative mt-8 rounded-2xl border border-sage/25 bg-sage/10 px-5 py-6 text-center">
              <p className="font-display text-xl font-semibold text-ink">
                Message sent
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                Thanks — we&apos;ll get back to you at {email}.
              </p>
            </div>
          ) : (
            <form className="relative mt-7 space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-ink-muted">
                    Name <span className="text-ink">*</span>
                  </span>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={fieldClass}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-ink-muted">
                    Email <span className="text-ink">*</span>
                  </span>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={fieldClass}
                    placeholder="you@email.com"
                    autoComplete="email"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-ink-muted">
                  Mobile number <span className="text-ink">*</span>
                </span>
                <div className="flex overflow-hidden rounded-xl border border-ink/10 bg-white/70 focus-within:border-sage dark:border-white/10 dark:bg-white/[0.04]">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="border-r border-ink/10 bg-transparent px-3 py-3 text-sm text-ink outline-none dark:border-white/10 dark:text-[#f4efe7]"
                    aria-label="Country code"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-white text-[#1c1a16]">
                        {c.code}
                      </option>
                    ))}
                  </select>
                  <input
                    required
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-muted dark:text-[#f4efe7]"
                    placeholder="712 000 000"
                    autoComplete="tel"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-ink-muted">
                  Inquiry type <span className="text-ink">*</span>
                </span>
                <select
                  required
                  value={inquiryType}
                  onChange={(e) => setInquiryType(e.target.value)}
                  className={`${fieldClass} appearance-none bg-[length:12px] bg-[right_1rem_center] bg-no-repeat`}
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%236f695d' d='M1 1l5 5 5-5'/%3E%3C/svg%3E\")",
                  }}
                >
                  <option value="" disabled className="bg-white text-[#1c1a16]">
                    Select Inquiry Type
                  </option>
                  {INQUIRY_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-white text-[#1c1a16]">
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-ink-muted">
                  Message <span className="text-ink">*</span>
                </span>
                <div className="relative">
                  <textarea
                    required
                    rows={5}
                    maxLength={500}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={`${fieldClass} resize-none pr-16`}
                    placeholder="How can we help?"
                  />
                  <span className="pointer-events-none absolute bottom-3 right-3 text-[11px] text-ink-muted">
                    {message.length}/500
                  </span>
                </div>
              </label>

              {error && (
                <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="pt-2 text-center">
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex min-w-[12rem] items-center justify-center rounded-full bg-sage px-8 py-3 text-sm font-semibold uppercase tracking-wide text-paper transition hover:bg-sage-dark disabled:opacity-60"
                >
                  {sending ? "Sending…" : "Send message"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
