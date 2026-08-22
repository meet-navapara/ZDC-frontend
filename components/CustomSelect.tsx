"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type SelectOption = {
  value: string;
  label: string;
  /** Shown on the closed trigger when set (dropdown still uses label). */
  shortLabel?: string;
  /** Secondary line under the label in the menu. */
  description?: string;
  /** Small pill shown before the label (e.g. dial code or ISO). */
  badge?: string;
  /** Extra text used when searchable (e.g. ISO code). */
  searchText?: string;
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
  size?: "xs" | "sm" | "md";
  /** inline = no outer border; sits inside a composite field (e.g. phone input) */
  variant?: "default" | "inline";
  /** Show search box and filter options as the user types */
  searchable?: boolean;
  searchPlaceholder?: string;
  "aria-label"?: string;
};

type MenuRect = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: "bottom" | "top";
};

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const lower = text.toLowerCase();
  const needle = query.trim().toLowerCase();
  const idx = lower.indexOf(needle);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-sage/20 px-0.5 text-inherit dark:bg-sage/30">
        {text.slice(idx, idx + needle.length)}
      </mark>
      {text.slice(idx + needle.length)}
    </>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-sage-dark dark:text-sage"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <circle cx="9" cy="9" r="5.5" />
      <path d="M13.5 13.5L17 17" strokeLinecap="round" />
    </svg>
  );
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
  className = "",
  size = "md",
  variant = "default",
  searchable = false,
  searchPlaceholder = "Search country or code…",
  "aria-label": ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [menuRect, setMenuRect] = useState<MenuRect | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateMenuRect = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const menuWidth = Math.max(
      rect.width,
      searchable ? 340 : variant === "inline" ? 300 : 280,
    );
    const preferredMaxHeight = searchable ? 380 : 280;
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const openUp = spaceBelow < 260 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(
      preferredMaxHeight,
      Math.max(180, (openUp ? spaceAbove : spaceBelow) - (searchable ? 72 : 16)),
    );
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8));

    setMenuRect({
      top: openUp ? undefined : rect.bottom + 6,
      bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
      left,
      width: menuWidth,
      maxHeight,
      placement: openUp ? "top" : "bottom",
    });
  }, [searchable, variant]);

  useEffect(() => {
    if (!open) {
      setMenuRect(null);
      setQuery("");
      setHighlightIndex(-1);
      return;
    }
    updateMenuRect();
    const raf = requestAnimationFrame(updateMenuRect);
    window.addEventListener("resize", updateMenuRect);
    window.addEventListener("scroll", updateMenuRect, true);
    const t = window.setTimeout(() => {
      if (searchable) searchInputRef.current?.focus();
      else buttonRef.current?.focus();
    }, 0);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
      window.removeEventListener("resize", updateMenuRect);
      window.removeEventListener("scroll", updateMenuRect, true);
    };
  }, [open, updateMenuRect, searchable]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function optionMatches(opt: SelectOption, needle: string) {
    if (!needle) return true;
    const hay =
      opt.searchText ??
      `${opt.label} ${opt.value} ${opt.shortLabel ?? ""} ${opt.badge ?? ""} ${opt.description ?? ""}`.toLowerCase();
    return hay.toLowerCase().includes(needle);
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = searchable
    ? options.filter((opt) => optionMatches(opt, normalizedQuery))
    : options;

  const selectedIndex = filteredOptions.findIndex((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const idx = selectedIndex >= 0 ? selectedIndex : 0;
    setHighlightIndex(filteredOptions.length ? idx : -1);
  }, [open, normalizedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || highlightIndex < 0) return;
    optionRefs.current[highlightIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex, open]);

  function selectOption(opt: SelectOption) {
    onChange(opt.value);
    setOpen(false);
    setQuery("");
    buttonRef.current?.focus();
  }

  function handleMenuKeyDown(e: React.KeyboardEvent) {
    if (!filteredOptions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filteredOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setHighlightIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setHighlightIndex(filteredOptions.length - 1);
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      selectOption(filteredOptions[highlightIndex]);
    }
  }

  const selected = options.find((o) => o.value === value);
  const pad =
    size === "xs"
      ? "px-2 py-0.5 text-[11px] rounded-lg"
      : size === "sm"
        ? "px-3 py-2 text-xs"
        : "px-4 py-3 text-sm";
  const base =
    variant === "inline"
      ? "w-full border-0 bg-transparent text-ink outline-none transition " +
        "focus-visible:ring-0 dark:text-[#f4efe7] disabled:opacity-50 disabled:cursor-not-allowed"
      : "w-full rounded-xl border border-ink/15 bg-white text-ink outline-none transition " +
        "focus-visible:border-sage focus-visible:ring-2 focus-visible:ring-sage/15 " +
        "dark:border-white/10 dark:bg-[#1b1713] dark:text-[#f4efe7] dark:focus-visible:ring-sage/25 " +
        "disabled:opacity-50 disabled:cursor-not-allowed";
  const inlinePad =
    size === "sm" ? "px-3 py-3 text-sm" : "px-3 py-3 text-sm font-semibold tabular-nums";
  const buttonPad = variant === "inline" ? inlinePad : pad;

  const menu =
    open && menuRect && mounted ? (
      <div
        ref={menuRef}
        data-custom-select-menu
        role="presentation"
        onKeyDown={handleMenuKeyDown}
        className="fixed z-[9999] flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-2xl ring-1 ring-black/5 animate-softRise dark:border-white/10 dark:bg-[#1a1814] dark:ring-white/5"
        style={{
          top: menuRect.top,
          bottom: menuRect.bottom,
          left: menuRect.left,
          width: menuRect.width,
          maxHeight: menuRect.maxHeight,
        }}
      >
        {searchable && (
          <div className="shrink-0 border-b border-ink/8 bg-gradient-to-b from-ink/[0.02] to-transparent p-2.5 dark:border-white/8 dark:from-white/[0.03]">
            <div className="relative">
              <SearchIcon />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                placeholder={searchPlaceholder}
                className="w-full rounded-xl border border-ink/10 bg-white py-2.5 pl-9 pr-9 text-sm text-ink outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/15 dark:border-white/10 dark:bg-[#12100e] dark:text-[#f4efe7] dark:focus:ring-sage/25"
                aria-label={`${ariaLabel || "Select"} search`}
                autoComplete="off"
                spellCheck={false}
              />
              {query ? (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-ink-muted transition hover:bg-ink/5 hover:text-ink dark:hover:bg-white/10"
                  aria-label="Clear search"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 2l8 8M10 2L2 10" strokeLinecap="round" />
                  </svg>
                </button>
              ) : null}
            </div>
            {normalizedQuery ? (
              <p className="mt-2 px-1 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                {filteredOptions.length} result{filteredOptions.length === 1 ? "" : "s"}
              </p>
            ) : null}
          </div>
        )}

        <ul
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          className="custom-select-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain py-1.5"
        >
          {filteredOptions.length === 0 ? (
            <li className="px-4 py-8 text-center">
              <p className="text-sm font-medium text-ink">No matches</p>
              <p className="mt-1 text-xs text-ink-muted">Try a country name, code, or dial prefix</p>
            </li>
          ) : (
            filteredOptions.map((opt, index) => {
              const isSelected = opt.value === value;
              const isHighlighted = index === highlightIndex;
              const rich = Boolean(opt.badge || opt.description);

              return (
                <li
                  key={opt.value}
                  ref={(el) => {
                    optionRefs.current[index] = el;
                  }}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlightIndex(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectOption(opt)}
                  className={`mx-1.5 cursor-pointer rounded-xl transition-colors ${
                    rich ? "px-2.5 py-2" : size === "xs" ? "px-3 py-2 text-xs" : "px-3 py-2.5 text-sm"
                  } ${
                    isHighlighted
                      ? "bg-sage/12 dark:bg-sage/15"
                      : isSelected
                        ? "bg-sage/8 dark:bg-sage/10"
                        : "hover:bg-ink/[0.04] dark:hover:bg-white/[0.05]"
                  }`}
                >
                  {rich ? (
                    <div className="flex items-center gap-3">
                      {opt.badge ? (
                        <span
                          className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold tabular-nums ${
                            isSelected || isHighlighted
                              ? "bg-sage/20 text-sage-dark dark:text-sage"
                              : "bg-ink/5 text-ink-700 dark:bg-white/10 dark:text-[#d6cec2]"
                          }`}
                        >
                          {opt.badge}
                        </span>
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <div
                          className={`truncate ${isSelected ? "font-semibold text-sage-dark dark:text-sage" : "font-medium text-ink dark:text-[#f4efe7]"}`}
                        >
                          <HighlightMatch text={opt.label} query={normalizedQuery} />
                        </div>
                        {opt.description ? (
                          <div className="truncate text-xs text-ink-muted">
                            <HighlightMatch text={opt.description} query={normalizedQuery} />
                          </div>
                        ) : null}
                      </div>
                      {isSelected ? <CheckIcon /> : null}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`truncate ${isSelected ? "font-semibold text-sage-dark dark:text-sage" : "text-ink dark:text-[#f4efe7]"}`}
                      >
                        <HighlightMatch text={opt.label} query={normalizedQuery} />
                      </span>
                      {isSelected ? <CheckIcon /> : null}
                    </div>
                  )}
                </li>
              );
            })
          )}
        </ul>
      </div>
    ) : null;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
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
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            if (!open) {
              e.preventDefault();
              setOpen(true);
            }
          }
          if (!searchable || open) return;
          if (e.key.length === 1 && /[a-z0-9+\s]/i.test(e.key)) {
            setOpen(true);
            setQuery(e.key);
            e.preventDefault();
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`${base} ${buttonPad} flex w-full items-center justify-between gap-2 text-left ${
          open
            ? variant === "inline"
              ? "relative z-[1]"
              : "relative z-[1] border-sage ring-2 ring-sage/15 dark:ring-sage/25"
            : ""
        } ${!selected ? "text-ink-muted dark:text-[#f4efe7]/40" : ""}`}
      >
        <span className="truncate">
          {selected ? (selected.shortLabel ?? selected.label) : (placeholder ?? "Select…")}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-ink-muted transition-transform duration-200 ${
            open ? "rotate-180 text-sage-dark dark:text-sage" : ""
          }`}
          viewBox="0 0 12 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden
        >
          <path d="M1 1l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {mounted && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
