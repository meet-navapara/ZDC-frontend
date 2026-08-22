import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { Spotlight } from "@/components/Spotlight";
import { LandingNav } from "@/components/LandingNav";
import { BrandLogo } from "@/components/BrandLogo";
import { getSiteContent } from "@/lib/content";
import { formatDualPrice, getPublicPricing } from "@/lib/pricing";

const categories = [
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
  "Pleats",
  "Box Braids",
  "Afro",
  "Updo",
  "Menswear",
  "Salon Looks",
];

const features = [
  {
    eyebrow: "Virtual Try-On",
    title: "Try it on, instantly.",
    desc: "Upload a selfie and any outfit — zimji renders a photorealistic try-on in seconds, so you see the fit, drape and colour before you buy.",
    // Woman in outfit with shopping bags — apparel try-on
    img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80",
    alt: "Woman in outfit trying on apparel",
    pos: "object-center",
    cta: "Try apparel",
    reverse: false,
  },
  {
    eyebrow: "Hair Studio",
    title: "Every hairstyle, previewed.",
    desc: "Braids, cornrows, locs, pleats and wigs — visualize any style on yourself before your appointment. No more guesswork at the salon.",
    // African man with locs — hairstyle clearly the focus
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    alt: "African man with locs hairstyle",
    pos: "object-top",
    cta: "Try hairstyles",
    reverse: true,
  },
  {
    eyebrow: "For Business",
    title: "A fitting room for your catalog.",
    desc: "Boutiques and salons upload their catalog, and customers try everything on. Cut returns, lift conversion, and see which styles win.",
    // Fashion clothing store interior — boutique/salon context
    img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
    alt: "Fashion boutique store interior",
    pos: "object-center",
    cta: "Explore B2B",
    reverse: false,
  },
];

const steps = [
  { n: "01", title: "Upload", desc: "Add a selfie and the outfit or hairstyle you want to try." },
  { n: "02", title: "Pay", desc: "M-Pesa (Kenya) or Razorpay (India) — pay only for what you render." },
  { n: "03", title: "Reveal", desc: "Your try-on lands instantly in WhatsApp or email." },
];

