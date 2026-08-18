import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";

export const metadata = {
  title: "Terms of Service | zimji",
  description:
    "zimji B2C Terms of Service — rules for using the virtual try-on platform.",
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

export default function TermsPage() {
  return (
    <main className="flex min-h-screen flex-col bg-paper dark:bg-[#0c0b09]">
      <AppHeader />
      <article className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-32">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage">
          Legal
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          zimji Virtual Try-On Platform – B2C Terms
        </p>
        <p className="mt-1 text-xs text-ink-muted">Last Updated: August 2026</p>

        <div className="mt-10 space-y-10">
          <Section title="1. Introduction">
            <p>
              zimji (“we”, “us”, “our”) provides an AI Virtual Try-On Platform
              for consumers (“B2C Service”). These Terms of Service explain how
              we collect, use, and protect your information when you use the
              Service, and the rules that govern your use of it, in compliance
              with the Kenya Data Protection Act, 2019 and the India Digital
              Personal Data Protection Act, 2023.
            </p>
            <p>
              <span className="font-semibold text-ink">Data Controller:</span>{" "}
              Zimji.com
              <br />
              <span className="font-semibold text-ink">Contact:</span>{" "}
              <a
                href="mailto:jirani.deal@gmail.com"
                className="font-semibold text-sage hover:text-sage-dark"
              >
                jirani.deal@gmail.com
              </a>
            </p>
          </Section>

          <Section title="2. Data We Collect">
            <p>
              When you use the zimji B2C Service, we collect the following
              minimal personal data:
            </p>
            <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white dark:border-white/10 dark:bg-[#14120f]">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-ink/10 bg-ink/[0.03] text-xs uppercase tracking-wider text-ink-muted dark:border-white/10 dark:bg-white/5">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Data Collected</th>
                    <th className="px-4 py-3 font-semibold">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10 text-ink">
                  <tr>
                    <td className="px-4 py-3 font-medium">Identity Data</td>
                    <td className="px-4 py-3 text-ink-muted">
                      Name (optional), Phone Number (for WhatsApp delivery),
                      Email Address
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      To deliver try-on results
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Photo Data</td>
                    <td className="px-4 py-3 text-ink-muted">
                      Selfie photo uploaded by you
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      For AI try-on rendering
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Transaction Data</td>
                    <td className="px-4 py-3 text-ink-muted">
                      M-Pesa transaction reference
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      To confirm payment
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Technical Data</td>
                    <td className="px-4 py-3 text-ink-muted">
                      Device type, browser, IP address
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      To improve user experience
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              We <span className="font-semibold text-ink">DO NOT</span> store
              your photos on our servers. Your uploaded photo is processed
              temporarily for AI rendering and is automatically deleted after
              the try-on result is delivered to you.
            </p>
          </Section>

          <Section title="3. How We Use Your Data">
            <p>
              We process your personal data only for the following lawful
              purposes under Section 30 of the Kenya DPA:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-semibold text-ink">To provide the Service:</span>{" "}
                Process your photo through the AI engine and deliver try-on
                results via WhatsApp/email.
              </li>
              <li>
                <span className="font-semibold text-ink">To process payments:</span>{" "}
                Verify M-Pesa/UPI/Card transactions.
              </li>
              <li>
                <span className="font-semibold text-ink">To send marketing offers:</span>{" "}
                With your explicit consent, we may send you promotional offers
                about fashion, hairstyles, and zimji services via WhatsApp, SMS,
                or email. You may withdraw this consent at any time.
              </li>
              <li>
                <span className="font-semibold text-ink">To improve our Service:</span>{" "}
                Analyze anonymized usage patterns.
              </li>
            </ul>
            <p>
              We do <span className="font-semibold text-ink">NOT</span> share your
              personal data or photos with any third party, except:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                PerfectCorp.com API (for AI rendering – your photo is
                transmitted securely and not stored)
              </li>
              <li>
                M-Pesa Daraja API / UPI / Card — Visa / Mastercard / American
                Express (for payment processing only)
              </li>
              <li>
                WhatsApp/Email delivery services (to send you results) if you
                opt for it
              </li>
            </ul>
          </Section>

          <Section title="4. Your Rights">
            <p>
              Under the Kenya DPA and India DPDP Act, you have the following
              rights:
            </p>
            <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white dark:border-white/10 dark:bg-[#14120f]">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="border-b border-ink/10 bg-ink/[0.03] text-xs uppercase tracking-wider text-ink-muted dark:border-white/10 dark:bg-white/5">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Right</th>
                    <th className="px-4 py-3 font-semibold">What It Means</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10 text-ink">
                  <tr>
                    <td className="px-4 py-3 font-medium">Right to Access</td>
                    <td className="px-4 py-3 text-ink-muted">
                      Request a copy of your personal data we hold
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">
                      Right to Rectification
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      Correct inaccurate or incomplete data
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Right to Erasure</td>
                    <td className="px-4 py-3 text-ink-muted">
                      Request deletion of your data (“right to be forgotten”)
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">
                      Right to Withdraw Consent
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      Withdraw consent for marketing communications at any time
                      (withdrawal must be as easy as giving consent)
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Right to Object</td>
                    <td className="px-4 py-3 text-ink-muted">
                      Object to processing of your data
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">
                      Right to Lodge a Complaint
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      Complain to the Office of the Data Protection Commissioner
                      (ODPC) in Kenya or the Data Protection Board of India
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              To exercise these rights, contact us at:{" "}
              <a
                href="mailto:jirani.deal@gmail.com"
                className="font-semibold text-sage hover:text-sage-dark"
              >
                jirani.deal@gmail.com
              </a>
            </p>
          </Section>

          <Section title="5. Data Retention">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-semibold text-ink">Photos:</span> Deleted
                immediately after try-on result delivery.
              </li>
              <li>
                <span className="font-semibold text-ink">Transaction records:</span>{" "}
                Retained for 5 years for tax and audit compliance.
              </li>
              <li>
                <span className="font-semibold text-ink">Contact details:</span>{" "}
                Retained only if you have consented to receive marketing
                communications. You may unsubscribe at any time.
              </li>
            </ul>
          </Section>

          <Section title="6. Data Security">
            <p>
              We implement appropriate technical and organizational measures to
              protect your personal data against unauthorized access, alteration,
              disclosure, or destruction, in compliance with Section 25 of the
              Kenya DPA and Rule 6 of the India DPDP Rules.
            </p>
          </Section>

          <Section title="7. Cookies">
            <p>
              We use essential cookies to enable basic website functionality. For
              details, see our{" "}
              <Link
                href="/cookies"
                className="font-semibold text-sage hover:text-sage-dark"
              >
                Cookie Policy
              </Link>
              .
            </p>
          </Section>

          <Section title="8. Your commitments">
            <p>By using zimji B2C Service, you agree to:</p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Upload only photos of yourself or for which you have consent.
              </li>
              <li>
                Pay the applicable fee via M-Pesa/UPI/Card before receiving
                results (unless redeemed via a free try-on reward).
              </li>
              <li>Not use the Service for any unlawful purpose.</li>
              <li>
                Accept that AI-generated try-on results are for visualization
                purposes only and may not be 100% accurate representations.
              </li>
            </ol>
            <p>
              <span className="font-semibold text-ink">Limitation of Liability:</span>{" "}
              zimji is not liable for any decisions you make based on try-on
              results. The Service is provided “as is.”
            </p>
          </Section>

          <Section title="9. Updates to these Terms">
            <p>
              We may update these Terms periodically. We will notify you of
              material changes via email or website notice.
            </p>
            <p className="rounded-2xl border border-ink/10 bg-white p-4 text-ink dark:border-white/10 dark:bg-[#14120f] sm:p-5">
              By using the Zimji.com platform, you confirm that you have fully
              read, understood, and agreed to all the terms and conditions
              outlined above, and you commit to comply with them strictly and
              without deviation. You further acknowledge that your participation
              is voluntary and of your own free will, with no coercion or undue
              influence from any party.
            </p>
            <p className="text-xs uppercase tracking-wider text-ink-muted">
              End of document
            </p>
          </Section>
        </div>
      </article>
    </main>
  );
}
