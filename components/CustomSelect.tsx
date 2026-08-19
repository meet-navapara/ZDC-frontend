"use client";

import { useEffect, useRef, useState } from "react";

export type SelectOption = {
  value: string;
  label: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  /** compact = smaller padding, used in filter bars / tables */
  size?: "sm" | "md";
};

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
  className = "",
  size = "md",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);
  const pad = size === "sm" ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm";
  const base =
    "w-full rounded-xl border border-ink/15 bg-white text-ink outline-none transition " +
    "focus-visible:border-sage dark:border-white/10 dark:bg-[#1b1713] dark:text-[#f4efe7] " +
    "disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Hidden native input for form required validation */}
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

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${base} ${pad} flex items-center justify-between gap-2 text-left ${
          !selected ? "text-ink-muted dark:text-[#f4efe7]/40" : ""
        }`}
      >
        <span className="truncate">
          {selected ? selected.label : (placeholder ?? "Select…")}
        </span>
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 12 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M1 1l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-ink/10 bg-white shadow-lg dark:border-white/10 dark:bg-[#1e1c18]"
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
              className={`cursor-pointer truncate px-4 py-2.5 text-sm transition-colors
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
