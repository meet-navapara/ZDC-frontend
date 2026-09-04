"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const STEPS = [
  {
    id: "discover",
    label: "",
    title: "In the salon",
    desc: "She stands in the salon, staring at gorgeous different hairstyles on the salon poster.",
    src: "/images/phone-scene-v2-1.jpg",
    alt: "Customer browsing braided hairstyles on a salon poster",
  },
  {
    id: "snap",
    label: "",
    title: "Snap the style",
    desc: "She taps her phone and captures one braid style — a gorgeous model picture from the poster.",
    src: "/images/phone-scene-v2-2.jpg",
    alt: "Customer photographing a braid style from a salon poster on her phone",
  },
  {
    id: "tryon",
    label: "",
    title: "Try it on zimji",
    desc: "After using the zimji website on her phone in the same salon, she sees her VTON and feels so excited.",
    src: "/images/phone-scene-v2-3.jpg",
    alt: "Excited customer showing zimji virtual try-on result on her phone in the salon",
  },
] as const;

const HOLD_MS = 3000;
const TRANSITION_MS = 700;
const RESUME_AFTER_TAP_MS = 5000;

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

type ShowcaseProps = {
  /** Fits first viewport via outer scale; phone screen content unchanged */
  variant?: "default" | "hero";
};

export function TransformationShowcase({ variant = "default" }: ShowcaseProps) {
  const isHero = variant === "hero";
  const { ref, visible } = useInView(0.1);
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "leaving" | "entering">("idle");
  const [pausedUntil, setPausedUntil] = useState(0);
  const transitionLock = useRef(false);
  const show = isHero || visible;

  const goTo = useCallback(
    (next: number, manual = false) => {
      if (transitionLock.current) return;
      if (next === active) return;
      transitionLock.current = true;
      setPrev(active);
      setPhase("leaving");
      if (manual) setPausedUntil(Date.now() + RESUME_AFTER_TAP_MS);

      window.setTimeout(() => {
        setActive(next);
        setPhase("entering");
        window.setTimeout(() => {
          setPrev(null);
          setPhase("idle");
          transitionLock.current = false;
        }, TRANSITION_MS);
      }, 280);
    },
    [active]
  );

  useEffect(() => {
    if (!show) return;
    if (typeof window !== "undefined") {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (reduce.matches) return;
    }

    const id = window.setInterval(() => {
      if (Date.now() < pausedUntil) return;
      if (transitionLock.current) return;
      goTo((active + 1) % STEPS.length);
    }, HOLD_MS);

    return () => window.clearInterval(id);
  }, [show, active, pausedUntil, goTo]);

  const step = STEPS[active];

  const phone = (
    <div
      className={`phone-frame relative ${
        isHero ? "w-full" : "w-[min(78vw,20rem)] sm:w-[22rem]"
      }`}
    >
      <div
        className={`relative overflow-hidden bg-[#1a1816] shadow-[0_28px_56px_-22px_rgba(28,26,22,0.55),0_0_0_1px_rgba(255,255,255,0.06)_inset] ${
          isHero
            ? "rounded-[2.15rem] p-[8px] sm:rounded-[2.35rem] sm:p-[9px]"
            : "rounded-[2.35rem] p-[9px] sm:rounded-[2.55rem] sm:p-[10px]"
        }`}
      >
        <span
          className="pointer-events-none absolute -left-[2px] top-[18%] hidden h-9 w-[3px] rounded-l-sm bg-[#2a2724] sm:block"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -left-[2px] top-[28%] hidden h-12 w-[3px] rounded-l-sm bg-[#2a2724] sm:block"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -right-[2px] top-[24%] hidden h-14 w-[3px] rounded-r-sm bg-[#2a2724] sm:block"
          aria-hidden
        />

        <div
          className={`phone-screen relative overflow-hidden bg-[#0c0b09] ${
            isHero
              ? "aspect-[9/17.4] rounded-[1.65rem] sm:aspect-[9/17.8] sm:rounded-[1.85rem]"
              : "aspect-[9/18.8] rounded-[1.85rem] sm:aspect-[9/19.2] sm:rounded-[2rem]"
          }`}
        >
          <div
            className="absolute left-1/2 top-2.5 z-30 h-[1.35rem] w-[5.4rem] -translate-x-1/2 rounded-full bg-black sm:top-3 sm:h-[1.55rem] sm:w-[6.25rem]"
            aria-hidden
          >
            <span className="absolute right-2.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#1c1c1e] ring-1 ring-white/10 sm:right-3 sm:h-2 sm:w-2" />
          </div>

          <div className="absolute inset-0">
            {STEPS.map((s, i) => {
              const isActive = i === active;
              const isPrev = i === prev;
              let cls = "phone-slide";
              if (isActive && phase === "entering") cls += " phone-slide-enter";
              else if (isActive && phase === "idle") cls += " phone-slide-active";
              else if (isPrev && phase === "leaving") cls += " phone-slide-leave";
              else if (isActive) cls += " phone-slide-active";
              else cls += " phone-slide-hidden";

              return (
                <div key={s.id} className={cls} aria-hidden={!isActive}>
                  <Image
                    src={s.src}
                    alt={s.alt}
                    fill
                    sizes="(max-width: 768px) 85vw, 360px"
                    quality={95}
                    priority={i === 0}
                    className="object-cover object-center"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/15" />
                </div>
              );
            })}

            {(phase === "leaving" || phase === "entering") && (
              <div
                className="phone-sweep pointer-events-none absolute inset-0 z-20"
                aria-hidden
              />
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 z-20 px-3.5 pb-5 pt-14 sm:px-5 sm:pb-7 sm:pt-16">
            {step.label ? (
              <span className="inline-flex items-center rounded-full bg-sage px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-paper shadow-md shadow-sage/35 sm:px-3 sm:text-[11px]">
                {step.label}
              </span>
            ) : null}
            <h3
              className={`font-display text-lg font-semibold leading-snug text-white sm:text-2xl ${
                step.label ? "mt-2.5 sm:mt-3" : ""
              }`}
            >
              {step.title}
            </h3>
            <p
              className="mt-1 text-[12px] leading-relaxed sm:mt-1.5 sm:text-sm"
              style={{ color: "rgba(255, 255, 255, 0.88)" }}
            >
              {step.desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const dots = (
    <div
      className={`flex items-center justify-center gap-2 ${isHero ? "mt-2.5" : "mt-5 sm:mt-6"}`}
      role="tablist"
      aria-label="AI try-on demo steps"
    >
      {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={s.title}
              onClick={() => goTo(i, true)}
              className="flex min-h-11 min-w-11 items-center justify-center"
            >
          <span
            className={`block h-2 rounded-full transition-all duration-500 ${
              i === active
                ? "w-7 bg-sage"
                : "w-2 bg-ink/20 hover:bg-ink/40 dark:bg-white/25"
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div
      ref={ref}
      className={
        isHero
          ? "flex w-full flex-col items-center lg:h-full lg:w-auto lg:justify-end"
          : "flex flex-col items-center"
      }
    >
      <div
        className={
          isHero
            ? "flex w-[min(78vw,18rem)] flex-col items-center sm:w-[16.5rem] lg:w-[17.5rem] xl:w-[18rem]"
            : "flex w-full flex-col items-center"
        }
        style={
          isHero
            ? undefined
            : {
                opacity: visible ? 1 : 0,
                transform: visible ? "none" : "translateY(24px) scale(0.97)",
                transition:
                  "opacity 0.8s cubic-bezier(0.22,1,0.36,1), transform 0.8s cubic-bezier(0.22,1,0.36,1)",
              }
        }
      >
        {isHero ? (
          <>
            {phone}
            {dots}
          </>
        ) : (
          <>
            {phone}
            {dots}
            <Link
              href="/try-on"
              className="mt-7 inline-flex w-full max-w-xs items-center justify-center rounded-full bg-sage px-8 py-3.5 text-[15px] font-semibold text-paper shadow-lg shadow-sage/25 transition hover:-translate-y-0.5 hover:bg-sage-dark sm:mt-8 sm:w-auto"
            >
              Try it on yourself →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
