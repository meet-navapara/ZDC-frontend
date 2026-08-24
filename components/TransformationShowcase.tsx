"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const STEPS = [
  {
    n: "01",
    kicker: "Upload",
    title: "Your selfie",
    desc: "Start with a clear photo — the base for AI virtual try-on.",
    src: "/images/tryon-step-1.jpg",
    alt: "Selfie uploaded for AI virtual outfit and hairstyle try-on",
    featured: false,
  },
  {
    n: "02",
    kicker: "Transform",
    title: "AI transforms the look",
    desc: "zimji applies your selected outfit, hairstyle, hair color, or beard.",
    src: "/images/tryon-step-2.jpg",
    alt: "AI virtual try-on transformation in progress",
    featured: false,
  },
  {
    n: "03",
    kicker: "Result",
    title: "Photorealistic result",
    desc: "Preview your new look in seconds — then buy or book with confidence.",
    src: "/images/tryon-step-3.jpg",
    alt: "Photorealistic AI generated outfit try-on result",
    featured: true,
  },
] as const;

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.95) {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function ArrowHorizontal() {
  return (
    <div className="hidden shrink-0 items-center self-center md:flex" aria-hidden>
      <svg
        viewBox="0 0 56 24"
        className="h-5 w-12 text-sage/50"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M2 12h44" strokeLinecap="round" strokeDasharray="4 3" />
        <path d="M38 5l10 7-10 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function ArrowVertical() {
  return (
    <div className="flex justify-center py-2 md:hidden" aria-hidden>
      <svg
        viewBox="0 0 24 44"
        className="h-9 w-5 text-sage/50"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M12 2v30" strokeLinecap="round" strokeDasharray="4 3" />
        <path d="M5 25l7 11 7-11" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function TransformationShowcase() {
  const { ref, visible } = useInView(0.1);

  return (
    <div ref={ref}>
      {/* Header */}
      <div
        className="text-center"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translateY(22px)",
          transition: "opacity 0.75s cubic-bezier(0.22,1,0.36,1), transform 0.75s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sage">
          AI virtual try-on demo
        </p>
        <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl font-semibold text-ink sm:mt-4 sm:text-4xl md:text-5xl">
          See the AI transformation
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-ink-muted sm:text-lg">
          From your selfie to a photorealistic outfit or hairstyle look — powered by zimji AI try-on.
        </p>
      </div>

      {/* Cards row */}
      <ol className="mt-10 flex flex-col md:mt-14 md:flex-row md:items-stretch md:gap-4">
        {STEPS.map((step, i) => (
          <li
            key={step.n}
            className="flex min-w-0 flex-1 flex-col md:flex-row md:items-stretch md:gap-4"
          >
            {/* Card */}
            <div
              className="w-full"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "none" : "translateY(36px) scale(0.97)",
                transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 120 + 100}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 120 + 100}ms`,
              }}
            >
              <article
                className={`group h-full ${
                  step.featured
                    ? "relative rounded-[1.4rem] p-[2px] sm:rounded-[1.8rem]"
                    : ""
                }`}
              >
                {/* Gradient border ring for featured */}
                {step.featured && (
                  <div
                    className="pointer-events-none absolute inset-0 rounded-[1.4rem] sm:rounded-[1.8rem]"
                    style={{
                      background: "linear-gradient(135deg, rgba(92,122,104,0.6) 0%, rgba(92,122,104,0.1) 50%, rgba(92,122,104,0.4) 100%)",
                    }}
                    aria-hidden
                  />
                )}

                <div
                  className={`relative flex h-full flex-col overflow-hidden rounded-[1.25rem] bg-white transition-all duration-500 ease-out sm:rounded-[1.6rem] ${
                    step.featured
                      ? "shadow-[0_24px_52px_-18px_rgba(47,93,80,0.5)]"
                      : "border border-ink/8 shadow-[0_14px_40px_-20px_rgba(28,26,22,0.3)]"
                  } hover:-translate-y-1.5 hover:shadow-[0_32px_60px_-20px_rgba(47,93,80,0.45)]`}
                >
                  {/* Image */}
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image
                      src={step.src}
                      alt={step.alt}
                      fill
                      sizes="(max-width: 768px) 92vw, 33vw"
                      className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                    {/* Bottom vignette */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
                    {/* Step number bubble — avoid text-ink on white (dark mode washes it out) */}
                    <div
                      className={`absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold sm:left-4 sm:top-4 sm:h-9 sm:w-9 ${
                        step.featured
                          ? "bg-sage text-paper shadow-lg shadow-sage/40"
                          : "bg-white/90 text-[#1c1a16] shadow-sm backdrop-blur dark:bg-sage dark:text-paper dark:shadow-lg dark:shadow-sage/40"
                      }`}
                    >
                      {step.n}
                    </div>
                  </div>

                  {/* Text */}
                  <div className="flex flex-1 flex-col justify-end px-4 py-4 sm:px-5 sm:py-5">
                    <h3 className="mt-1 font-display text-xl font-semibold text-ink sm:text-2xl">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{step.desc}</p>
                  </div>
                </div>
              </article>
            </div>

            {/* Connector arrows */}
            {i < STEPS.length - 1 && (
              <div
                style={{
                  opacity: visible ? 1 : 0,
                  transition: `opacity 0.6s ease ${i * 120 + 320}ms`,
                }}
              >
                <ArrowVertical />
                <ArrowHorizontal />
              </div>
            )}
          </li>
        ))}
      </ol>

      {/* CTA */}
      <div
        className="mt-10 text-center sm:mt-14"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translateY(16px)",
          transition: "opacity 0.7s cubic-bezier(0.22,1,0.36,1) 500ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) 500ms",
        }}
      >
        <p className="text-sm text-ink-muted">Create your first AI-generated look.</p>
        <Link
          href="/try-on"
          className="mt-4 inline-flex w-full max-w-xs items-center justify-center rounded-full bg-sage px-9 py-3.5 text-base font-semibold text-paper shadow-lg shadow-sage/25 transition hover:-translate-y-0.5 hover:bg-sage-dark hover:shadow-sage/40 sm:w-auto"
        >
          Start AI Try-On →
        </Link>
      </div>
    </div>
  );
}
