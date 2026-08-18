import Link from "next/link";

type BrandLogoProps = {
  /** Set to `false` to render without a link (e.g. hero). */
  href?: string | false;
  size?: "sm" | "md" | "lg" | "hero";
  /** Dark sidebars — light plate behind the mark */
  onDark?: boolean;
  className?: string;
  /** unused — kept for call-site compatibility */
  priority?: boolean;
  badge?: string;
  /** Show the “STYLE, SMARTER!” line under the wordmark */
  showTagline?: boolean;
};

const SIZE = {
  sm: { mark: "h-6 sm:h-7", tag: "text-[6px] tracking-[0.3em]", gap: "gap-0.5" },
  md: { mark: "h-7 sm:h-8", tag: "text-[7px] tracking-[0.32em]", gap: "gap-1" },
  lg: { mark: "h-9 sm:h-10", tag: "text-[8px] tracking-[0.34em]", gap: "gap-1.5" },
  hero: {
    mark: "h-12 sm:h-14 md:h-[4.25rem]",
    tag: "text-[9px] sm:text-[11px] tracking-[0.4em]",
    gap: "gap-2",
  },
} as const;

/**
 * Premium zimji wordmark — custom SVG letterforms + sage accent dots.
 */
export function BrandLogo({
  href = "/",
  size = "md",
  onDark = false,
  className = "",
  badge,
  showTagline,
}: BrandLogoProps) {
  const s = SIZE[size];
  const withTag = showTagline ?? (size === "lg" || size === "hero");

  const node = (
    <span
      className={`inline-flex items-center gap-2.5 ${
        onDark ? "rounded-xl bg-white px-2.5 py-1.5 shadow-sm" : ""
      } ${className}`}
    >
      <span className={`flex flex-col items-start ${s.gap}`}>
        <ZimjiMark className={s.mark} />
        {withTag ? (
          <span className={`pl-0.5 font-medium uppercase text-ink/45 dark:text-white/30 ${s.tag}`}>
            Style, Smarter!
          </span>
        ) : null}
      </span>
      {badge ? (
        <span className="rounded-full bg-sage/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sage-dark">
          {badge}
        </span>
      ) : null}
    </span>
  );

  if (href === false) return node;
  return (
    <Link
      href={href}
      className="inline-flex min-w-0 items-center"
      aria-label="zimji home"
    >
      {node}
    </Link>
  );
}

/**
 * Custom geometric wordmark.
 * Charcoal letterforms + sage brand dots on i / j (j carries a second signature dot).
 */
function ZimjiMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 390 100"
      className={`w-auto overflow-visible text-ink dark:text-[#e8e2d8] ${className}`}
      fill="currentColor"
      role="img"
      aria-label="zimji"
    >
      <title>zimji</title>
      <g transform="skewX(-8) translate(10 0)">
        {/* z — fashion-forward slab */}
        <path d="M22 26h78c1.5 0 2.2 1.8 1.1 2.9L40 74h58v12H16c-1.5 0-2.2-1.8-1.1-2.9L76 38H22V26z" />

        {/* i */}
        <rect x="118" y="40" width="12" height="46" rx="1.5" />
        <circle cx="124" cy="22" r="6.5" fill="#2F5D50" />

        {/* m — dual arches */}
        <path d="M148 86V40h12.5c1 0 1.8.6 2.1 1.5L178 72l15.4-30.5c.3-.9 1.1-1.5 2.1-1.5H208v46h-12V56.5L181.5 86h-7L150 56.5V86H148z" />

        {/* j */}
        <path d="M236 40h12v36c0 12.5-7.5 20-19.5 20-5.5 0-10.2-1.4-13.8-4.2l5.5-9.8c2 1.5 4.4 2.4 7.5 2.4 5.2 0 7.8-2.8 7.8-8.4V40z" />
        <circle cx="242" cy="22" r="6.5" fill="#2F5D50" />
        <circle cx="258" cy="14" r="4.5" fill="#2F5D50" />

        {/* i */}
        <rect x="278" y="40" width="12" height="46" rx="1.5" />
        <circle cx="284" cy="22" r="6.5" fill="#2F5D50" />
      </g>

      {/* Quiet sage hairline under the mark */}
      <path
        d="M28 94h300"
        fill="none"
        stroke="#2F5D50"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}
