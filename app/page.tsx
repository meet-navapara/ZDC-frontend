import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { LandingNav } from "@/components/LandingNav";
import { BrandLogo } from "@/components/BrandLogo";
import { TransformationShowcase } from "@/components/TransformationShowcase";
import { getSiteContent } from "@/lib/content";
import { formatDualPrice, getPublicPricing } from "@/lib/pricing";

const categories = [
  "AI Outfit Try-On",
  "AI Hairstyle Try-On",
  "Hair Color Try-On",
  "Beard Try-On",
  "Braids",
  "Cornrows",
  "Locs",
  "Wigs",
  "Ankara",
  "Evening Wear",
  "Suits",
  "Streetwear",
  "Bridal",
  "Saree",
  "Lehenga",
  "Kurta",
  "Sherwani",
  "Kitenge",
  "Dashiki",
  "Box Braids",
  "Afro",
  "Salon Looks",
  "Boutique Catalog",
  "Virtual Fitting Room",
];

const features = [
  {
    eyebrow: "AI Outfit Try-On",
    title: "See the outfit on you — before you buy.",
    desc: "Upload a selfie and any clothing reference. zimji’s AI virtual try-on renders a photorealistic preview of fit, drape, and colour in seconds so shoppers stop guessing and start buying with confidence.",
    img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80",
    alt: "AI virtual outfit try-on preview on a fashion shopper",
    pos: "object-center",
    cta: "Try AI outfit try-on",
    ctaHref: "/try-on",
    reverse: false,
  },
  {
    eyebrow: "AI Hairstyle & Color Try-On",
    title: "Preview braids, locs, color & beards.",
    desc: "From cornrows and wigs to AI hair color try-on and beard styles — visualize the full look on your face before you book the salon chair. Less risk, more wow.",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    alt: "AI hairstyle try-on preview with locs",
    pos: "object-top",
    cta: "Try AI hairstyle try-on",
    ctaHref: "/try-on",
    reverse: true,
  },
  {
    eyebrow: "For Boutiques & Salons",
    title: "A virtual fitting room for your catalog.",
    desc: "Fashion boutiques and hair salons upload products once. Customers run AI try-on from your catalog, you cut returns, lift conversion, and see which styles win — all on prepaid credits.",
    img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
    alt: "Fashion boutique using virtual try-on for catalog",
    pos: "object-center",
    cta: "Explore business try-on",
    ctaHref: "/register?as=business",
    reverse: false,
  },
];

const steps = [
  {
    n: "01",
    title: "Upload your selfie",
    desc: "Add a clear photo plus the outfit, hairstyle, hair color, or beard look you want to try.",
  },
  {
    n: "02",
    title: "Pay in a tap",
    desc: "M-Pesa in Kenya or Razorpay in India — pay only for the AI try-on renders you run.",
  },
  {
    n: "03",
    title: "Get your AI look",
    desc: "Photorealistic results appear in seconds — download, share, then buy or book with confidence.",
  },
];

const b2bSteps = [
  {
    n: "01",
    title: "Upload customer photo",
    desc: "Capture a selfie on the shop floor, WhatsApp, or device — one photo powers the try-on.",
  },
  {
    n: "02",
    title: "Pick from your catalog",
    desc: "Choose an active outfit or hairstyle product from your boutique or salon catalog.",
  },
  {
    n: "03",
    title: "Render with credits",
    desc: "1 credit = 1 AI try-on render — ready to download, share, and close the sale.",
  },
];

const iconClass = "h-4 w-4";

