import Link from "next/link";

type BrandLogoProps = {
  /** Set to `false` to render without a link (e.g. hero). */
  href?: string | false;
  size?: "sm" | "md" | "nav" | "lg" | "hero";
  /** Dark sidebars — light plate behind the mark */
  onDark?: boolean;
  className?: string;
  /** unused — kept for call-site compatibility */
  priority?: boolean;
  badge?: string;
  /**
   * Kept for call-site compatibility. The full landing lockup
   * (wordmark + tagline) is always used — one logo everywhere.
   */
  showTagline?: boolean;
};

const SIZE = {
  sm: {
    mark: "h-8 sm:h-9",
    max: "max-w-[6.5rem] sm:max-w-[7.5rem]",
  },
  md: {
    mark: "h-9 sm:h-10",
    max: "max-w-[7.5rem] sm:max-w-[9rem]",
  },
  /** Landing / marketing navbar */
  nav: {
    mark: "h-9 sm:h-10 md:h-11",
    max: "max-w-[7.5rem] sm:max-w-[9rem] md:max-w-[10rem]",
  },
  lg: {
    mark: "h-14 sm:h-16",
    max: "max-w-[11rem] sm:max-w-[13rem]",
  },
  hero: {
    mark: "h-[4.25rem] sm:h-20 md:h-24",
    max: "max-w-[14rem] sm:max-w-[16rem] md:max-w-[18rem]",
  },
} as const;

/**
 * zimji brand — always the landing lockup (wordmark + tagline asset).
 */
export function BrandLogo({
  href = "/",
  size = "md",
  onDark = false,
  className = "",
  badge,
  priority,
}: BrandLogoProps) {
  const s = SIZE[size];

  const node = (
    <span
      className={`inline-flex items-center gap-2.5 ${
        // Use hex white — globals.css remaps `.dark .bg-white` to near-black.
        onDark ? "rounded-xl bg-[#ffffff] px-2.5 py-1.5 shadow-sm" : ""
      } ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/zimji-logo.png"
        alt="zimji"
        className={`w-auto object-contain object-left ${s.mark} ${s.max} ${
          onDark ? "" : "dark:invert"
        }`}
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
