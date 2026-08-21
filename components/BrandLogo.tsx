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
  /** Show the “STYLE, SMARTER!” lockup under the wordmark */
  showTagline?: boolean;
};

const SIZE = {
  sm: { mark: "h-8 sm:h-9", tag: false },
  md: { mark: "h-9 sm:h-10", tag: false },
  lg: { mark: "h-14 sm:h-16", tag: true },
  hero: { mark: "h-[4.25rem] sm:h-20 md:h-24", tag: true },
} as const;

/**
 * zimji brand mark — Sifonn wordmark with optional Baskerville tagline lockup.
 */
export function BrandLogo({
  href = "/",
  size = "md",
  onDark = false,
  className = "",
  badge,
  showTagline,
  priority,
}: BrandLogoProps) {
  const s = SIZE[size];
  const withTag = showTagline ?? s.tag;

  const node = (
    <span
      className={`inline-flex items-center gap-2.5 ${
        // Use hex white — globals.css remaps `.dark .bg-white` to near-black.
        onDark ? "rounded-xl bg-[#ffffff] px-2.5 py-1.5 shadow-sm" : ""
      } ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={withTag ? "/images/zimji-logo.png" : "/images/zimji-mark.png"}
        alt="zimji"
        className={`w-auto ${s.mark} ${onDark ? "" : "dark:invert"}`}
        fetchPriority={priority ? "high" : undefined}
      />
      {badge ? (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            onDark
              ? "bg-sage/15 text-sage-dark"
              : "bg-sage/10 text-sage-dark"
          }`}
        >
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
