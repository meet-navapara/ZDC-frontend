"use client";

type PageLoaderProps = {
  /** Short label under the spinner */
  label?: string;
  /** Fill the main content area (default) vs compact inline */
  full?: boolean;
  className?: string;
};

/**
 * Shared initial-load screen. Use instead of "—" placeholders on cards
 * while the page’s first data fetch is in flight.
 */
export function PageLoader({
  label = "Loading…",
  full = true,
  className = "",
}: PageLoaderProps) {
  return (
    <div
      className={
        full
          ? `flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 px-4 ${className}`
          : `flex flex-col items-center justify-center gap-3 py-10 ${className}`
      }
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-2 border-sage/20" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-sage" />
      </div>
      <p className="text-sm font-medium text-ink-muted">{label}</p>
    </div>
  );
}
