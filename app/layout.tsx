import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/PostHogProvider";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "zimji — Style, Smarter!",
  description:
    "The AI virtual try-on atelier for apparel and hairstyles. See it on you before you buy — powered by AI, delivered via WhatsApp.",
  metadataBase: new URL("https://zimji.app"),
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    apple: [{ url: "/icon", type: "image/png" }],
  },
  openGraph: {
    title: "zimji — Style, Smarter!",
    description:
      "AI virtual try-on for apparel and hairstyles. Try before you buy.",
    type: "website",
    images: [{ url: "/images/zimji-logo-og.png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=localStorage.getItem('zimji_theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(s!=='light'&&d)){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body className="grain relative min-h-screen bg-paper text-ink transition-colors duration-300 dark:bg-[#0f0e0c] dark:text-[#e8e2d8]">
        <PostHogProvider>
          {/* Global soft backdrop */}
          <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="aurora animate-aurora left-[-10%] top-[-15%] h-[42vw] w-[42vw] bg-[#cdd8cf]" />
            <div className="aurora animate-floatSlow right-[-12%] top-[12%] h-[36vw] w-[36vw] bg-[#e7d8c4]" />
          </div>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
