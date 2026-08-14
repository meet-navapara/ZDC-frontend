import Link from "next/link";

/**
 * Sticky back control for legal / marketing pages — always sits under the
 * fixed AppHeader so users never hunt for it at the bottom of long docs.
 */
export function PageBackLink({
  href = "/",
  label = "Back to home",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <div className="sticky top-[4.75rem] z-20 -mx-4 mb-8 border-b border-ink/10 bg-paper/95 px-4 py-3 backdrop-blur sm:top-[5.25rem] sm:-mx-6 sm:px-6">
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-sage transition hover:text-sage-dark"
      >
        <span aria-hidden>←</span>
        {label}
      </Link>
    </div>
  );
}