const SOCIAL_LINKS = [
  {
    label: "WhatsApp",
    href: process.env.NEXT_PUBLIC_SOCIAL_WHATSAPP || "https://wa.me/",
    icon: (
      <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor" aria-hidden>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.85 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || "https://www.instagram.com/",
    icon: (
      <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor" aria-hidden>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || "https://www.facebook.com/",
    icon: (
      <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor" aria-hidden>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
];

export default async function Home() {
  const [content, pricing] = await Promise.all([
    getSiteContent(),
    getPublicPricing(),
  ]);
  const { hero, testimonials, pricingNote } = content;
  const singlePack = pricing.packs.find((p) => p.id === "single") || pricing.packs[0];
  const trioPack = pricing.packs.find((p) => p.id === "trio") || pricing.packs[1];
  const starterCredit =
    pricing.creditPacks?.find((p) => p.id === "starter") || pricing.creditPacks?.[0];
  const singlePrice = singlePack ? formatDualPrice(singlePack) : null;
  const trioPrice = trioPack ? formatDualPrice(trioPack) : null;
  const creditPrice = starterCredit ? formatDualPrice(starterCredit) : null;

  return (
    <main className="relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "zimji",
            applicationCategory: "LifestyleApplication",
            operatingSystem: "Web",
            description:
              "AI virtual try-on platform for outfits, hairstyles, hair color, and beards. Photorealistic previews for shoppers, boutiques, and salons.",
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "KES",
              lowPrice: String(singlePack?.amount ?? 20),
              highPrice: String(trioPack?.amount ?? singlePack?.amount ?? 50),
              offerCount: 2,
              offers: [
                {
                  "@type": "Offer",
                  priceCurrency: "KES",
                  price: String(singlePack?.amount ?? 20),
                  description: "Single AI virtual try-on (Kenya · M-Pesa)",
                },
                {
                  "@type": "Offer",
                  priceCurrency: "INR",
                  price: String(
                    singlePack?.amountInr ?? singlePack?.amount ?? 49
                  ),
                  description: "Single AI virtual try-on (India · Razorpay)",
                },
              ],
            },
            keywords:
              "AI virtual try-on, virtual outfit try-on, AI hairstyle try-on, hair color try-on, beard try-on, boutique, salon",
            url: "https://zimji.app",
          }),
        }}
      />
      {/* ============ NAV ============ */}
      <LandingNav />

      {/* ============ HERO ============ */}
        <section className="relative mx-auto flex max-w-6xl items-center justify-center px-4 pb-10 pt-28 sm:px-6 sm:pb-12 sm:pt-32 lg:min-h-[100svh] lg:pb-12 lg:pt-36">
          <div className="hero-duo grid w-full grid-cols-1 items-center justify-items-stretch gap-8 sm:gap-9 lg:max-w-[62rem] lg:grid-cols-[minmax(0,1.2fr)_auto] lg:items-stretch lg:gap-8">
          <Reveal className="relative z-10 order-1 flex w-full min-w-0 lg:h-full">
            <h1 className="sr-only">
              AI Virtual Try-On for outfits and hair — upload a photo, pay via
              M-Pesa or Razorpay, get an instant AI try-on
            </h1>

            <div className="hero-action-card relative flex h-full w-full flex-col overflow-hidden rounded-[1.5rem] border border-ink/10 bg-gradient-to-br from-white via-white to-[#f4f7f5] p-4 shadow-[0_20px_50px_-28px_rgba(28,26,22,0.32),0_0_0_1px_rgba(92,122,104,0.06)] backdrop-blur-sm sm:rounded-[1.75rem] sm:p-5 dark:border-white/10 dark:from-[#181511] dark:via-[#181511] dark:to-[#1a201c]">
              <div
                className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-sage/[0.14] blur-2xl dark:bg-sage/[0.2]"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-[#e8c4b4]/35 blur-2xl dark:bg-[#5c3d32]/25"
                aria-hidden
              />

              <div className="relative flex flex-1 flex-col gap-3 sm:gap-4">
                <div className="flex justify-start">
                  <span className="inline-flex items-center rounded-full bg-sage px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-paper shadow-md shadow-sage/25 sm:px-4 sm:text-[11px]">
                    Try On Instantly
                  </span>
                </div>

                <div className="relative w-full space-y-1.5 sm:space-y-2">
                  <Link
                    href="/try-on"
                    className="group relative flex items-center gap-2.5 rounded-xl border border-ink/[0.06] bg-white/90 px-2.5 py-2 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] transition hover:-translate-y-0.5 hover:border-sage/25 hover:shadow-[0_8px_20px_-14px_rgba(92,122,104,0.45)] dark:border-white/10 dark:bg-[#1f1c18]/90 dark:shadow-none sm:gap-3.5 sm:rounded-2xl sm:px-3.5 sm:py-3"
                  >
                    <span className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage text-paper shadow-sm shadow-sage/30 ring-4 ring-white dark:ring-[#181511] sm:h-10 sm:w-10">
                      <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-[17px] sm:w-[17px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8.5A2.5 2.5 0 016.5 6h2.1l1.2-1.8A1.5 1.5 0 0111 3.5h2a1.5 1.5 0 011.2.7L15.4 6h2.1A2.5 2.5 0 0120 8.5v8A2.5 2.5 0 0117.5 19h-11A2.5 2.5 0 014 16.5v-8z" />
                        <circle cx="12" cy="12.5" r="3.2" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1 text-left text-[12px] font-semibold leading-snug text-ink sm:text-sm">
                      Upload Your Photo
                    </span>
                    <span className="hidden text-ink/30 transition group-hover:translate-x-0.5 group-hover:text-sage sm:inline" aria-hidden>
                      ›
                    </span>
                  </Link>

                  <Link
                    href="/try-on"
                    className="group relative flex items-center gap-2.5 rounded-xl border border-ink/[0.06] bg-white/90 px-2.5 py-2 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] transition hover:-translate-y-0.5 hover:border-sage/25 hover:shadow-[0_8px_20px_-14px_rgba(92,122,104,0.45)] dark:border-white/10 dark:bg-[#1f1c18]/90 dark:shadow-none sm:gap-3.5 sm:rounded-2xl sm:px-3.5 sm:py-3"
                  >
                    <span className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage text-paper shadow-sm shadow-sage/30 ring-4 ring-white dark:ring-[#181511] sm:h-10 sm:w-10">
                      <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-[17px] sm:w-[17px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                        <rect x="3" y="6" width="18" height="12" rx="2.2" />
                        <path strokeLinecap="round" d="M3 10h18" />
                        <path strokeLinecap="round" d="M7 14.5h4" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1 text-left text-[12px] font-semibold leading-snug text-ink sm:text-sm">
                      Pay via M-Pesa or Razorpay
                    </span>
                    <span className="hidden text-ink/30 transition group-hover:translate-x-0.5 group-hover:text-sage sm:inline" aria-hidden>
                      ›
                    </span>
                  </Link>

                  <Link
                    href="/try-on"
                    className="group relative flex items-center gap-2.5 rounded-xl border border-ink/[0.06] bg-white/90 px-2.5 py-2 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] transition hover:-translate-y-0.5 hover:border-sage/25 hover:shadow-[0_8px_20px_-14px_rgba(92,122,104,0.45)] dark:border-white/10 dark:bg-[#1f1c18]/90 dark:shadow-none sm:gap-3.5 sm:rounded-2xl sm:px-3.5 sm:py-3"
                  >
                    <span className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage text-paper shadow-sm shadow-sage/30 ring-4 ring-white dark:ring-[#181511] sm:h-10 sm:w-10">
                      <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-[17px] sm:w-[17px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                        <rect x="3.5" y="5" width="17" height="14" rx="2.2" />
                        <circle cx="9" cy="11" r="2" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 16.5l3.2-3.2a1.2 1.2 0 011.6 0L14 16l1.4-1.4a1.2 1.2 0 011.6 0l2 2" />
                        <path strokeLinecap="round" d="M17.5 8.2l.7.7M19.5 8.2l-.7.7M18.2 6.8v2.2" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1 text-left text-[12px] font-semibold leading-snug text-ink sm:text-sm">
                      Get Instant AI Try-On
                    </span>
                    <span className="hidden text-ink/30 transition group-hover:translate-x-0.5 group-hover:text-sage sm:inline" aria-hidden>
                      ›
                    </span>
                  </Link>
                </div>

                <div className="flex flex-col gap-1.5 pt-2.5 sm:gap-2 sm:pt-3">
                  <Link
                    href="/try-on"
                    className="group relative flex items-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-[#f8e8e1] to-[#f0d5c8] p-2.5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-16px_rgba(120,70,50,0.45)] sm:rounded-[1.1rem] sm:p-3.5 dark:from-[#3a2a24] dark:to-[#2e211c]"
                  >
                    <span className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/40 blur-xl dark:bg-white/5" aria-hidden />
                    <span className="relative min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-display text-[12px] font-semibold leading-snug text-ink sm:text-sm dark:text-[#f4ebe4]">
                          For Consumers
                        </span>
                        <span className="rounded-full bg-white/60 px-1.5 py-[1px] text-[8px] font-semibold uppercase tracking-wider text-ink/60 sm:text-[9px] dark:bg-white/10 dark:text-[#e8d5c8]/70">
                          Free to start
                        </span>
                      </span>
                      <span className="mt-1 block text-[9px] leading-relaxed text-ink/70 sm:text-[11px] dark:text-[#e8d5c8]/80">
                        Try outfits, hairstyles, hair colour &amp; beards on your
                        own selfie before you buy — photorealistic results in
                        seconds, no app download needed.
                      </span>
                      <span className="mt-1 block text-[8px] font-medium leading-relaxed text-ink/55 sm:text-[10px] dark:text-[#e8d5c8]/65">
                        Upload one photo · Pick any look · Pay per try-on with
                        M-Pesa or Razorpay
                      </span>
                    </span>
                    <span className="relative shrink-0 self-center whitespace-nowrap rounded-full bg-white/70 px-2.5 py-1 text-[9px] font-semibold text-ink/70 transition group-hover:bg-white group-hover:text-ink sm:text-[11px] dark:bg-white/10 dark:text-[#f4ebe4]/80 dark:group-hover:bg-white/20">
                      Start try-on ›
                    </span>
                  </Link>

                  <Link
                    href="/register?as=business"
                    className="group relative flex items-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-[#e4eee8] to-[#d2e0d8] p-2.5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-16px_rgba(47,93,80,0.5)] sm:rounded-[1.1rem] sm:p-3.5 dark:from-[#243029] dark:to-[#1c2721]"
                  >
                    <span className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/50 blur-xl dark:bg-white/5" aria-hidden />
                    <span className="relative min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-display text-[12px] font-semibold leading-snug text-ink sm:text-sm dark:text-[#e6efe8]">
                          For Boutiques &amp; Salons
                        </span>
                        <span className="rounded-full bg-white/60 px-1.5 py-[1px] text-[8px] font-semibold uppercase tracking-wider text-ink/60 sm:text-[9px] dark:bg-white/10 dark:text-[#c9d8cf]/70">
                          Prepaid credits
                        </span>
                      </span>
                      <span className="mt-1 block text-[9px] leading-relaxed text-ink/70 sm:text-[11px] dark:text-[#c9d8cf]/80">
                        Upload your catalog once and let customers try it on
                        in-store or online — lift conversions, cut returns, and
                        see which styles actually sell.
                      </span>
                      <span className="mt-1 block text-[8px] font-medium leading-relaxed text-ink/55 sm:text-[10px] dark:text-[#c9d8cf]/65">
                        Bulk upload · Staff try-on dashboard · Usage analytics
                        &amp; invoices
                      </span>
                    </span>
                    <span className="relative shrink-0 self-center whitespace-nowrap rounded-full bg-white/70 px-2.5 py-1 text-[9px] font-semibold text-ink/70 transition group-hover:bg-white group-hover:text-ink sm:text-[11px] dark:bg-white/10 dark:text-[#e6efe8]/80 dark:group-hover:bg-white/20">
                      Create business ›
                    </span>
                  </Link>
                </div>

                <div className="mt-auto flex items-stretch justify-between gap-1.5 rounded-xl bg-ink/[0.02] px-1.5 py-1.5 dark:bg-white/[0.03] sm:gap-3 sm:px-3 sm:py-2">
                  {hero.stats.map((s) => (
                    <div key={s.label} className="min-w-0 flex-1 text-center">
                      <div className="font-display text-sm font-semibold leading-tight text-ink sm:text-base">
                        {s.value}
                      </div>
                      <div className="mt-0.5 text-[10px] leading-snug text-ink-muted sm:text-[11px]">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          <div className="relative z-10 order-2 flex w-full justify-center lg:w-auto lg:self-stretch">
            <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[65%] w-[75%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sage/[0.12] blur-3xl dark:bg-sage/[0.18]" aria-hidden />
            <TransformationShowcase variant="hero" />
          </div>
          </div>
        </section>

      {/* ============ CATEGORY STRIP ============ */}
      <section className="overflow-hidden bg-white/50 backdrop-blur-sm">
        <div className="flex w-max animate-marquee gap-x-10 py-5 hover:[animation-play-state:paused] sm:gap-x-14 sm:py-6">
          {[...categories, ...categories].map((c, i) => (
            <span
              key={`${c}-${i}`}
              aria-hidden={i >= categories.length}
              className="marquee-tag shrink-0 font-display text-base italic text-ink sm:text-lg"
            >
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* ============ FEATURE ROWS ============ */}
      <section id="features" className="mx-auto max-w-6xl space-y-14 px-4 py-14 sm:px-6 sm:py-20 md:space-y-24 md:py-28">
        {features.map((f) => (
          <Reveal key={f.title}>
            <div
              className={`grid items-center gap-8 md:grid-cols-2 md:gap-10 ${
                f.reverse ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sage">
                  {f.eyebrow}
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-ink sm:mt-4 sm:text-4xl md:text-5xl">
                  {f.title}
                </h2>
                <p className="mt-4 max-w-md text-base text-ink-muted sm:mt-5 sm:text-lg">
                  {f.desc}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-4 sm:mt-8 sm:gap-6">
                  <Link
                    href={f.ctaHref}
                    className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/30 hover:bg-white/50 sm:px-6"
                  >
                    {f.cta}
                  </Link>
                  <Link
                    href={f.ctaHref}
                    className="text-sm font-semibold text-sage transition hover:text-sage-dark"
                  >
                    Learn more →
                  </Link>
                </div>
              </div>

              <div className="img-card feat-img-wrap card overflow-hidden rounded-[1.5rem] sm:rounded-[2rem]">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={f.img}
                    alt={f.alt ?? f.title}
                    fill
                    sizes="(max-width: 768px) 90vw, 520px"
                    className={`object-cover transition duration-700 ease-out group-hover:scale-[1.05] ${f.pos ?? "object-center"}`}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/20 to-transparent" />
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </section>

      {/* ============ LOOKBOOK ============ */}
      <section id="lookbook" className="bg-white/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 md:py-28">
          <Reveal className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end sm:gap-6">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sage">
                AI Try-On Lookbook
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-ink sm:mt-4 sm:text-4xl md:text-5xl">
                Photorealistic virtual try-on results.
              </h2>
            </div>
            <p className="max-w-xs text-sm text-ink-muted">
              Real AI outfit and hairstyle renders from zimji — the virtual
              fitting room for fashion and beauty.
            </p>
          </Reveal>

          <div className="mt-10 grid auto-rows-[160px] grid-cols-2 gap-3 sm:mt-14 sm:auto-rows-[240px] sm:gap-4 md:grid-cols-4">
            {[
              { src: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&q=80", tag: "Natural Afro", kind: "AI Hairstyle Try-On", cls: "row-span-2" },
              { src: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=600&q=80", tag: "Indian Style", kind: "AI Hair Try-On", cls: "" },
              { src: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=600&q=80", tag: "Men's Look", kind: "AI Outfit Try-On", cls: "" },
              { src: "https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?w=600&q=80", tag: "Kenyan Outfit", kind: "AI Outfit Try-On", cls: "row-span-2" },
              { src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80", tag: "Locs Style", kind: "AI Hairstyle Try-On", cls: "" },
            ].map((item, i) => (
              <Reveal key={item.src} delay={i * 100} className={item.cls}>
                <div className="lookbook-card img-card card group relative h-full w-full overflow-hidden rounded-2xl sm:rounded-3xl">
                  <Image
                    src={item.src}
                    alt={`${item.tag} — ${item.kind} on zimji`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition duration-700 group-hover:scale-[1.07]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
                  <div className="lk-overlay absolute inset-x-0 bottom-0 p-3 sm:p-4">
                    <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-paper/75 sm:text-[10px]">
                      {item.kind}
                    </span>
                    <div className="mt-0.5 font-display text-sm font-semibold text-paper sm:text-xl">
                      {item.tag}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 md:py-28">
        <Reveal className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sage">
            How AI try-on works
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl font-semibold text-ink sm:mt-4 sm:text-4xl md:text-5xl">
            From selfie to showstopper in seconds.
          </h2>
        </Reveal>

        <p className="mt-10 text-center text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted sm:mt-16">
          For shoppers
        </p>
        <div className="relative mt-4 grid gap-4 sm:gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={`b2c-${s.n}`} delay={i * 130}>
              <div className="step-card card relative flex h-full flex-col rounded-2xl p-6 sm:rounded-3xl sm:p-8">
                <div className="step-ring flex h-11 w-11 items-center justify-center rounded-full bg-sage font-display text-base font-semibold text-paper sm:h-12 sm:w-12 sm:text-lg">
                  {s.n}
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-ink sm:mt-6 sm:text-2xl">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-ink-muted sm:text-base">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 text-center sm:mt-16">
          <p className="font-display text-2xl font-bold uppercase tracking-[0.12em] text-ink sm:text-3xl md:text-4xl">
            For boutiques &amp; salons
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-base font-medium text-ink-muted sm:mt-4 sm:text-lg md:text-xl">
            Style should never feel like a gamble — let customers try on your catalog with AI first.
          </p>
        </div>
        <div className="relative mt-6 grid gap-4 sm:mt-8 sm:gap-6 md:grid-cols-3">
          {b2bSteps.map((s, i) => (
            <Reveal key={`b2b-${s.n}`} delay={i * 130}>
              <div className="step-card card relative flex h-full flex-col rounded-2xl p-6 sm:rounded-3xl sm:p-8">
                <div className="step-ring flex h-11 w-11 items-center justify-center rounded-full bg-sage font-display text-base font-semibold text-paper sm:h-12 sm:w-12 sm:text-lg">
                  {s.n}
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-ink sm:mt-6 sm:text-2xl">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-ink-muted sm:text-base">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ B2B ============ */}
      <section id="business" className="bg-white/40">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 pb-20 sm:gap-12 sm:px-6 sm:py-20 sm:pb-24 md:grid-cols-2 md:py-28 md:pb-28">
          <Reveal className="relative order-2 md:order-1">
            <div className="img-card feat-img-wrap card overflow-hidden rounded-[1.5rem] sm:rounded-[2rem]">
              <div className="relative aspect-[4/3]">
                <Image
                  src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80"
                  alt="Women shopping in fashion boutique"
                  fill
                  sizes="(max-width: 768px) 90vw, 520px"
                  className="object-cover transition duration-700 hover:scale-[1.03]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/20 to-transparent" />
              </div>
            </div>
            <div className="absolute bottom-3 right-3 w-[min(14rem,calc(100%-1.5rem))] rounded-2xl glass-strong p-4 sm:bottom-4 sm:right-4 sm:w-56 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted">This week</span>
                <span className="rounded-full bg-sage/15 px-2 py-0.5 text-[10px] font-semibold text-sage-dark">
                  +24%
                </span>
              </div>
              <div className="mt-2 font-display text-2xl font-semibold text-ink sm:text-3xl">
                3,910
              </div>
              <div className="text-[10px] uppercase tracking-wider text-ink-muted">
                Try-ons
              </div>
              <div className="mt-3 space-y-2">
                {[
                  ["Goddess Braids", "82%"],
                  ["Ankara Two-piece", "51%"],
                ].map(([name, pct]) => (
                  <div key={name}>
                    <div className="mb-1 flex justify-between text-[11px] text-ink-muted">
                      <span className="truncate pr-2">{name}</span>
                      <span>{pct}</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-ink/10">
                      <div
                        className="h-full rounded-full bg-sage"
                        style={{ width: pct }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={120} className="order-1 md:order-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sage">
              Business AI Try-On
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-ink sm:mt-4 sm:text-4xl md:text-5xl">
              Turn browsers into buyers with virtual try-on.
            </h2>
            <p className="mt-4 text-sm text-ink-muted sm:mt-5 sm:text-base">
              Give every customer a pocket fitting room. Showcase outfits and
              hairstyles, cut return rates, and track which looks convert — from
              a branded dashboard powered by prepaid AI try-on credits.
            </p>
            <ul className="mt-6 space-y-3 sm:mt-8">
              {[
                "Boutique & salon catalogs with AI outfit and hairstyle try-on",
                "Prepaid credits — 1 credit = 1 photorealistic render",
                "Analytics on popular styles, conversion & engagement",
                "Excel exports and instant credit top-ups",
              ].map((t) => (
                <li
                  key={t}
                  className="flex items-start gap-3 text-sm text-ink-700 sm:text-base"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage text-[11px] text-paper">
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <Link
              href="/register?as=business"
              className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-sage px-7 py-3 text-sm font-semibold text-paper transition hover:bg-sage-dark sm:mt-10 sm:w-auto"
            >
              Create a business account
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 md:py-28">
        <Reveal className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sage">
            Try-on pricing
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl font-semibold text-ink sm:mt-4 sm:text-4xl md:text-5xl">
            Pay only for the AI looks you love.
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:mt-14 sm:gap-6 md:grid-cols-3">
          <Reveal>
            <div className="pricing-card card flex h-full flex-col rounded-2xl p-6 sm:rounded-3xl sm:p-8">
              <span className="text-sm text-ink-muted">
                {singlePack?.label || "Single"}
              </span>
              <div className="mt-3 font-display text-4xl font-semibold text-ink sm:text-5xl">
                {singlePrice?.primary || "KES 20"}
              </div>
              {singlePrice?.secondary && (
                <div className="mt-1 text-lg font-medium text-ink-muted">
                  {singlePrice.secondary}
                </div>
              )}
              <p className="mt-2 text-sm text-ink-muted">
                {singlePack?.images || 1} AI try-on render
                {(singlePack?.images || 1) > 1 ? "s" : ""}
              </p>
              <div className="mt-6 flex-1" />
              <a
                href="/try-on"
                className="rounded-full border border-ink/15 py-3 text-center text-sm font-semibold text-ink transition hover:border-ink/30 hover:bg-white/50"
              >
                Choose Single
              </a>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="pricing-card pricing-card-featured flex h-full flex-col rounded-2xl bg-sage p-6 text-paper shadow-xl shadow-sage/30 sm:rounded-3xl sm:p-8">
              <span className="text-sm text-paper/80">
                {trioPack?.label || "Trio"}
              </span>
              <div className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
                {trioPrice?.primary || "KES 50"}
              </div>
              {trioPrice?.secondary && (
                <div className="mt-1 text-lg font-medium text-paper/80">
                  {trioPrice.secondary}
                </div>
              )}
              <p className="mt-2 text-sm text-paper/80">
                {trioPack?.images || 3} AI try-on renders
              </p>
              <span className="mt-4 inline-block w-fit rounded-full bg-paper/20 px-3 py-1 text-xs font-semibold">
                Best value
              </span>
              <div className="mt-6 flex-1" />
              <a
                href="/try-on"
                className="rounded-full bg-paper py-3 text-center text-sm font-semibold text-sage-dark transition hover:bg-white"
              >
                Choose Trio
              </a>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="pricing-card card flex h-full flex-col rounded-2xl p-6 sm:rounded-3xl sm:p-8">
              <span className="text-sm text-ink-muted">Business</span>
              <div className="mt-3 font-display text-4xl font-semibold text-ink sm:text-5xl">
                {creditPrice?.primary || "Credits"}
              </div>
              {creditPrice?.secondary && (
                <div className="mt-1 text-lg font-medium text-ink-muted">
                  {creditPrice.secondary}
                </div>
              )}
              <p className="mt-2 text-sm text-ink-muted">
                {starterCredit
                  ? `${starterCredit.label} — ${starterCredit.credits ?? ""} credits`
                  : "Prepaid packs for boutiques & salons. 1 credit = 1 render."}
              </p>
              <div className="mt-6 flex-1" />
              <a
                href="#business"
                className="rounded-full border border-ink/15 py-3 text-center text-sm font-semibold text-ink transition hover:border-ink/30 hover:bg-white/50"
              >
                Talk to us
              </a>
            </div>
          </Reveal>
        </div>
        <p className="mt-6 text-center text-xs text-ink-muted">
          {pricingNote} Pay with M-Pesa (KES) or Razorpay (INR).
        </p>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      {testimonials.length > 0 && (
        <section className="bg-white/40">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
            <Reveal className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sage">
                Loved by try-on fans
              </p>
              <h2 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-semibold text-ink sm:text-5xl">
                What people say about zimji AI try-on.
              </h2>
            </Reveal>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <Reveal key={`${t.author}-${i}`} delay={i * 80}>
                  <figure className="card flex h-full flex-col rounded-3xl p-8">
                    <blockquote className="flex-1 text-lg leading-relaxed text-ink">
                      “{t.quote}”
                    </blockquote>
                    <figcaption className="mt-6">
                      <div className="font-display text-base font-semibold text-ink">
                        {t.author}
                      </div>
                      {t.role && (
                        <div className="text-sm text-ink-muted">{t.role}</div>
                      )}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ CTA ============ */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 sm:pb-20 md:pb-28">
        <Reveal>
          <div className="relative overflow-hidden rounded-[1.5rem] bg-ink px-5 py-12 text-center text-paper sm:rounded-[2.5rem] sm:px-8 sm:py-20">
            <h2 className="relative z-10 mx-auto max-w-2xl font-display text-3xl font-semibold sm:text-4xl md:text-5xl">
              Your next AI try-on is one tap away.
            </h2>
            <p className="relative z-10 mx-auto mt-4 max-w-md text-sm text-paper/70 sm:text-base">
              Join shoppers, boutiques, and salons using zimji virtual try-on
              for outfits, hairstyles, hair color, and beards — try before you buy.
            </p>
            <Link
              href="/try-on"
              className="relative z-10 mt-7 inline-flex w-full max-w-xs items-center justify-center rounded-full bg-sage px-9 py-3.5 text-base font-semibold text-paper transition hover:bg-sage-dark sm:mt-8 sm:w-auto sm:py-4"
            >
              Start AI Virtual Try-On
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ============ FOOTER ============ */}
      <footer id="contact" className="bg-white/40">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <BrandLogo href="/" size="lg" />
              <p className="mt-3 max-w-xs text-sm text-ink-muted">
                Style, smarter. AI virtual try-on for outfits, hairstyles, hair
                color, and beards — for shoppers, boutiques, and salons.
              </p>
              <div className="mt-5 flex items-center gap-2.5">
                {SOCIAL_LINKS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/12 bg-white text-ink transition hover:border-sage hover:bg-sage hover:text-paper"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-ink-muted sm:gap-x-8">
              <a href="#" className="transition hover:text-ink">
                About
              </a>
              <Link href="/terms" className="transition hover:text-ink">
                Terms
              </Link>
              <Link href="/cookies" className="transition hover:text-ink">
                Cookies
              </Link>
              <Link href="/contact" className="transition hover:text-ink">
                Contact
              </Link>
            </nav>
          </div>
          <div className="mt-8 pt-5 text-center text-xs text-ink-muted sm:mt-10 sm:pt-6">
            © {new Date().getFullYear()} zimji — AI Virtual Try-On · Style, Smarter!
          </div>
        </div>
      </footer>
    </main>
  );
}