const b2bSteps = [
  {
    n: "01",
    title: "Upload customer photo",
    desc: "Add one customer selfie from the studio floor, WhatsApp, or your device.",
  },
  {
    n: "02",
    title: "Pick a catalog product",
    desc: "Choose any active outfit or hairstyle from your uploaded business catalog.",
  },
  {
    n: "03",
    title: "Render with credits",
    desc: "1 credit = 1 styled render, ready to download and share instantly.",
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
      {/* ============ NAV ============ */}
      <LandingNav />

      {/* ============ HERO ============ */}
      <Spotlight>
        <section className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-4 pb-16 pt-28 sm:gap-12 sm:px-6 sm:pb-24 sm:pt-36 md:grid-cols-[1fr_1fr] md:pt-44">
          <Reveal className="relative z-10">
            <BrandLogo href={false} size="hero" priority className="mb-4" />
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-ink/10 bg-white/60 px-3 py-1.5 text-[11px] font-medium text-ink-muted sm:px-4 sm:text-xs">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
              <span className="truncate">{hero.badge}</span>
            </div>

            <h1 className="mt-5 font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight text-ink sm:mt-6 sm:text-5xl md:text-[3.75rem]">
              <span className="italic text-sage">Try-On</span>
              {" "}that fits{" "}
              <span className="italic text-sage">you.</span>
            </h1>

            <p className="mt-5 max-w-md text-base text-ink-muted sm:mt-6 sm:text-lg">
              Try it in seconds — no guesswork, no regrets, just instant
              results. See any outfit or hairstyle on yourself before you buy
              or book.
            </p>

            <div className="mt-7 flex w-full flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center sm:gap-4">
              <Link
                href="/try-on"
                className="w-full rounded-full bg-sage px-8 py-3.5 text-center text-base font-semibold text-paper shadow-lg shadow-sage/20 transition hover:bg-sage-dark sm:w-auto"
              >
                {hero.primaryCta}
              </Link>
              <a
                href="#lookbook"
                className="w-full rounded-full border border-ink/15 px-8 py-3.5 text-center text-base font-semibold text-ink transition hover:border-ink/30 hover:bg-white/40 sm:w-auto"
              >
                View the lookbook
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 sm:mt-10 sm:gap-x-8 sm:gap-y-4">
              {hero.stats.map((s) => (
                <div key={s.label}>
                  <div className="font-display text-lg font-semibold text-ink sm:text-xl">
                    {s.value}
                  </div>
                  <div className="text-[11px] text-ink-muted sm:text-xs">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Hero collage */}
          <Reveal delay={140} className="relative z-10">
            <div className="grid grid-cols-2 grid-rows-[auto_auto] gap-3 sm:gap-4">
              {/* Box 1 — top left (before / short hair) */}
              <div className="card overflow-hidden rounded-[1.25rem] bg-white sm:rounded-[1.6rem]">
                <div className="relative aspect-square">
                  <Image
                    src="/images/hero-1.png"
                    alt="Woman in a patterned blue top with short natural hair"
                    fill
                    sizes="(max-width: 768px) 45vw, 260px"
                    className="object-contain object-bottom p-1 sm:p-2"
                  />
                </div>
              </div>
              {/* Box 2 — tall right (after / try-on result) */}
              <div className="card row-span-2 overflow-hidden rounded-[1.25rem] bg-white sm:rounded-[1.6rem]">
                <div className="relative aspect-[3/4.4]">
                  <Image
                    src="/images/hero-3.png"
                    alt="Woman with cornrow curls in a patterned top — try-on result"
                    fill
                    priority
                    sizes="(max-width: 768px) 45vw, 300px"
                    className="object-contain object-bottom p-1 sm:p-2"
                  />
                </div>
              </div>
              {/* Box 3 — bottom left (unchanged) */}
              <div className="card overflow-hidden rounded-[1.25rem] bg-white sm:rounded-[1.6rem]">
                <div className="relative aspect-square">
                  <Image
                    src="/images/hero-2.jpg"
                    alt="Woman with two-tone curls in a yellow top"
                    fill
                    sizes="(max-width: 768px) 45vw, 260px"
                    className="object-cover object-top"
                  />
                </div>
              </div>
            </div>
            <div className="absolute bottom-3 right-2 flex max-w-[calc(100%-1rem)] items-center gap-2 rounded-2xl glass-strong px-3 py-2.5 sm:bottom-6 sm:-right-4 sm:gap-3 sm:px-4 sm:py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage text-sm text-paper sm:h-9 sm:w-9">
                ✓
              </span>
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-ink sm:text-sm">
                  Rendered in 8s
                </div>
                <div className="truncate text-[10px] text-ink-muted sm:text-xs">
                  98% match confidence
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </Spotlight>

      {/* ============ CATEGORY STRIP ============ */}
      <section className="overflow-hidden border-y border-ink/10 bg-white/40">
        <div className="flex w-max animate-marquee gap-x-10 py-5 hover:[animation-play-state:paused] sm:gap-x-14 sm:py-6">
          {[...categories, ...categories].map((c, i) => (
            <span
              key={`${c}-${i}`}
              aria-hidden={i >= categories.length}
              className="shrink-0 font-display text-base italic text-ink-muted sm:text-lg"
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
                  <a
                    href="#how"
                    className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/30 hover:bg-white/50 sm:px-6"
                  >
                    {f.cta}
                  </a>
                  <a
                    href="#how"
                    className="text-sm font-semibold text-sage transition hover:text-sage-dark"
                  >
                    Learn more →
                  </a>
                </div>
              </div>

              <div className="card overflow-hidden rounded-[1.5rem] sm:rounded-[2rem]">
                <div className="relative aspect-[4/3]">
                  <Image
                    src={f.img}
                    alt={f.alt ?? f.title}
                    fill
                    sizes="(max-width: 768px) 90vw, 520px"
                    className={`object-cover ${f.pos ?? "object-center"}`}
                  />
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </section>

      {/* ============ LOOKBOOK ============ */}
      <section id="lookbook" className="border-y border-ink/10 bg-white/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 md:py-28">
          <Reveal className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end sm:gap-6">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sage">
                The Lookbook
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-ink sm:mt-4 sm:text-4xl md:text-5xl">
                Real renders. Runway-ready results.
              </h2>
            </div>
            <p className="max-w-xs text-sm text-ink-muted">
              A glimpse of the photorealistic output zimji delivers — apparel,
              hairstyles and accessories.
            </p>
          </Reveal>

          <div className="mt-10 grid auto-rows-[160px] grid-cols-2 gap-3 sm:mt-14 sm:auto-rows-[240px] sm:gap-4 md:grid-cols-4">
            {[
              // African woman — natural afro portrait (tall card)
              { src: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&q=80", tag: "Natural Afro", kind: "Hairstyle", cls: "row-span-2" },
              // Indian woman — long hair portrait
              { src: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=600&q=80", tag: "Indian Style", kind: "Hairstyle", cls: "" },
              // Indian man — portrait styled hair
              { src: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=600&q=80", tag: "Men's Look", kind: "Apparel", cls: "" },
              // African woman — colourful outfit portrait (tall card)
              { src: "https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?w=600&q=80", tag: "Kenyan Outfit", kind: "Apparel", cls: "row-span-2" },
              // African man — locs hairstyle portrait
              { src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80", tag: "Locs Style", kind: "Hairstyle", cls: "" },
            ].map((item, i) => (
              <Reveal key={item.src} delay={i * 80} className={item.cls}>
                <div className="card group relative h-full w-full overflow-hidden rounded-2xl sm:rounded-3xl">
                  <Image
                    src={item.src}
                    alt={item.tag}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100" />
                  <div className="absolute inset-x-3 bottom-3 translate-y-0 opacity-100 transition sm:inset-x-4 sm:bottom-4 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
                    <span className="text-[10px] uppercase tracking-widest text-paper/80">
                      {item.kind}
                    </span>
                    <div className="font-display text-base font-semibold text-paper sm:text-xl">
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
            Three taps
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl font-semibold text-ink sm:mt-4 sm:text-4xl md:text-5xl">
            From selfie to showstopper.
          </h2>
        </Reveal>

        <p className="mt-10 text-center text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted sm:mt-16">
          For customers
        </p>
        <div className="relative mt-4 grid gap-4 sm:gap-6 md:grid-cols-3">
          <div className="pointer-events-none absolute left-0 right-0 top-14 hidden h-px bg-ink/10 md:block" />
          {steps.map((s, i) => (
            <Reveal key={`b2c-${s.n}`} delay={i * 120}>
              <div className="card relative flex h-full flex-col rounded-2xl p-6 sm:rounded-3xl sm:p-8">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sage font-display text-base font-semibold text-paper sm:h-12 sm:w-12 sm:text-lg">
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
            Customer should not feel like a Gamble while selecting Style.
          </p>
        </div>
        <div className="relative mt-6 grid gap-4 sm:mt-8 sm:gap-6 md:grid-cols-3">
          <div className="pointer-events-none absolute left-0 right-0 top-14 hidden h-px bg-ink/10 md:block" />
          {b2bSteps.map((s, i) => (
            <Reveal key={`b2b-${s.n}`} delay={i * 120}>
              <div className="card relative flex h-full flex-col rounded-2xl p-6 sm:rounded-3xl sm:p-8">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sage font-display text-base font-semibold text-paper sm:h-12 sm:w-12 sm:text-lg">
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
      <section id="business" className="border-y border-ink/10 bg-white/40">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 pb-20 sm:gap-12 sm:px-6 sm:py-20 sm:pb-24 md:grid-cols-2 md:py-28 md:pb-28">
          <Reveal className="relative order-2 md:order-1">
            <div className="card overflow-hidden rounded-[1.5rem] sm:rounded-[2rem]">
              <div className="relative aspect-[4/3]">
                <Image
                  src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80"
                    alt="Women shopping in fashion boutique"
                  fill
                  sizes="(max-width: 768px) 90vw, 520px"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="absolute -bottom-5 right-3 w-[min(14rem,70%)] rounded-2xl glass-strong p-4 sm:-bottom-6 sm:right-4 sm:w-56 sm:p-5 md:-right-4 lg:-right-8">
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
              For Boutiques &amp; Salons
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-ink sm:mt-4 sm:text-4xl md:text-5xl">
              Turn browsers into buyers.
            </h2>
            <p className="mt-4 text-sm text-ink-muted sm:mt-5 sm:text-base">
              Give every customer a fitting room in their pocket. Showcase your
              catalog, cut return rates, and see exactly which styles convert —
              all from a dashboard that carries your brand.
            </p>
            <ul className="mt-6 space-y-3 sm:mt-8">
              {[
                "Multi-branch catalogs with up to 10 categories",
                "Prepaid credits — 1 credit = 1 render",
                "Analytics: popular styles, conversion, engagement",
                "Excel exports & credit top-ups in a tap",
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
            Simple, fair pricing
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl font-semibold text-ink sm:mt-4 sm:text-4xl md:text-5xl">
            Pay only for the looks you love.
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:mt-14 sm:gap-6 md:grid-cols-3">
          <Reveal>
            <div className="card flex h-full flex-col rounded-2xl p-6 sm:rounded-3xl sm:p-8">
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
            <div className="flex h-full flex-col rounded-2xl bg-sage p-6 text-paper shadow-xl shadow-sage/25 sm:rounded-3xl sm:p-8">
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
            <div className="card flex h-full flex-col rounded-2xl p-6 sm:rounded-3xl sm:p-8">
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
        <section className="border-y border-ink/10 bg-white/40">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
            <Reveal className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sage">
                Loved by our community
              </p>
              <h2 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-semibold text-ink sm:text-5xl">
                What people are saying.
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
            <div className="aurora animate-aurora left-[8%] top-[-30%] h-[26vw] w-[26vw] bg-sage/40" />
            <div className="aurora animate-floatSlow right-[6%] bottom-[-30%] h-[22vw] w-[22vw] bg-[#e7d8c4]/30" />
            <h2 className="relative z-10 mx-auto max-w-2xl font-display text-3xl font-semibold sm:text-4xl md:text-5xl">
              Your next look is one tap away.
            </h2>
            <p className="relative z-10 mx-auto mt-4 max-w-md text-sm text-paper/70 sm:text-base">
              Join the try-before-you-buy revolution reshaping fashion and beauty
              across Africa.
            </p>
            <Link
              href="/try-on"
              className="relative z-10 mt-7 inline-flex w-full max-w-xs items-center justify-center rounded-full bg-sage px-9 py-3.5 text-base font-semibold text-paper transition hover:bg-sage-dark sm:mt-8 sm:w-auto sm:py-4"
            >
              Try On Instantly
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ============ FOOTER ============ */}
      <footer id="contact" className="border-t border-ink/10 bg-white/40">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <BrandLogo href="/" size="lg" />
              <p className="mt-3 max-w-xs text-sm text-ink-muted">
                Style, smarter. AI virtual try-on for apparel and hairstyles.
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
          <div className="mt-8 border-t border-ink/10 pt-5 text-center text-xs text-ink-muted sm:mt-10 sm:pt-6">
            © {new Date().getFullYear()} zimji — Style, Smarter!
          </div>
        </div>
      </footer>
    </main>
  );
}
