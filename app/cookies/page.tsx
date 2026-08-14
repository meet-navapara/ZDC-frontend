import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { BrandLogo } from "@/components/BrandLogo";

export const metadata = {
  title: "B2C Cookies Policy | zimji",
  description:
    "zimji B2C Consumers Cookies Policy — how we use cookies on the virtual try-on platform.",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-28">
      <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-muted sm:text-[15px]">
        {children}
      </div>
    </section>
  );
}

export default function CookiesPolicyPage() {
  return (
    <main className="min-h-screen bg-paper">
      <AppHeader />
      <article className="mx-auto max-w-3xl px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-32">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage">
          Legal
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
          B2C Consumers Cookies Policy
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          zimji B2C – Cookies Policy
        </p>
        <p className="mt-1 text-xs text-ink-muted">Last Updated: August 2026</p>

        <div className="mt-10 space-y-10">
          <Section title="1. What Are Cookies?">
            <p>
              Cookies are small text files stored on your device when you visit a
              website. They help us understand how you use our site and improve
              your experience.
            </p>
          </Section>

          <Section title="2. Cookies We Use">
            <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-ink/10 bg-ink/[0.03] text-xs uppercase tracking-wider text-ink-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Purpose</th>
                    <th className="px-4 py-3 font-semibold">Example</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10 text-ink">
                  <tr>
                    <td className="px-4 py-3 font-medium">Essential Cookies</td>
                    <td className="px-4 py-3 text-ink-muted">
                      Enable basic website functionality (navigation, page
                      loading)
                    </td>
                    <td className="px-4 py-3 text-ink-muted">Session cookies</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Functional Cookies</td>
                    <td className="px-4 py-3 text-ink-muted">
                      Remember your preferences and settings
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      Language preference
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Analytical Cookies</td>
                    <td className="px-4 py-3 text-ink-muted">
                      Understand how visitors use our site to improve it
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      Google Analytics (anonymized)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="3. Your Choice">
            <p>
              You can control cookies through your browser settings. You may
              refuse all non-essential cookies. However, essential cookies are
              required for the website to function properly.
            </p>
            <p>
              We do{" "}
              <span className="font-semibold text-ink">NOT</span> use
              advertising/tracking cookies for B2C users without explicit
              consent.
            </p>
          </Section>

          <Section title="4. Third-Party Cookies">
            <p>We use minimal third-party services:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-semibold text-ink">PerfectCorp.com:</span>{" "}
                For AI rendering (no cookies stored)
              </li>
              <li>
                <span className="font-semibold text-ink">
                  M-Pesa / UPI / Card — Visa / Mastercard:
                </span>{" "}
                For payment processing (governed by their own policy)
              </li>
            </ul>
          </Section>

          <Section title="5. Updates to This Policy">
            <p>
              We may update this policy periodically. Continued use of the
              website constitutes acceptance of any changes.
            </p>
          </Section>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-6">
          <BrandLogo href="/" size="sm" />
          <div className="flex flex-wrap gap-4 text-sm font-semibold">
            <Link href="/privacy" className="text-sage hover:text-sage-dark">
              Privacy &amp; Terms
            </Link>
            <Link href="/" className="text-sage hover:text-sage-dark">
              ← Back to home
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
