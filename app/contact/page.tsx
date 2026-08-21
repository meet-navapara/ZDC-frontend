"use client";

import { useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { apiPost } from "@/lib/api";
import { toast } from "@/lib/toast";

const INQUIRY_TYPES = [
  "General inquiry",
  "Try-on support",
  "Billing & payments",
  "Business / B2B",
  "Partnership",
  "Other",
];

const COUNTRY_CODES = [
  { code: "+254", label: "KE +254" },
  { code: "+91", label: "IN +91" },
  { code: "+1", label: "US +1" },
  { code: "+44", label: "UK +44" },
  { code: "+971", label: "AE +971" },
];

const fieldClass =
  "w-full rounded-xl border border-ink/10 bg-white/70 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-sage dark:border-white/10 dark:bg-white/[0.04] dark:text-[#f4efe7]";

// ── Reusable custom dropdown ──────────────────────────────────────────────────
function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      {/* Hidden native input for required validation */}
      {required && (
        <input
          tabIndex={-1}
          required
          value={value}
          onChange={() => {}}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
          aria-hidden
        />
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${fieldClass} flex items-center justify-between text-left ${
          !selected ? "text-ink-muted" : ""
        }`}
      >
        <span>{selected ? selected.label : (placeholder ?? "Select…")}</span>
        <svg
          className={`ml-2 h-4 w-4 shrink-0 text-ink-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M1 1l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown list */}
      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-ink/10 bg-white shadow-lg dark:border-white/10 dark:bg-[#1e1c18]"
        >
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`cursor-pointer px-4 py-2.5 text-sm transition-colors
                ${
                  opt.value === value
                    ? "bg-sage/10 font-semibold text-sage-dark dark:text-sage"
                    : "text-ink hover:bg-ink/5 dark:text-[#f4efe7] dark:hover:bg-white/5"
                }`}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
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
      toast.success("Message sent");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not send. Try again.";
      setError(msg);
      toast.error(msg);
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

              {/* Phone with custom country code picker */}
              <div>
                <span className="mb-1.5 block text-xs font-semibold text-ink-muted">
                  Mobile number <span className="text-ink">*</span>
                </span>
                <div className="flex gap-2">
                  <div className="w-36 shrink-0">
                    <CustomSelect
                      value={countryCode}
                      onChange={setCountryCode}
                      options={COUNTRY_CODES.map((c) => ({ value: c.code, label: c.label }))}
                    />
                  </div>
                  <input
                    required
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`${fieldClass} flex-1`}
                    placeholder="712 000 000"
                    autoComplete="tel"
                  />
                </div>
              </div>

              {/* Custom inquiry type picker */}
              <div>
                <span className="mb-1.5 block text-xs font-semibold text-ink-muted">
                  Inquiry type <span className="text-ink">*</span>
                </span>
                <CustomSelect
                  required
                  value={inquiryType}
                  onChange={setInquiryType}
                  placeholder="Select Inquiry Type"
                  options={INQUIRY_TYPES.map((t) => ({ value: t, label: t }))}
                />
              </div>

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
