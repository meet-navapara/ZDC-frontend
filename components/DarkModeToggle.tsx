"use client";

import { useEffect, useState } from "react";

/**
 * A single icon button that toggles dark/light mode.
 * Shows a moon icon in light mode, sun icon in dark mode.
 * Persists preference in localStorage and syncs across tabs.
 */
export function DarkModeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("zimji_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    setMounted(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("zimji_theme", next ? "dark" : "light");
  }

  // Reserve space while mounting to avoid layout shift
  if (!mounted) return <div className="h-9 w-9" />;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={`group relative flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300
        border-ink/10 bg-white/60 text-ink hover:border-ink/20 hover:bg-white/90
        dark:border-white/10 dark:bg-white/5 dark:text-[#f4efe7] dark:hover:border-white/20 dark:hover:bg-white/10
        ${className}`}
    >
      {/* Sun icon — shown in dark mode */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`absolute h-4 w-4 transition-all duration-300 ${
          dark ? "scale-100 opacity-100 rotate-0" : "scale-50 opacity-0 rotate-90"
        }`}
      >
        <circle cx="12" cy="12" r="4" />
        <line x1="12" y1="2" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="2" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="22" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>

      {/* Moon icon — shown in light mode */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`absolute h-4 w-4 transition-all duration-300 ${
          dark ? "scale-50 opacity-0 -rotate-90" : "scale-100 opacity-100 rotate-0"
        }`}
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}
