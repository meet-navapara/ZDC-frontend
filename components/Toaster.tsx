"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  subscribeToasts,
  type ToastItem,
  type ToastType,
} from "@/lib/toast";

const STYLES: Record<ToastType, string> = {
  success:
    "border-sage/40 bg-white text-ink dark:border-sage/40 dark:bg-[#121a14] dark:text-[#e4f0e7]",
  error:
    "border-red-300/70 bg-white text-red-800 dark:border-red-400/40 dark:bg-[#2a1414] dark:text-[#f3d4d4]",
  info:
    "border-ink/12 bg-white text-ink dark:border-white/15 dark:bg-[#181511] dark:text-[#e8e2d8]",
};

const DOT: Record<ToastType, string> = {
  success: "bg-sage",
  error: "bg-red-500",
  info: "bg-amber-500",
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return subscribeToasts((toast) => {
      setItems((prev) => {
        // Avoid stacking identical messages (e.g. remount / double fire).
        if (
          prev.some(
            (t) => t.message === toast.message && t.type === toast.type
          )
        ) {
          return prev;
        }
        return [...prev.slice(-3), toast];
      });
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== toast.id));
      }, toast.duration);
    });
  }, []);

  if (!mounted || !items.length) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] flex justify-end pt-[4.75rem] sm:pt-[5.5rem]"
      aria-live="polite"
      aria-relevant="additions"
    >
      <div className="flex w-auto max-w-[min(22rem,calc(100vw-1.5rem))] flex-col items-end gap-2 px-3 sm:px-5">
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex w-fit max-w-full items-center gap-2.5 overflow-hidden rounded-full border px-3.5 py-2.5 text-sm shadow-[0_8px_24px_rgba(0,0,0,0.35)] animate-fadeUp ${STYLES[t.type]}`}
            role="status"
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${DOT[t.type]}`}
              aria-hidden
            />
            <p className="min-w-0 leading-snug">{t.message}</p>
            <button
              type="button"
              aria-label="Dismiss"
              className="shrink-0 rounded-full px-1 text-xs opacity-55 transition hover:opacity-100"
              onClick={() =>
                setItems((prev) => prev.filter((x) => x.id !== t.id))
              }
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
}
