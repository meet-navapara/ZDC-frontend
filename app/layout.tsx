import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/PostHogProvider";
import { Toaster } from "@/components/Toaster";

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
  title: {
    default: "zimji — AI Virtual Try-On for Outfits, Hairstyles & Hair Color",
    template: "%s | zimji",
  },
  description:
    "zimji is the AI virtual try-on platform for apparel, hairstyles, hair color, and beards. Upload a selfie, preview photorealistic looks in seconds, and pay with M-Pesa or Razorpay — built for shoppers, boutiques, and salons.",
  keywords: [
    "AI virtual try-on",
    "virtual outfit try-on",
    "AI hairstyle try-on",
    "AI hair color try-on",
    "AI beard try-on",
    "virtual fitting room",
    "try before you buy",
    "photorealistic try-on",
    "fashion boutique try-on",
    "salon hairstyle preview",
    "online clothing try-on",
    "zimji",
    "M-Pesa try-on",
    "Razorpay try-on",
  ],
  metadataBase: new URL("https://zimji.app"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    apple: [{ url: "/icon", type: "image/png" }],
  },
  openGraph: {
    title: "zimji — AI Virtual Try-On for Outfits & Hairstyles",
    description:
      "See any outfit, hairstyle, hair color, or beard on you in seconds. Photorealistic AI try-on for shoppers, boutiques, and salons.",
    type: "website",
    url: "https://zimji.app",
    siteName: "zimji",
    images: [{ url: "/images/zimji-logo-og.png", alt: "zimji AI virtual try-on" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "zimji — AI Virtual Try-On for Outfits & Hairstyles",
    description:
      "Photorealistic AI outfit and hairstyle try-on. Try before you buy — pay with M-Pesa or Razorpay.",
    images: ["/images/zimji-logo-og.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=localStorage.getItem('zimji_theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(s!=='light'&&d)){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body className="grain relative min-h-screen bg-paper text-ink transition-colors duration-300 dark:bg-[#0f0e0c] dark:text-[#e8e2d8]">
        <PostHogProvider>
          <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="aurora animate-aurora left-[-10%] top-[-15%] h-[42vw] w-[42vw] bg-[#cdd8cf]" />
            <div className="aurora animate-floatSlow right-[-12%] top-[12%] h-[36vw] w-[36vw] bg-[#e7d8c4]" />
          </div>
          {children}
          <Toaster />
        </PostHogProvider>
      </body>
    </html>
  );
}
