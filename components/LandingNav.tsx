"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#lookbook", label: "Lookbook" },
  { href: "#how", label: "How it Works" },
  { href: "#pricing", label: "Pricing" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 sm:px-4">
      <div className="mx-auto mt-3 flex max-w-6xl items-center justify-between rounded-full glass px-3 py-2.5 sm:mt-4 sm:px-5 sm:py-3">
        <div onClick={() => setOpen(false)}>
          <BrandLogo size="md" priority />
        </div>

        {/* Desktop links */}
        <nav className="hidden items-center gap-8 text-sm text-ink-muted md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="transition hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-ink-muted transition hover:text-ink sm:block"
          >
            Log in
          </Link>
          <Link
            href="/login?next=/app/try-on"
            className="rounded-full bg-sage px-4 py-2 text-sm font-semibold text-paper transition hover:bg-sage-dark sm:px-5"
          >
            Try On
          </Link>

          {/* Hamburger (mobile only) */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-white/60 text-ink transition hover:border-ink/25 md:hidden"
          >
            <span className="relative block h-3.5 w-4">
              <span
                className={`absolute left-0 block h-0.5 w-4 rounded-full bg-ink transition-all duration-300 ${
                  open ? "top-1.5 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 block h-0.5 w-4 rounded-full bg-ink transition-all duration-200 ${
                  open ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 block h-0.5 w-4 rounded-full bg-ink transition-all duration-300 ${
                  open ? "top-1.5 -rotate-45" : "top-3"
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      {open && (
        <>
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-0 z-40 cursor-default bg-ink/20 backdrop-blur-sm md:hidden"
          />
          <div className="relative z-50 mx-auto mt-2 max-w-6xl md:hidden">
            <div className="glass-strong rounded-3xl p-4">
              <nav className="flex flex-col">
                {LINKS.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-4 py-3 text-base font-medium text-ink transition hover:bg-white/60"
                  >
                    {l.label}
                  </a>
                ))}
              </nav>
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-ink/10 pt-4">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-ink/15 py-2.5 text-center text-sm font-semibold text-ink transition hover:border-ink/30"
                >
                  Log in
                </Link>
                <Link
                  href="/login?next=/app/try-on"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-sage py-2.5 text-center text-sm font-semibold text-paper transition hover:bg-sage-dark"
                >
                  Try On Instantly
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
