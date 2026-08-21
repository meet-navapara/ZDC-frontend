"use client";

import { useEffect, useState } from "react";
import {
  subscribeToasts,
  type ToastItem,
  type ToastType,
} from "@/lib/toast";

const STYLES: Record<ToastType, string> = {
  success:
    "border-sage/35 bg-white text-ink shadow-sage/10 dark:border-sage/35 dark:bg-[#152019] dark:text-[#d7e8dc] dark:shadow-black/25",
  error:
    "border-red-300/70 bg-white text-red-800 shadow-red-900/5 dark:border-red-400/35 dark:bg-[#2a1414] dark:text-[#f3d4d4]",
  info:
    "border-ink/10 bg-white text-ink shadow-ink/5 dark:border-white/12 dark:bg-[#181511] dark:text-[#e8e2d8]",
};

const DOT: Record<ToastType, string> = {
  success: "bg-sage",
  error: "bg-red-500",
  info: "bg-amber-500",
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    return subscribeToasts((toast) => {
      setItems((prev) => [...prev.slice(-4), toast]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== toast.id));
      }, toast.duration);
    });
  }, []);

  if (!items.length) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-3 pt-3 sm:items-end sm:px-5 sm:pt-5"
      aria-live="polite"
      aria-relevant="additions"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex max-w-md items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm shadow-lg shadow-black/25 animate-fadeUp ${STYLES[t.type]}`}
          role="status"
        >
          <span
            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[t.type]}`}
            aria-hidden
          />
          <p className="leading-snug">{t.message}</p>
          <button
            type="button"
            aria-label="Dismiss"
            className="ml-1 shrink-0 rounded-full px-1.5 text-xs opacity-60 transition hover:opacity-100"
            onClick={() =>
              setItems((prev) => prev.filter((x) => x.id !== t.id))
            }
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
