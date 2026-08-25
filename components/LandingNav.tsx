"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { DarkModeToggle } from "@/components/DarkModeToggle";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#lookbook", label: "Lookbook" },
  { href: "#how", label: "How it Works" },
  { href: "#pricing", label: "Pricing" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 sm:px-4">
      {/* 3-column bar: logo | centered links | actions */}
      <div className="mx-auto mt-3 grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 rounded-full glass px-3 py-2 sm:mt-4 sm:gap-x-3 sm:px-5 sm:py-2.5 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        {/* Logo — left, vertically centered */}
        <div
          className="flex min-w-0 max-w-full items-center justify-start overflow-hidden"
          onClick={() => setOpen(false)}
        >
          <BrandLogo size="nav" priority className="origin-left max-w-full" />
        </div>

        {/* Desktop links — true center column */}
        <nav className="hidden items-center justify-center gap-5 text-sm text-ink-muted dark:text-[#9a9387] md:flex lg:gap-8">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="whitespace-nowrap transition hover:text-ink dark:hover:text-[#e8e2d8]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Actions — right, mirrors logo column */}
        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-ink-muted transition hover:text-ink dark:text-[#9a9387] dark:hover:text-[#e8e2d8] sm:block"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-sage px-4 py-2 text-sm font-semibold text-paper transition hover:bg-sage-dark sm:px-5"
          >
            Sign up
          </Link>
          <DarkModeToggle />

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-white/60 text-ink transition hover:border-ink/25 dark:border-white/10 dark:bg-white/5 dark:text-[#f4efe7] md:hidden"
          >
            <span className="relative block h-3.5 w-4">
              <span
                className={`absolute left-0 block h-0.5 w-4 rounded-full bg-current transition-all duration-300 ${
                  open ? "top-1.5 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 block h-0.5 w-4 rounded-full bg-current transition-all duration-200 ${
                  open ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 block h-0.5 w-4 rounded-full bg-current transition-all duration-300 ${
                  open ? "top-1.5 -rotate-45" : "top-3"
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <>
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-0 z-40 cursor-default bg-ink/20 backdrop-blur-sm md:hidden"
          />
          <div className="relative z-50 mx-auto mt-2 max-w-6xl md:hidden">
            <div className="glass-strong rounded-3xl p-4">
              <div className="mb-3 flex justify-center border-b border-ink/8 pb-3 dark:border-white/8">
                <BrandLogo size="nav" href={false} />
              </div>
              <nav className="flex flex-col">
                {LINKS.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-4 py-3 text-center text-base font-medium text-ink transition hover:bg-white/60 dark:text-[#e8e2d8] dark:hover:bg-white/5"
                  >
                    {l.label}
                  </a>
                ))}
              </nav>
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-ink/10 pt-4 dark:border-white/8">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-ink/15 py-2.5 text-center text-sm font-semibold text-ink transition hover:border-ink/30 dark:border-white/12 dark:text-[#e8e2d8]"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-sage py-2.5 text-center text-sm font-semibold text-paper transition hover:bg-sage-dark"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
