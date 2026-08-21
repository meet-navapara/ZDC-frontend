"use client";

import { useState } from "react";
import { apiUrl } from "@/lib/api";
import { TryOnShareActions } from "@/components/TryOnShareActions";

type Props = {
  resultImageUrls: string[];
  badge?: string | null;
  onTryAnother: () => void;
  challengePath?: string;
  filenamePrefix?: string;
};

/**
 * Shared premium try-on reveal (B2B + B2C).
 * Fits one viewport — no page scroll; continuous atmosphere (no top black strip).
 */
export function TryOnResultReady({
  resultImageUrls,
  badge,
  onTryAnother,
  challengePath = "/app/try-on",
  filenamePrefix = "zimji-tryon",
}: Props) {
  const [active, setActive] = useState(0);
  const urls = resultImageUrls.filter(Boolean);
  const current = urls[Math.min(active, Math.max(0, urls.length - 1))] || urls[0];

  if (!current) return null;

  return (
    <div className="relative -mx-4 -mt-6 flex max-h-[calc(100dvh-3.75rem)] min-h-[calc(100dvh-3.75rem)] w-[calc(100%+2rem)] flex-col overflow-hidden bg-paper px-4 py-3 dark:bg-[#0c0b09] md:-mx-8 md:-mt-8 md:w-[calc(100%+4rem)] md:px-8 md:py-4">
      {/* Soft glow only behind the portrait — same base color everywhere */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-[70%] -translate-y-1/2 rounded-full bg-sage/[0.08] blur-[80px] dark:bg-sage/[0.12]" />
      </div>

      <header className="relative z-10 shrink-0 text-center">
        <p
          className="animate-fadeUp text-[10px] font-semibold uppercase tracking-[0.28em] text-sage"
          style={{ animationDelay: "40ms" }}
        >
          Look ready
        </p>
        <h2
          className="mt-0.5 animate-fadeUp font-display text-xl font-semibold tracking-tight text-ink dark:text-[#f6f1e8] sm:text-2xl"
          style={{ animationDelay: "100ms" }}
        >
          Your try-on is ready
        </h2>
        {badge ? (
          <span
            className="mt-1.5 inline-flex animate-fadeUp items-center gap-1.5 rounded-full border border-sage/25 bg-sage/10 px-2.5 py-0.5 text-[10px] font-semibold text-sage-dark dark:border-sage/35 dark:text-sage-light"
            style={{ animationDelay: "160ms" }}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-sage animate-glowPulse" />
            {badge}
          </span>
        ) : null}
      </header>

      <div className="relative z-10 mt-3 flex min-h-0 flex-1 items-center justify-center gap-3 sm:mt-4 sm:gap-5">
        <div className="flex max-h-full flex-col items-center justify-center">
          <div className="group relative animate-lookReveal">
            <div
              aria-hidden
              className="absolute -inset-3 rounded-[1.75rem] bg-sage/15 blur-2xl dark:bg-sage/20"
            />
            <figure className="relative overflow-hidden rounded-2xl bg-paper shadow-[0_22px_48px_-26px_rgba(0,0,0,0.55)] ring-1 ring-ink/10 dark:bg-[#0c0b09] dark:ring-white/12">
              <div className="relative aspect-[3/4] h-[min(42dvh,16.5rem)] w-[min(38vw,11rem)] sm:h-[min(48dvh,19rem)] sm:w-[12.75rem]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={current}
                  src={apiUrl(current)}
                  alt="Your generated try-on"
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-revealSheen bg-gradient-to-r from-transparent via-white/25 to-transparent"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"
                />
              </div>
            </figure>
          </div>

          {urls.length > 1 && (
            <div className="mt-2 flex gap-1.5">
              {urls.map((url, i) => (
                <button
                  key={`${url}-${i}`}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Look ${i + 1}`}
                  aria-pressed={active === i}
                  className={`relative h-9 w-7 overflow-hidden rounded-md transition ${
                    active === i
                      ? "ring-2 ring-sage ring-offset-1 ring-offset-paper dark:ring-offset-[#0c0b09]"
                      : "opacity-45 hover:opacity-90"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={apiUrl(url)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          className="w-[10.5rem] shrink-0 animate-softRise sm:w-[12rem]"
          style={{ animationDelay: "380ms" }}
        >
          <div className="rounded-2xl border border-ink/10 bg-paper/80 p-2.5 backdrop-blur-sm dark:border-white/10 dark:bg-[#0c0b09]/90 sm:p-3">
            <TryOnShareActions
              imageUrl={current}
              filename={`${filenamePrefix}-${active + 1}.png`}
              onTryAnother={onTryAnother}
              challengePath={challengePath}
              variant="studio"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
