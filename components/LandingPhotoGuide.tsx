"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "zimji_landing_photo_guide_v6";

const GOOD_EXAMPLES = [
  {
    src: "/images/photo-guide/guide-ok-front.png",
    alt: "One person standing, facing the camera",
    label: "Facing camera",
  },
  {
    src: "/images/photo-guide/guide-ok-fullbody.png",
    alt: "Full body standing, outfit fully visible",
    label: "Full body",
  },
  {
    src: "/images/photo-guide/guide-ok-outfit.png",
    alt: "Outfit unobstructed, arms at sides",
    label: "Clear outfit",
  },
  {
    src: "/images/photo-guide/guide-ok-oneperson.png",
    alt: "Single person in the photo",
    label: "One person",
  },
];

const AVOID_EXAMPLES = [
  {
    src: "/images/photo-guide/guide-no-group.png",
    alt: "Multiple people in one photo",
    label: "Several people",
  },
  {
    src: "/images/photo-guide/guide-no-slant.png",
    alt: "Body at a slanted angle",
    label: "Slanted pose",
  },
  {
    src: "/images/photo-guide/guide-no-hands.png",
    alt: "Hands and objects covering the body",
    label: "Hands blocking",
  },
  {
    src: "/images/photo-guide/guide-no-sitting.png",
    alt: "Person sitting instead of standing",
    label: "Sitting",
  },
];

const AVOID_POINTS = [
  "Multiple people in the photo",
  "Slanted body angles",
  "Hands blocking the body",
  "Sitting in the photo",
];

export function isPhotoGuideDismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function persistPhotoGuideDismissed() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // ignore
  }
}

function ExampleThumb({
  src,
  alt,
  label,
  variant,
}: {
  src: string;
  alt: string;
  label: string;
  variant: "good" | "bad";
}) {
  const ok = variant === "good";
  return (
    <figure className="min-w-0">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-ink/10 bg-[#ececec]">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="120px"
          className="object-cover object-center"
        />
        <span
          className={`absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow ${
            ok ? "bg-sage" : "bg-red-500"
          }`}
          aria-hidden
        >
          {ok ? "✓" : "✕"}
        </span>
      </div>
      <figcaption className="mt-1.5 text-center text-[10px] font-medium leading-tight text-ink-muted sm:text-[11px]">
        {label}
      </figcaption>
    </figure>
  );
}

type PhotoGuideModalProps = {
  open: boolean;
  onClose: () => void;
  /** Called from the “Select Photo” button — keep this in the same click tick. */
  onSelect: () => void;
};

export function PhotoGuideModal({ open, onClose, onSelect }: PhotoGuideModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function persistIfNeeded() {
    if (dontShowAgain) persistPhotoGuideDismissed();
  }

  function dismiss() {
    persistIfNeeded();
    onClose();
  }

  function selectPhoto() {
    persistIfNeeded();
    onSelect();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-ink/55 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-guide-title"
    >
      <div className="relative my-4 w-full max-w-3xl rounded-2xl bg-white shadow-2xl shadow-ink/20 sm:my-8 sm:rounded-3xl">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-xl text-ink-muted transition hover:bg-ink/5 hover:text-ink sm:right-4 sm:top-4"
          aria-label="Close"
        >
          ×
        </button>

        <div className="border-b border-ink/10 px-5 py-5 text-center sm:px-8 sm:py-6">
          <h2
            id="photo-guide-title"
            className="font-display text-xl font-semibold text-ink sm:text-2xl"
          >
            Select photo to try outfits
          </h2>
        </div>

        <div className="grid gap-6 px-5 py-5 sm:grid-cols-2 sm:gap-8 sm:px-8 sm:py-6">
          <div className="border-l-4 border-sage pl-4">
            <h3 className="text-sm font-bold text-sage-dark">Recommendation</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Use a front-facing photo of one person standing with a clear,
              unobstructed view of the body. Avoid holding anything or covering
              the body.
            </p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {GOOD_EXAMPLES.map((ex, i) => (
                <ExampleThumb
                  key={`good-${i}`}
                  src={ex.src}
                  alt={ex.alt}
                  label={ex.label}
                  variant="good"
                />
              ))}
            </div>
          </div>

          <div className="border-l-4 border-red-400 pl-4">
            <h3 className="text-sm font-bold text-red-600">Avoid</h3>
            <p className="mt-2 text-sm text-ink-muted">Avoid the following:</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-ink-muted">
              {AVOID_POINTS.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {AVOID_EXAMPLES.map((ex, i) => (
                <ExampleThumb
                  key={`bad-${i}`}
                  src={ex.src}
                  alt={ex.alt}
                  label={ex.label}
                  variant="bad"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t border-ink/10 px-5 py-5 sm:px-8 sm:py-6">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 rounded border-ink/20 text-sage focus:ring-sage"
            />
            Don&apos;t show me again
          </label>

          <button
            type="button"
            onClick={selectPhoto}
            className="w-full rounded-full bg-sage py-3.5 text-center text-base font-semibold text-paper transition hover:bg-sage-dark"
          >
            Select Photo
          </button>

          <p className="text-center text-[11px] leading-relaxed text-ink-muted sm:text-xs">
            By continuing, you agree to our{" "}
            <Link
              href="/terms"
              className="font-semibold text-sage hover:text-sage-dark"
              onClick={(e) => e.stopPropagation()}
            >
              Terms of Service
            </Link>{" "}
            and acknowledge our{" "}
            <Link
              href="/cookies"
              className="font-semibold text-sage hover:text-sage-dark"
              onClick={(e) => e.stopPropagation()}
            >
              Cookies Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
